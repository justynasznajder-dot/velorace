/**
 * Wartość z kategorii nadpisuje pole wyścigu, gdy jest ustawiona (zgodnie z modelem DB).
 */
export function coalesceCategoryRace<T>(categoryVal: T | null | undefined, raceVal: T | null | undefined): T | undefined {
  if (categoryVal !== null && categoryVal !== undefined) return categoryVal
  if (raceVal !== null && raceVal !== undefined) return raceVal
  return undefined
}

export function formatDistanceKm(km: number | null | undefined): string {
  if (km == null || !Number.isFinite(Number(km))) return '—'
  return `${Number(km)} km`
}

export function formatEntryFeePln(pln: number | null | undefined): string {
  if (pln == null || !Number.isFinite(Number(pln))) return '—'
  return `${Number(pln).toFixed(2)} PLN`
}

export function getRaceTypeLabel(value: string | null | undefined): string {
  if (!value) return ''

  const normalized = value.toLowerCase()
  if (normalized === 'road') return 'Szosa'
  if (normalized === 'criterium') return 'Kryterium'
  if (normalized === 'mountain') return 'Górski'
  if (normalized === 'track') return 'Torowy'
  if (normalized === 'cyclocross') return 'Przełaj'
  if (normalized === 'gravel') return 'Szuter'
  return value
}
