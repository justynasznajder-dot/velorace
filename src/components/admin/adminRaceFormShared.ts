export const RACE_TYPES = [
  { value: 'road', label: 'Szosa' },
  { value: 'criterium', label: 'Kryterium' },
  { value: 'gravel', label: 'Szuter' },
  { value: 'mountain', label: 'Górski' },
  { value: 'track', label: 'Tor' },
  { value: 'cyclocross', label: 'Przełaj' },
] as const

export const RACE_STATUSES = [
  { value: 'draft', label: 'Szkic' },
  { value: 'published', label: 'Opublikowany' },
  { value: 'registration_open', label: 'Zapisy otwarte' },
  { value: 'registration_closed', label: 'Zapisy zamknięte' },
  { value: 'live', label: 'Na żywo' },
  { value: 'finished', label: 'Zakończony' },
  { value: 'cancelled', label: 'Odwołany' },
] as const

/** Tylko pola widoczne w panelu — pozostałe kolumny w DB ustawiane przy imporcie / innym kanałem lub zachowywane przy edycji. */
export type RaceFormState = {
  name: string
  race_date: string
  city: string
  race_type: (typeof RACE_TYPES)[number]['value']
  status: (typeof RACE_STATUSES)[number]['value']
  description: string
  registration_opens: string
  registration_closes: string
}

export function initialRaceForm(): RaceFormState {
  return {
    name: '',
    race_date: '',
    city: '',
    race_type: 'road',
    status: 'draft',
    description: '',
    registration_opens: '',
    registration_closes: '',
  }
}

export function parseOptionalNumber(raw: string): number | null {
  const t = raw.trim()
  if (t === '') return null
  const n = Number(t.replace(',', '.'))
  return Number.isFinite(n) ? n : null
}

export function parseOptionalInt(raw: string): number | null {
  const n = parseOptionalNumber(raw)
  if (n == null) return null
  return Math.floor(n)
}

export function newKey() {
  return typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `k-${Date.now()}-${Math.random()}`
}

export type CategoryRow = {
  key: string
  dbId?: string
  open: boolean
  /** '' = brak wyboru, 'custom' = własna kategoria, liczba = id szablonu */
  templateSelect: '' | 'custom' | string
  birthYearHint: string
  name: string
  min_age: string
  max_age: string
  gender: '' | 'M' | 'F'
  entry_fee_pln: string
  distance_km: string
  lap_count: string
  laps_distance_km: string
}

export function emptyCategoryRow(): CategoryRow {
  return {
    key: newKey(),
    open: true,
    templateSelect: '',
    birthYearHint: '',
    name: '',
    min_age: '',
    max_age: '',
    gender: '',
    entry_fee_pln: '',
    distance_km: '',
    lap_count: '',
    laps_distance_km: '',
  }
}

export function reorderCategories(categories: CategoryRow[], key: string, dir: 'up' | 'down'): CategoryRow[] {
  const i = categories.findIndex(c => c.key === key)
  if (i < 0) return categories
  const j = dir === 'up' ? i - 1 : i + 1
  if (j < 0 || j >= categories.length) return categories
  const next = [...categories]
  const t = next[i]
  next[i] = next[j]
  next[j] = t
  return next
}

/** Zwraca klucze wierszy kategorii o zduplikowanej nazwie (case-insensitive, po trim). */
export function getDuplicateCategoryKeys(rows: Pick<CategoryRow, 'key' | 'name'>[]): string[] {
  const byName = new Map<string, string[]>()
  for (const row of rows) {
    const normalized = row.name.trim().toLocaleLowerCase('pl-PL')
    if (!normalized) continue
    const list = byName.get(normalized) ?? []
    list.push(row.key)
    byName.set(normalized, list)
  }
  const out: string[] = []
  for (const keys of Array.from(byName.values())) {
    if (keys.length > 1) out.push(...keys)
  }
  return out
}

export type StartWaveRow = {
  key: string
  startTime: string
  categoryKeys: string[]
}

export function emptyStartWave(): StartWaveRow {
  return { key: newKey(), startTime: '', categoryKeys: [] }
}

export function formatWaveTimeForInput(raw: string): string {
  const t = raw.trim()
  if (!t) return ''
  const m = t.match(/^(\d{1,2}):(\d{2})/)
  return m ? `${m[1].padStart(2, '0')}:${m[2]}` : t.slice(0, 5)
}

/** Godzina 24h z klawiatury (np. 7:30, 07:30); odrzuca 25:09 itd. */
export function parseTime24(raw: string): { hh: string; mm: string } | null {
  const t = raw.trim().replace(',', ':').replace('.', ':')
  const m = t.match(/^([01]?\d|2[0-3])\s*[:.]?\s*([0-5]\d)$/)
  if (!m) return null
  return { hh: m[1].padStart(2, '0'), mm: m[2] }
}

/** Po udanym zapisie — przewija do góry strony (sekcja „Dane wyścigu”). */
export function scrollRaceFormToTop() {
  if (typeof window === 'undefined') return
  window.requestAnimationFrame(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  })
}
