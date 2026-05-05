import { NextRequest, NextResponse } from 'next/server'
import { getAuthUserFromRequest } from '@/lib/serverAuth'
import { parseCategories, parseStartWaves } from '@/lib/adminRaceRequest'
import {
  DB_RACE_STATUSES,
  DB_RACE_TYPES,
  insertAdminRace,
  listRacesMerged,
  type AdminRaceInsertPayload,
} from '@/lib/raceDb'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const user = getAuthUserFromRequest(req)
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ ok: false, message: 'Brak dostępu.' }, { status: 403 })
  }

  try {
    const races = await listRacesMerged()
    return NextResponse.json({ ok: true, races })
  } catch (e) {
    console.error('[admin/races GET]', e)
    return NextResponse.json({ ok: false, message: 'Nie udało się odczytać listy wyścigów.' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const user = getAuthUserFromRequest(req)
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ ok: false, message: 'Brak dostępu.' }, { status: 403 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ ok: false, message: 'Niepoprawny JSON.' }, { status: 400 })
  }

  const p = body as Partial<AdminRaceInsertPayload> & { categories?: unknown; startWaves?: unknown }
  const name = typeof p.name === 'string' ? p.name.trim() : ''
  const city = typeof p.city === 'string' ? p.city.trim() : ''
  const race_date = typeof p.race_date === 'string' ? p.race_date.trim() : ''

  if (!name || !city || !race_date) {
    return NextResponse.json(
      { ok: false, message: 'Wymagane pola: nazwa, data wyścigu, miejsce (adres).' },
      { status: 400 },
    )
  }

  const race_type = (typeof p.race_type === 'string' ? p.race_type : 'road') as AdminRaceInsertPayload['race_type']
  const status = (typeof p.status === 'string' ? p.status : 'draft') as AdminRaceInsertPayload['status']

  if (!DB_RACE_TYPES.includes(race_type as (typeof DB_RACE_TYPES)[number])) {
    return NextResponse.json({ ok: false, message: 'Nieprawidłowy race_type.' }, { status: 400 })
  }
  if (!DB_RACE_STATUSES.includes(status as (typeof DB_RACE_STATUSES)[number])) {
    return NextResponse.json({ ok: false, message: 'Nieprawidłowy status.' }, { status: 400 })
  }

  const categories = parseCategories(p.categories)
  const hasCategories = categories.length > 0
  const startWaves = parseStartWaves(p.startWaves, categories.length)

  if (startWaves.length > 0 && !hasCategories) {
    return NextResponse.json(
      { ok: false, message: 'Kolejność startów wymaga co najmniej jednej kategorii startowej.' },
      { status: 400 },
    )
  }
  if (startWaves.length > 0) {
    const used = new Set<number>()
    for (const w of startWaves) {
      for (const idx of w.category_indexes) {
        if (used.has(idx)) {
          return NextResponse.json(
            { ok: false, message: 'Każda kategoria może być przypisana tylko do jednej fali startu.' },
            { status: 400 },
          )
        }
        used.add(idx)
      }
    }
  }

  if (hasCategories) {
    for (const c of categories) {
      if (!c.name.trim()) {
        return NextResponse.json({ ok: false, message: 'Każda kategoria musi mieć nazwę.' }, { status: 400 })
      }
    }
  } else {
    if (typeof p.distance_km !== 'number' || !Number.isFinite(p.distance_km)) {
      return NextResponse.json(
        { ok: false, message: 'Bez kategorii startowych podaj dystans wyścigu (km).' },
        { status: 400 },
      )
    }
  }

  const payload: AdminRaceInsertPayload = {
    name,
    slug: typeof p.slug === 'string' ? p.slug.trim() || undefined : undefined,
    race_date,
    race_time_start: typeof p.race_time_start === 'string' ? p.race_time_start : null,
    city,
    region: typeof p.region === 'string' ? p.region : null,
    country: typeof p.country === 'string' ? p.country : null,
    race_type,
    status,
    distance_km: hasCategories ? null : typeof p.distance_km === 'number' ? p.distance_km : null,
    elevation_gain_m: typeof p.elevation_gain_m === 'number' ? p.elevation_gain_m : null,
    max_elevation_m: typeof p.max_elevation_m === 'number' ? p.max_elevation_m : null,
    lap_count: hasCategories ? null : typeof p.lap_count === 'number' ? p.lap_count : null,
    laps_distance_km: hasCategories ? null : typeof p.laps_distance_km === 'number' ? p.laps_distance_km : null,
    spots_total: typeof p.spots_total === 'number' ? p.spots_total : null,
    edition_year: typeof p.edition_year === 'number' ? p.edition_year : null,
    entry_fee_pln: hasCategories ? null : typeof p.entry_fee_pln === 'number' ? p.entry_fee_pln : null,
    description: typeof p.description === 'string' ? p.description : null,
    registration_opens: typeof p.registration_opens === 'string' ? p.registration_opens : null,
    registration_closes: typeof p.registration_closes === 'string' ? p.registration_closes : null,
    gpx_url: typeof p.gpx_url === 'string' ? p.gpx_url : null,
    cover_image_url: typeof p.cover_image_url === 'string' ? p.cover_image_url : null,
  }

  try {
    const created = await insertAdminRace(payload, categories, startWaves)
    return NextResponse.json({
      ok: true,
      id: created.id,
      slug: created.slug,
      categoryIds: created.categoryIds ?? [],
      message: hasCategories
        ? `Wyścig zapisany (${categories.length} ${categories.length === 1 ? 'kategoria' : 'kategorii'}). Organizator: Platforma VeloRace.`
        : 'Wyścig zapisany. Organizator: Platforma VeloRace.',
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Błąd zapisu.'
    console.error('[admin/races POST]', e)
    const status = msg.includes('DATABASE_URL') || msg.includes('organizatora') ? 503 : 400
    return NextResponse.json({ ok: false, message: msg }, { status })
  }
}
