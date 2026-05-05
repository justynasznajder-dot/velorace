import { NextRequest, NextResponse } from 'next/server'
import { list } from '@vercel/blob'
import { getAuthUserFromRequest } from '@/lib/serverAuth'
import { getRaceResultsPdfContext, updateRaceResultsPdfSlotMode, type ResultsPdfSlotMode } from '@/lib/raceDb'
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

async function hasAnyUploadedResultsForRace(raceId: string, raceSlug: string, raceYear: number): Promise<boolean> {
  const slugSeg = resultsBlobSlugSegment(raceSlug)
  const blobs = (
    await Promise.all(
      getResultsBlobPrefixCandidates(raceYear).flatMap(prefix => [
        listAllBlobsWithPrefix(`${prefix}/${slugSeg}/`),
        listAllBlobsWithPrefix(`${prefix}/${raceId}/`),
      ]),
    )
  ).flat()
  for (const blob of blobs) {
    const parsed = parseResultBlobPathname(blob.pathname)
    if (!parsed) continue
    if (parsed.kind === 'slug' && parsed.slug === slugSeg) return true
    if (parsed.kind === 'legacy' && parsed.raceId === raceId) return true
  }
  return false
}

export async function PATCH(req: NextRequest, ctx: { params: { id: string } | Promise<{ id: string }> }) {
  const user = getAuthUserFromRequest(req)
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ ok: false, message: 'Brak dostępu.' }, { status: 403 })
  }

  const resolved = ctx.params instanceof Promise ? await ctx.params : ctx.params
  const id = typeof resolved?.id === 'string' ? resolved.id.trim() : ''
  if (!id) {
    return NextResponse.json({ ok: false, message: 'Brak identyfikatora wyścigu.' }, { status: 400 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ ok: false, message: 'Niepoprawny JSON.' }, { status: 400 })
  }

  const mode = (body as { mode?: string }).mode
  if (mode !== 'category' && mode !== 'wave') {
    return NextResponse.json({ ok: false, message: 'Pole mode musi być „category” lub „wave”.' }, { status: 400 })
  }

  const raceCtx = await getRaceResultsPdfContext(id)
  if (!raceCtx) {
    return NextResponse.json({ ok: false, message: 'Nie znaleziono wyścigu.' }, { status: 404 })
  }

  if (!process.env.BLOB_READ_WRITE_TOKEN?.trim()) {
    return NextResponse.json(
      {
        ok: false,
        message:
          'Brak BLOB_READ_WRITE_TOKEN — nie można zweryfikować, czy są już wgrane wyniki. Uzupełnij token i spróbuj ponownie.',
      },
      { status: 503 },
    )
  }

  if (await hasAnyUploadedResultsForRace(id, raceCtx.slug, raceCtx.raceYear)) {
    return NextResponse.json(
      {
        ok: false,
        message:
          'Nie można zmienić trybu wyników, ponieważ dla tego wyścigu są już wgrane pliki PDF. Usuń wszystkie pliki wyników i spróbuj ponownie.',
      },
      { status: 409 },
    )
  }

  const result = await updateRaceResultsPdfSlotMode(id, mode as ResultsPdfSlotMode)
  if (!result.ok) {
    return NextResponse.json({ ok: false, message: result.message }, { status: 400 })
  }
  return NextResponse.json({ ok: true })
}
