import { NextRequest, NextResponse } from 'next/server'
import { RACES } from '@/lib/data'
import { getAuthUserFromRequest } from '@/lib/serverAuth'

export async function GET(req: NextRequest) {
  const user = getAuthUserFromRequest(req)
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ ok: false, message: 'Brak dostepu.' }, { status: 403 })
  }

  return NextResponse.json({ ok: true, races: RACES })
}
