import { NextRequest, NextResponse } from 'next/server'
import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { Readable } from 'node:stream'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function must(name: string): string {
  const value = process.env[name]?.trim()
  if (!value) throw new Error(`Brak ${name}.`)
  return value
}

function client(): { s3: S3Client; bucket: string } {
  const accountId = must('R2_ACCOUNT_ID')
  const accessKeyId = must('R2_ACCESS_KEY_ID')
  const secretAccessKey = must('R2_SECRET_ACCESS_KEY')
  const bucket = must('R2_BUCKET_NAME')
  const s3 = new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
  })
  return { s3, bucket }
}

function fileNameFromKey(key: string): string {
  const seg = key.split('/').filter(Boolean).pop() || 'plik'
  try {
    return decodeURIComponent(seg)
  } catch {
    return seg
  }
}

async function bodyToBuffer(body: unknown): Promise<Buffer> {
  const maybe = body as {
    transformToByteArray?: () => Promise<Uint8Array>
    arrayBuffer?: () => Promise<ArrayBuffer>
  }

  if (typeof maybe.transformToByteArray === 'function') {
    const bytes = await maybe.transformToByteArray()
    return Buffer.from(bytes)
  }
  if (typeof maybe.arrayBuffer === 'function') {
    const ab = await maybe.arrayBuffer()
    return Buffer.from(ab)
  }
  if (body instanceof Readable) {
    const chunks: Buffer[] = []
    for await (const chunk of body) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
    }
    return Buffer.concat(chunks)
  }
  throw new Error('Unsupported R2 body stream type.')
}

export async function GET(req: NextRequest) {
  const key = req.nextUrl.searchParams.get('key')?.trim() || ''
  if (!key) return NextResponse.json({ ok: false, message: 'Brak parametru key.' }, { status: 400 })

  try {
    const { s3, bucket } = client()
    const obj = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: key }))
    if (!obj.Body) return NextResponse.json({ ok: false, message: 'Pusty plik.' }, { status: 404 })
    const content = await bodyToBuffer(obj.Body)

    const fileName = fileNameFromKey(key).replace(/"/g, "'")
    const headers = new Headers()
    headers.set('Content-Type', obj.ContentType || 'application/octet-stream')
    headers.set('Content-Disposition', `inline; filename="${fileName}"`)
    headers.set('Cache-Control', 'public, max-age=60')
    headers.set('Content-Length', String(content.byteLength))
    return new NextResponse(new Uint8Array(content), { status: 200, headers })
  } catch (e) {
    console.error('[api/storage/file]', e)
    return NextResponse.json({ ok: false, message: 'Nie udało się pobrać pliku z R2.' }, { status: 500 })
  }
}

