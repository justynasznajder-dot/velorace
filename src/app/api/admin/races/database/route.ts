import { NextRequest, NextResponse } from 'next/server'
import { getAuthUserFromRequest } from '@/lib/serverAuth'
import { listAdminDatabaseRaces } from '@/lib/raceDb'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const user = getAuthUserFromRequest(req)
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ ok: false, message: 'Brak dostępu.' }, { status: 403 })
  }

  try {
    const rawY = req.nextUrl.searchParams.get('year')
    let calendarYear: number | null = null
    if (rawY != null && rawY !== '') {
      const y = Number.parseInt(rawY, 10)
      if (Number.isFinite(y) && y >= 1900 && y <= 2100) calendarYear = y
    }
    const races = await listAdminDatabaseRaces(calendarYear)
    return NextResponse.json(
      { ok: true, races },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          Pragma: 'no-cache',
          Expires: '0',
        },
      },
    )
  } catch (e) {
    console.error('[admin/races/database GET]', e)
    return NextResponse.json({ ok: false, message: 'Nie udało się odczytać listy wyścigów z bazy.' }, { status: 500 })
  }
}
