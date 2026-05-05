import { NextRequest, NextResponse } from 'next/server'
import { del, list, put } from '@vercel/blob'
import { getAuthUserFromRequest } from '@/lib/serverAuth'
import { getRaceResultsPdfContext, isAllowedResultsRaceId } from '@/lib/raceDb'
import {
  isPdfUpload,
  isResultCategoryPosition,
  isValidResultsSlotIndex,
  resultCategoryPrefix,
  resultPdfBlobPrefixCandidates,
  resultPdfBlobPrefix,
  safeResultUploadFileName,
  type ResultsPdfSlotMode,
} from '@/lib/results'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const MAX_BYTES = 25 * 1024 * 1024

async function listAllBlobsWithPrefix(prefix: string) {
  const out: Awaited<ReturnType<typeof list>>['blobs'] = []
  let cursor: string | undefined
  for (;;) {
    const batch = await list({ prefix, cursor })
    out.push(...batch.blobs)
    if (!batch.hasMore || !batch.cursor) break
    cursor = batch.cursor
  }
  return out
}

type ResolvedResultsSlot = { folderPrefix: string; folderPrefixesToClear: string[]; mode: ResultsPdfSlotMode }

async function resolveResultsFolderPrefix(
  raceId: string,
  position: number,
  modeRaw: string | null,
): Promise<{ ok: true; value: ResolvedResultsSlot } | { ok: false; status: number; message: string }> {
  if (!raceId || !(await isAllowedResultsRaceId(raceId))) {
    return { ok: false, status: 400, message: 'Nieznany wyscig.' }
  }
  if (!Number.isInteger(position) || position < 1) {
    return { ok: false, status: 400, message: 'Nieprawidlowy numer slotu.' }
  }

  const ctx = await getRaceResultsPdfContext(raceId)
  if (!ctx) {
    return { ok: false, status: 400, message: 'Nie znaleziono wyscigu.' }
  }

  const modeParam = typeof modeRaw === 'string' ? modeRaw.trim() : ''
  const mode: ResultsPdfSlotMode = modeParam === 'wave' ? 'wave' : modeParam === 'category' ? 'category' : ctx.effectiveMode

  if (mode === 'category' && ctx.categorySlots.length === 0 && ctx.waveSlots.length > 0) {
    return { ok: false, status: 400, message: 'Ten wyscig ma tylko fale startu — ustaw tryb „wg fal”.' }
  }
  if (mode === 'wave' && ctx.waveSlots.length === 0 && ctx.categorySlots.length > 0) {
    return { ok: false, status: 400, message: 'Brak fal startu — ustaw tryb „wg kategorii”.' }
  }

  const maxSlot = mode === 'category' ? ctx.categorySlots.length || 5 : ctx.waveSlots.length || 5
  if (ctx.categorySlots.length > 0 || ctx.waveSlots.length > 0) {
    const activeSlots = mode === 'category' ? ctx.categorySlots : ctx.waveSlots
    if (!isValidResultsSlotIndex(position, maxSlot)) {
      return { ok: false, status: 400, message: `Slot musi być od 1 do ${maxSlot} dla wybranego trybu.` }
    }
    const slotLabel = activeSlots.find(s => s.slot === position)?.label
    const folderPrefix = resultPdfBlobPrefix(ctx.slug, mode, position, slotLabel, ctx.raceYear)
    const folderPrefixesToClear = resultPdfBlobPrefixCandidates(ctx.slug, mode, position, slotLabel, ctx.raceYear)
    return { ok: true, value: { folderPrefix, folderPrefixesToClear, mode } }
  }

  if (!isResultCategoryPosition(position)) {
    return { ok: false, status: 400, message: 'Nieznana kategoria (legacy 1–5).' }
  }
  const folderPrefix = resultCategoryPrefix(raceId, position, ctx.raceYear)
  return { ok: true, value: { folderPrefix, folderPrefixesToClear: [folderPrefix], mode } }
}

