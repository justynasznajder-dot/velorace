import { NextRequest, NextResponse } from 'next/server'
import { del, list, put } from '@vercel/blob'
import { getAuthUserFromRequest } from '@/lib/serverAuth'
import {
  isPdfUpload,
  isResultCategoryPosition,
  resultCategoryPrefix,
  safeResultUploadFileName,
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

  const positionRaw = formData.get('position')
  const file = formData.get('file')

  const position = Number(positionRaw)
  if (!Number.isInteger(position) || !isResultCategoryPosition(position)) {
    return NextResponse.json({ ok: false, message: 'Nieznana kategoria.' }, { status: 400 })
  }

  if (!(file instanceof Blob)) {
    return NextResponse.json({ ok: false, message: 'Brak pliku.' }, { status: 400 })
  }

  const originalName = safeResultUploadFileName(file, position)
  if (!isPdfUpload(file, originalName)) {
    return NextResponse.json({ ok: false, message: 'Wymagany plik PDF.' }, { status: 400 })
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json({ ok: false, message: 'Plik za duzy (max 25 MB).' }, { status: 400 })
  }

  const folderPrefix = resultCategoryPrefix(position)

  try {
    const existing = await listAllBlobsWithPrefix(folderPrefix)
    if (existing.length > 0) {
      await del(existing.map(b => b.url))
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
