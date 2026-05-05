import { NextRequest, NextResponse } from 'next/server'
import { listObjects } from '@/lib/objectStore'
import { getRaceResultsPdfContext, isAllowedResultsRaceId } from '@/lib/raceDb'
import { safeStartlistUploadFileName, startlistsForRaceBlobPrefix } from '@/lib/startlists'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

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

function parseStartlistCategoryId(pathname: string): { categoryId: string; fileName: string } | null {
  const parts = pathname.split('/').filter(Boolean)
  // list format: listy_startowe/{year}/{raceSlugSeg}/kategorie/{categoryId}/{fileName}
  if (parts.length < 6) return null
  const maybeRoot = parts[0]
  const maybeFolder = parts[3]
  const maybeCategoryId = parts[4]
  const maybeFile = parts.slice(5).join('/') // in case the blob tool normalizes
  if (!maybeRoot || maybeFolder !== 'kategorie' || !maybeCategoryId || !maybeFile) return null
  return { categoryId: maybeCategoryId, fileName: maybeFile }
}

export async function GET(req: NextRequest) {
  const raceIdParam = req.nextUrl.searchParams.get('raceId')?.trim() || ''

  const raceId = raceIdParam
  if (!raceId || !(await isAllowedResultsRaceId(raceId))) {
    return NextResponse.json({ ok: false, message: 'Brak lub nieznany parametr raceId.' }, { status: 400 })
  }

  const ctx = await getRaceResultsPdfContext(raceId)
  if (!ctx) {
    return NextResponse.json({ ok: false, message: 'Nie znaleziono wyścigu.' }, { status: 404 })
  }

  const prefix = startlistsForRaceBlobPrefix(ctx.slug, ctx.raceYear)

  try {
    const blobs = await listAllBlobsWithPrefix(prefix)
    const urls: Record<string, string | null> = {}
    const fileNames: Record<string, string | null> = {}

    for (const blob of blobs) {
      const parsed = parseStartlistCategoryId(blob.pathname)
      if (!parsed) continue
      const { categoryId, fileName } = parsed
      urls[categoryId] = blob.downloadUrl || blob.url
      fileNames[categoryId] = safeStartlistUploadFileName(fileName)
    }

    return NextResponse.json({ ok: true, raceId, urls, fileNames })
  } catch (e) {
    console.error('[api/startlists]', e)
    return NextResponse.json({ ok: false, message: 'Nie udało się pobrać list startowych.' }, { status: 500 })
  }
}

