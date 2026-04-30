import { NextResponse } from 'next/server'
import { setAuthCookie, validateAdminCredentials, createAuthToken } from '@/lib/serverAuth'

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as { email?: string; password?: string } | null
  const email = body?.email ?? ''
  const password = body?.password ?? ''

  if (!validateAdminCredentials(email, password)) {
    return NextResponse.json({ ok: false, message: 'Nieprawidlowy email lub haslo.' }, { status: 401 })
  }

  const user = { email: email.trim(), role: 'admin' as const }
  setAuthCookie(createAuthToken(user))
  return NextResponse.json({ ok: true, user })
}
