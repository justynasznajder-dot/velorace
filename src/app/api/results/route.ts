import { NextResponse } from 'next/server'
import { list } from '@vercel/blob'
import { RESULT_CATEGORY_POSITIONS, parseResultBlobPathname } from '@/lib/results'

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

export async function GET() {
  const urls = Object.fromEntries(
    RESULT_CATEGORY_POSITIONS.map(p => [p, null as string | null]),
  ) as Record<number, string | null>
  const downloadUrls = { ...urls }

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json({ ok: true, urls, downloadUrls })
  }

  try {
    const blobs = await listAllBlobsWithPrefix('wyniki/')
    const best = new Map<number, { url: string; downloadUrl: string; uploadedAt: number }>()

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
        })
      }
    }

    for (const pos of RESULT_CATEGORY_POSITIONS) {
      const b = best.get(pos)
      urls[pos] = b?.url ?? null
      downloadUrls[pos] = b?.downloadUrl ?? null
    }

    return NextResponse.json({ ok: true, urls, downloadUrls })
  } catch {
    return NextResponse.json({ ok: false, urls, downloadUrls }, { status: 500 })
  }
}