export async function POST(req: NextRequest) {
  const user = getAuthUserFromRequest(req)
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ ok: false, message: 'Brak dostepu.' }, { status: 403 })
  }

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json(
      { ok: false, message: 'Brak BLOB_READ_WRITE_TOKEN. Skonfiguruj Vercel Blob.' },
      { status: 500 },
    )
  }

  let formData: FormData
  try {
    formData = await req.formData()
  } catch {
    return NextResponse.json({ ok: false, message: 'Niepoprawne dane formularza.' }, { status: 400 })
  }

  const raceIdRaw = formData.get('raceId')
  const positionRaw = formData.get('position')
  const modeRaw = formData.get('mode')
  const file = formData.get('file')

  const raceId = typeof raceIdRaw === 'string' ? raceIdRaw.trim() : ''
  const position = Number(positionRaw)

  if (!(file instanceof Blob)) {
    return NextResponse.json({ ok: false, message: 'Brak pliku.' }, { status: 400 })
  }

  const resolved = await resolveResultsFolderPrefix(raceId, position, typeof modeRaw === 'string' ? modeRaw : null)
  if (!resolved.ok) {
    return NextResponse.json({ ok: false, message: resolved.message }, { status: resolved.status })
  }
  const folderPrefix = resolved.value.folderPrefix

  const originalName = safeResultUploadFileName(file, position)
  if (!isPdfUpload(file, originalName)) {
    return NextResponse.json({ ok: false, message: 'Wymagany plik PDF.' }, { status: 400 })
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json({ ok: false, message: 'Plik za duzy (max 25 MB).' }, { status: 400 })
  }

  try {
    const existing = (
      await Promise.all(resolved.value.folderPrefixesToClear.map(prefix => listAllBlobsWithPrefix(prefix)))
    ).flat()
    if (existing.length > 0) {
      await del(Array.from(new Set(existing.map(b => b.url))))
    }

    const pathname = `${folderPrefix}${originalName}`
    const blob = await put(pathname, file, {
      access: 'public',
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: 'application/pdf',
    })

    return NextResponse.json({
      ok: true,
      fileName: originalName,
      pathname: blob.pathname,
      url: blob.url,
    })
  } catch (e) {
    console.error('[results/upload]', e)
    return NextResponse.json(
      { ok: false, message: 'Nie udalo sie wgrac pliku do Vercel Blob.' },
      { status: 500 },
    )
  }
}

export async function DELETE(req: NextRequest) {
  const user = getAuthUserFromRequest(req)
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ ok: false, message: 'Brak dostepu.' }, { status: 403 })
  }

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json(
      { ok: false, message: 'Brak BLOB_READ_WRITE_TOKEN. Skonfiguruj Vercel Blob.' },
      { status: 500 },
    )
  }

  const raceId = req.nextUrl.searchParams.get('raceId')?.trim() || ''
  const position = Number(req.nextUrl.searchParams.get('position'))
  const mode = req.nextUrl.searchParams.get('mode')

  const resolved = await resolveResultsFolderPrefix(raceId, position, mode)
  if (!resolved.ok) {
    return NextResponse.json({ ok: false, message: resolved.message }, { status: resolved.status })
  }

  try {
    const existing = (
      await Promise.all(resolved.value.folderPrefixesToClear.map(prefix => listAllBlobsWithPrefix(prefix)))
    ).flat()
    if (existing.length === 0) {
      return NextResponse.json({ ok: true, deleted: 0 })
    }
    const uniqueUrls = Array.from(new Set(existing.map(b => b.url)))
    await del(uniqueUrls)
    return NextResponse.json({ ok: true, deleted: uniqueUrls.length })
  } catch (e) {
    console.error('[results/upload DELETE]', e)
    return NextResponse.json(
      { ok: false, message: 'Nie udalo sie usunac pliku z Vercel Blob.' },
      { status: 500 },
    )
  }
}
