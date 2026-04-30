import { NextRequest, NextResponse } from 'next/server'
import { put } from '@vercel/blob'
import { getAuthUserFromRequest } from '@/lib/serverAuth'
import { getResultFileNameByPosition } from '@/lib/results'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const MAX_BYTES = 25 * 1024 * 1024

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
  if (!Number.isFinite(position)) {
    return NextResponse.json({ ok: false, message: 'Brak pola "position".' }, { status: 400 })
  }

  const fileName = getResultFileNameByPosition(position)
  if (!fileName) {
    return NextResponse.json({ ok: false, message: 'Nieznana kategoria.' }, { status: 400 })
  }

  if (!(file instanceof Blob)) {
    return NextResponse.json({ ok: false, message: 'Brak pliku.' }, { status: 400 })
  }

  if (file.type && file.type !== 'application/pdf') {
    return NextResponse.json({ ok: false, message: 'Wymagany plik PDF.' }, { status: 400 })
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json({ ok: false, message: 'Plik za duzy (max 25 MB).' }, { status: 400 })
  }

  try {
    const blob = await put(`wyniki/${fileName}`, file, {
      access: 'public',
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: 'application/pdf',
    })
    return NextResponse.json({ ok: true, fileName, url: blob.url })
  } catch {
    return NextResponse.json(
      { ok: false, message: 'Nie udalo sie wgrac pliku do Vercel Blob.' },
      { status: 500 },
    )
  }
}
