import { NextRequest, NextResponse } from 'next/server'
import { del, list } from '@vercel/blob'
import { getAuthUserFromRequest } from '@/lib/serverAuth'
import { getRaceResultsPdfContext } from '@/lib/raceDb'
import { getResultsBlobPrefixCandidates, parseResultBlobPathname, resultsBlobSlugSegment } from '@/lib/results'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

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

export async function DELETE(req: NextRequest, ctx: { params: { id: string } | Promise<{ id: string }> }) {
  const user = getAuthUserFromRequest(req)
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ ok: false, message: 'Brak dostępu.' }, { status: 403 })
  }

  if (!process.env.BLOB_READ_WRITE_TOKEN?.trim()) {
    return NextResponse.json(
      { ok: false, message: 'Brak BLOB_READ_WRITE_TOKEN. Skonfiguruj Vercel Blob.' },
      { status: 500 },
    )
  }

  const resolved = ctx.params instanceof Promise ? await ctx.params : ctx.params
  const raceId = typeof resolved?.id === 'string' ? resolved.id.trim() : ''
  if (!raceId) {
    return NextResponse.json({ ok: false, message: 'Brak identyfikatora wyścigu.' }, { status: 400 })
  }

  const raceCtx = await getRaceResultsPdfContext(raceId)
  if (!raceCtx) {
    return NextResponse.json({ ok: false, message: 'Nie znaleziono wyścigu.' }, { status: 404 })
  }

  const slugSeg = resultsBlobSlugSegment(raceCtx.slug)
  const blobs = (
    await Promise.all(
      getResultsBlobPrefixCandidates(raceCtx.raceYear).flatMap(prefix => [
        listAllBlobsWithPrefix(`${prefix}/${slugSeg}/`),
        listAllBlobsWithPrefix(`${prefix}/${raceId}/`),
      ]),
    )
  ).flat()

  const toDelete = blobs.filter(blob => {
    const parsed = parseResultBlobPathname(blob.pathname)
    if (!parsed) return false
    if (parsed.kind === 'slug') return parsed.slug === slugSeg
    return parsed.raceId === raceId
  })

  if (toDelete.length === 0) {
    return NextResponse.json({ ok: true, deleted: 0 })
  }

  try {
    await del(toDelete.map(b => b.url))
    return NextResponse.json({ ok: true, deleted: toDelete.length })
  } catch (e) {
    console.error('[admin/races/[id]/results DELETE]', e)
    return NextResponse.json({ ok: false, message: 'Nie udało się usunąć wyników.' }, { status: 500 })
  }
}
