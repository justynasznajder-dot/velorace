import { NextResponse } from 'next/server'
import { list } from '@vercel/blob'
import { RESULT_FILES } from '@/lib/results'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  const urls: Record<number, string | null> = {}
  for (const r of RESULT_FILES) {
    urls[r.position] = null
  }

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json({ ok: true, urls })
  }

  try {
    const { blobs } = await list({ prefix: 'wyniki/' })
    for (const r of RESULT_FILES) {
      const blob = blobs.find(b => b.pathname === `wyniki/${r.fileName}`)
      urls[r.position] = blob?.url ?? null
    }
    return NextResponse.json({ ok: true, urls })
  } catch {
    return NextResponse.json({ ok: false, urls }, { status: 500 })
  }
}
