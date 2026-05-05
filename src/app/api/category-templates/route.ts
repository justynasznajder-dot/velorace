import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import type { CategoryTemplate } from '@/lib/types'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function normalizeGender(g: unknown): 'M' | 'K' | null {
  if (g == null || g === '') return null
  const s = String(g).trim().toUpperCase()
  if (s === 'M') return 'M'
  if (s === 'K') return 'K'
  return null
}

export async function GET() {
  const sql = getDb()
  if (!sql) {
    return NextResponse.json({ ok: false, message: 'Brak konfiguracji bazy danych.' }, { status: 503 })
  }

  try {
    const rows = await sql`
      SELECT
        id,
        name,
        gender::text AS gender,
        birth_year_min,
        birth_year_max,
        display_order
      FROM category_templates
      ORDER BY display_order ASC, name ASC
    `

    const templates: CategoryTemplate[] = (rows as Record<string, unknown>[]).map(r => {
      const g = normalizeGender(r.gender)
      const bmin = r.birth_year_min
      const bmax = r.birth_year_max
      return {
        id: Number(r.id),
        name: String(r.name),
        gender: g,
        birthYearMin:
          bmin != null && bmin !== '' && Number.isFinite(Number(bmin)) ? Number(bmin) : undefined,
        birthYearMax:
          bmax != null && bmax !== '' && Number.isFinite(Number(bmax)) ? Number(bmax) : undefined,
        displayOrder: Number(r.display_order ?? 0),
      }
    })

    return NextResponse.json({ ok: true, templates })
  } catch (e) {
    console.error('[category-templates GET]', e)
    const isDev = process.env.NODE_ENV === 'development'
    const cause =
      e instanceof Error ? e.message : typeof e === 'string' ? e : 'unknown error'
    return NextResponse.json(
      {
        ok: false,
        message: 'Nie udało się odczytać szablonów kategorii.',
        ...(isDev ? { cause } : {}),
      },
      { status: 500 },
    )
  }
}
