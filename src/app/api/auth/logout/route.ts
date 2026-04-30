import { NextResponse } from 'next/server'
import { clearAuthCookie } from '@/lib/serverAuth'

export async function POST() {
  clearAuthCookie()
  return NextResponse.json({ ok: true })
}
