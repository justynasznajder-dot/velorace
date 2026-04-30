import { NextResponse } from 'next/server'
import { getAuthUserFromServerCookies } from '@/lib/serverAuth'

export async function GET() {
  const user = getAuthUserFromServerCookies()
  if (!user) {
    return NextResponse.json({ ok: false, user: null }, { status: 401 })
  }
  return NextResponse.json({ ok: true, user })
}
