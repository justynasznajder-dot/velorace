import { NextRequest, NextResponse } from 'next/server'
import { deleteObjectsByPath, hasObjectStoreConfig, listObjects, putObject } from '@/lib/objectStore'
import { getAuthUserFromRequest } from '@/lib/serverAuth'
import { getRaceResultsPdfContext, isAllowedResultsRaceId } from '@/lib/raceDb'
import { safeStartlistUploadFileName, startlistBlobPrefix } from '@/lib/startlists'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const MAX_BYTES = 25 * 1024 * 1024

async function listAllBlobsWithPrefix(prefix: string) {
  const out: Awaited<ReturnType<typeof listObjects>>['blobs'] = []
  let cursor: string | undefined
  for (;;) {
    const batch = await listObjects({ prefix, cursor })
    out.push(...batch.blobs)
    if (!batch.hasMore || !batch.cursor) break
    cursor = batch.cursor
  }
  return out
}

function isUuidLike(s: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(s)
}

export async function POST(req: NextRequest, ctx: { params: { id: string } | Promise<{ id: string }> }) {
  const user = getAuthUserFromRequest(req)
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ ok: false, message: 'Brak dostępu.' }, { status: 403 })
  }

  if (!hasObjectStoreConfig()) {
    return NextResponse.json({ ok: false, message: 'Brak konfiguracji R2. Uzupełnij zmienne R2_*.' }, { status: 500 })
  }

  const resolved = ctx.params instanceof Promise ? await ctx.params : ctx.params
  const raceId = typeof resolved?.id === 'string' ? resolved.id.trim() : ''
  if (!raceId || !(await isAllowedResultsRaceId(raceId))) {
    return NextResponse.json({ ok: false, message: 'Nieznany wyscig.' }, { status: 400 })
  }

  const raceCtx = await getRaceResultsPdfContext(raceId)
  if (!raceCtx) {
    return NextResponse.json({ ok: false, message: 'Nie znaleziono wyścigu.' }, { status: 404 })
  }

  let formData: FormData
  try {
    formData = await req.formData()
  } catch {
    return NextResponse.json({ ok: false, message: 'Niepoprawne dane formularza.' }, { status: 400 })
  }

  const categoryIdRaw = formData.get('categoryId')
  const file = formData.get('file')

  const categoryId = typeof categoryIdRaw === 'string' ? categoryIdRaw.trim() : ''
  if (!categoryId || !isUuidLike(categoryId)) {
    return NextResponse.json({ ok: false, message: 'Nieprawidłowy categoryId.' }, { status: 400 })
  }

  if (!(file instanceof Blob)) {
    return NextResponse.json({ ok: false, message: 'Brak pliku.' }, { status: 400 })
  }

  const nameCandidate = typeof (file as unknown as { name?: unknown }).name === 'string' ? ((file as unknown as { name: string }).name) : 'startlist.pdf'
  const safeName = safeStartlistUploadFileName(nameCandidate)

  if (file.size > MAX_BYTES) {
    return NextResponse.json({ ok: false, message: 'Plik za duży (max 25 MB).' }, { status: 400 })
  }

  const folderPrefix = startlistBlobPrefix(raceCtx.slug, raceCtx.raceYear, categoryId)

  try {
    const existing = await listAllBlobsWithPrefix(folderPrefix)
    if (existing.length > 0) {
      await deleteObjectsByPath(existing.map(b => b.pathname))
    }

    const pathname = `${folderPrefix}${safeName}`
    const blob = await putObject(pathname, file, { contentType: 'application/pdf' })

    const publicUrl = blob.downloadUrl || blob.url

    return NextResponse.json({
      ok: true,
      url: publicUrl,
      fileName: safeName,
      pathname: blob.pathname,
    })
  } catch (e) {
    console.error('[startlists/upload]', e)
    return NextResponse.json({ ok: false, message: 'Nie udało się wgrać listy startowej.' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, ctx: { params: { id: string } | Promise<{ id: string }> }) {
  const user = getAuthUserFromRequest(req)
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ ok: false, message: 'Brak dostępu.' }, { status: 403 })
  }

  if (!hasObjectStoreConfig()) {
    return NextResponse.json({ ok: false, message: 'Brak konfiguracji R2. Uzupełnij zmienne R2_*.' }, { status: 500 })
  }

  const resolved = ctx.params instanceof Promise ? await ctx.params : ctx.params
  const raceId = typeof resolved?.id === 'string' ? resolved.id.trim() : ''
  if (!raceId || !(await isAllowedResultsRaceId(raceId))) {
    return NextResponse.json({ ok: false, message: 'Nieznany wyscig.' }, { status: 400 })
  }

  const raceCtx = await getRaceResultsPdfContext(raceId)
  if (!raceCtx) {
    return NextResponse.json({ ok: false, message: 'Nie znaleziono wyścigu.' }, { status: 404 })
  }

  const categoryIdRaw = req.nextUrl.searchParams.get('categoryId')?.trim() || ''
  const categoryId = categoryIdRaw
  if (!categoryId || !isUuidLike(categoryId)) {
    return NextResponse.json({ ok: false, message: 'Nieprawidłowy categoryId.' }, { status: 400 })
  }

  const folderPrefix = startlistBlobPrefix(raceCtx.slug, raceCtx.raceYear, categoryId)

  try {
    const existing = await listAllBlobsWithPrefix(folderPrefix)
    if (existing.length === 0) return NextResponse.json({ ok: true, deleted: 0 })
    await deleteObjectsByPath(existing.map(b => b.pathname))
    return NextResponse.json({ ok: true, deleted: existing.length })
  } catch (e) {
    console.error('[startlists/upload DELETE]', e)
    return NextResponse.json({ ok: false, message: 'Nie udało się usunąć listy startowej.' }, { status: 500 })
  }
}

