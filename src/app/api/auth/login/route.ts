import { NextResponse } from 'next/server'
import { authenticateAdminLogin } from '@/lib/dbAuth'
import { setAuthCookie, createAuthToken } from '@/lib/serverAuth'

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as { email?: string; password?: string } | null
  const email = body?.email ?? ''
  const password = body?.password ?? ''

  const user = await authenticateAdminLogin(email, password)
  if (!user) {
    return NextResponse.json({ ok: false, message: 'Nieprawidlowy email lub haslo.' }, { status: 401 })
  }

  setAuthCookie(createAuthToken(user))
  return NextResponse.json({ ok: true, user })
}
