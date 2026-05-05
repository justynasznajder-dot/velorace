import type { AdminRaceCategoryInput, AdminStartWaveInput } from '@/lib/raceDb'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export function parseCategories(raw: unknown): AdminRaceCategoryInput[] {
  if (!Array.isArray(raw)) return []
  const out: AdminRaceCategoryInput[] = []
  let i = 0
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue
    const o = item as Record<string, unknown>
    const name = typeof o.name === 'string' ? o.name.trim() : ''
    if (!name) continue

    const gender = o.gender === 'M' || o.gender === 'F' ? o.gender : null
    const rawId = typeof o.id === 'string' ? o.id.trim() : ''
    const id = UUID_RE.test(rawId) ? rawId : undefined

    const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : null)
    const int = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? Math.floor(v) : null)

    out.push({
      id,
      name,
      min_age: num(o.min_age),
      max_age: num(o.max_age),
      gender,
      entry_fee_pln: num(o.entry_fee_pln),
      spots_total: int(o.spots_total),
      bib_start: int(o.bib_start),
      display_order: typeof o.display_order === 'number' && Number.isFinite(o.display_order) ? Math.floor(o.display_order) : i,
      distance_km: num(o.distance_km),
      lap_count: int(o.lap_count),
      laps_distance_km: num(o.laps_distance_km),
    })
    i += 1
  }
  return out
}

export function parseStartWaves(raw: unknown, categoryCount: number): AdminStartWaveInput[] {
  if (!Array.isArray(raw)) return []
  const out: AdminStartWaveInput[] = []
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue
    const o = item as Record<string, unknown>
    const st = typeof o.start_time === 'string' ? o.start_time.trim() : ''
    if (!st) continue
    const idxsRaw = o.category_indexes
    if (!Array.isArray(idxsRaw)) continue
    const category_indexes: number[] = []
    for (const x of idxsRaw) {
      if (typeof x !== 'number' || !Number.isInteger(x)) continue
      if (x < 0 || x >= categoryCount) continue
      category_indexes.push(x)
    }
    const unique = Array.from(new Set(category_indexes)).sort((a, b) => a - b)
    if (unique.length === 0) continue
    out.push({ start_time: st, category_indexes: unique })
  }
  return out
}
