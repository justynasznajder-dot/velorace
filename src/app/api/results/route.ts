import { NextRequest, NextResponse } from 'next/server'
import { list } from '@vercel/blob'
import { getDefaultResultsRaceId, getRaceResultsPdfContext, isAllowedResultsRaceId } from '@/lib/raceDb'
import {
  RESULT_CATEGORY_POSITIONS,
  getResultsBlobPrefixCandidates,
  parseResultBlobPathname,
  resultsBlobSlugSegment,
} from '@/lib/results'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function decodeBlobFileName(segment: string) {
  try {
    return decodeURIComponent(segment)
  } catch {
    return segment
  }
}

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

type SlotBest = { url: string; downloadUrl: string; uploadedAt: number; fileName: string }

export async function GET(req: NextRequest) {
  const raceIdParam = req.nextUrl.searchParams.get('raceId')?.trim() || ''
  const raceId = raceIdParam || (await getDefaultResultsRaceId())

  const emptySlots = (n: number) =>
    Object.fromEntries(Array.from({ length: n }, (_, i) => [i + 1, null])) as Record<number, string | null>

  if (!raceId || !(await isAllowedResultsRaceId(raceId))) {
    const urls = emptySlots(5)
    return NextResponse.json(
      { ok: false, message: 'Brak lub nieznany parametr raceId.', urls, downloadUrls: urls, fileNames: urls },
      { status: 400 },
    )
  }

  if (!process.env.BLOB_READ_WRITE_TOKEN?.trim()) {
    const urls = emptySlots(5)
    return NextResponse.json(
      {
        ok: false,
        message:
          'Serwer nie ma BLOB_READ_WRITE_TOKEN — nie można odczytać listy plików z Vercel Blob. Dodaj token do .env.local (lokalnie) lub zmiennych projektu na Vercel.',
        urls,
        downloadUrls: urls,
        fileNames: urls,
        raceId,
      },
      { status: 503 },
    )
  }

  try {
    const ctx = await getRaceResultsPdfContext(raceId)
    if (!ctx) {
      const urls = emptySlots(5)
      return NextResponse.json(
        { ok: false, message: 'Nie znaleziono wyścigu.', urls, downloadUrls: urls, fileNames: urls, raceId },
        { status: 404 },
      )
    }

    const slugSeg = resultsBlobSlugSegment(ctx.slug)
    const mode = ctx.effectiveMode
    const activeSlots = mode === 'category' ? ctx.categorySlots : ctx.waveSlots
    let slotCount =
      activeSlots.length > 0
        ? activeSlots.length
        : RESULT_CATEGORY_POSITIONS.length

    const labels: Record<number, string> = {}
    if (activeSlots.length > 0) {
      for (const s of activeSlots) {
        labels[s.slot] = s.label
      }
    } else {
      for (const p of RESULT_CATEGORY_POSITIONS) {
        labels[p] = `Wyniki — slot ${p}`
      }
    }

    const urls = emptySlots(slotCount) as Record<number, string | null>
    const downloadUrls = { ...urls }
    const fileNames = { ...urls }

    const best = new Map<number, SlotBest>()

    const blobs = (
      await Promise.all(getResultsBlobPrefixCandidates(ctx.raceYear).map(prefix => listAllBlobsWithPrefix(`${prefix}/`)))
    ).flat()

    for (const blob of blobs) {
      const parsed = parseResultBlobPathname(blob.pathname)
      if (!parsed) continue
      const t = new Date(blob.uploadedAt).getTime()

      if (parsed.kind === 'slug') {
        if (parsed.slug !== slugSeg || parsed.mode !== mode) continue
        if (parsed.slotIndex < 1 || parsed.slotIndex > slotCount) continue
        const slot = parsed.slotIndex
        const cur = best.get(slot)
        if (!cur || t > cur.uploadedAt) {
          best.set(slot, {
            url: blob.url,
            downloadUrl: blob.downloadUrl,
            uploadedAt: t,
            fileName: decodeBlobFileName(parsed.fileName),
          })
        }
        continue
      }

      if (parsed.kind === 'legacy' && parsed.raceId === raceId) {
        const slot = parsed.position
        if (slot < 1 || slot > slotCount) continue
        const cur = best.get(slot)
        if (!cur || t > cur.uploadedAt) {
          best.set(slot, {
            url: blob.url,
            downloadUrl: blob.downloadUrl,
            uploadedAt: t,
            fileName: decodeBlobFileName(parsed.fileName),
          })
        }
      }
    }

    for (let s = 1; s <= slotCount; s++) {
      const b = best.get(s)
      urls[s] = b?.url ?? null
      downloadUrls[s] = b?.downloadUrl ?? null
      fileNames[s] = b?.fileName ?? null
    }

    return NextResponse.json({
      ok: true,
      urls,
      downloadUrls,
      fileNames,
      labels,
      resultsPdfMode: mode,
      slotCount,
      raceId,
    })
  } catch (e) {
    console.error('[api/results]', e)
    const urls = emptySlots(5)
    const message =
      e instanceof Error ? e.message : 'Nie udało się pobrać listy plików z Vercel Blob (list).'
    return NextResponse.json(
      { ok: false, message, urls, downloadUrls: urls, fileNames: urls, raceId },
      { status: 500 },
    )
  }
}
