import { NextResponse } from 'next/server'
import { list } from '@vercel/blob'
import { RESULT_CATEGORY_POSITIONS, parseResultBlobPathname } from '@/lib/results'

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

export async function GET() {
  const empty = Object.fromEntries(
    RESULT_CATEGORY_POSITIONS.map(p => [p, null as string | null]),
  ) as Record<number, string | null>
  const urls = { ...empty }
  const downloadUrls = { ...empty }
  const fileNames = { ...empty }

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json({ ok: true, urls, downloadUrls, fileNames })
  }

  try {
    const blobs = await listAllBlobsWithPrefix('wyniki/')
    const best = new Map<
      number,
      { url: string; downloadUrl: string; uploadedAt: number; fileName: string }
    >()

    for (const blob of blobs) {
      const parsed = parseResultBlobPathname(blob.pathname)
      if (!parsed) continue
      const t = new Date(blob.uploadedAt).getTime()
      const cur = best.get(parsed.position)
      if (!cur || t > cur.uploadedAt) {
        best.set(parsed.position, {
          url: blob.url,
          downloadUrl: blob.downloadUrl,
          uploadedAt: t,
          fileName: decodeBlobFileName(parsed.fileName),
        })
      }
    }

    for (const pos of RESULT_CATEGORY_POSITIONS) {
      const b = best.get(pos)
      urls[pos] = b?.url ?? null
      downloadUrls[pos] = b?.downloadUrl ?? null
      fileNames[pos] = b?.fileName ?? null
    }

    return NextResponse.json({ ok: true, urls, downloadUrls, fileNames })
  } catch {
    return NextResponse.json({ ok: false, urls, downloadUrls, fileNames }, { status: 500 })
  }
}
