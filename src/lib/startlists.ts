import { resultsBlobSlugSegment } from '@/lib/results'

export const STARTLISTS_BLOB_ROOT = 'listy_startowe'

export function startlistsBlobRootPrefix(raceYear: number): string {
  const year = Number.isInteger(raceYear) && raceYear >= 2000 && raceYear <= 9999 ? raceYear : new Date().getFullYear()
  return `${STARTLISTS_BLOB_ROOT}/${year}`
}

/**
 * Prefix dla listy startowej:
 * `{root}/{year}/{raceSlugSeg}/kategorie/{categoryId}/`
 */
export function startlistBlobPrefix(raceSlug: string, raceYear: number, categoryId: string): string {
  const seg = resultsBlobSlugSegment(raceSlug)
  return `${startlistsBlobRootPrefix(raceYear)}/${seg}/kategorie/${categoryId}/`
}

/**
 * Prefix dla wszystkich list startowych danego wyścigu:
 * `{root}/{year}/{raceSlugSeg}/kategorie/`
 */
export function startlistsForRaceBlobPrefix(raceSlug: string, raceYear: number): string {
  const seg = resultsBlobSlugSegment(raceSlug)
  return `${startlistsBlobRootPrefix(raceYear)}/${seg}/kategorie/`
}

function safeBaseName(fileName: string): string {
  const base = fileName
    .replace(/\\/g, '/')
    .split('/')
    .pop()
  const t = (base ?? fileName).replace(/\.\./g, '').replace(/[\x00-\x1f<>:"|?*]/g, '_').trim()
  return t || 'startlist.pdf'
}

export function safeStartlistUploadFileName(fileName: string): string {
  const raw = safeBaseName(fileName)
  if (/\.pdf$/i.test(raw)) return raw
  return `${raw.replace(/\.pdf$/i, '')}.pdf`
}

