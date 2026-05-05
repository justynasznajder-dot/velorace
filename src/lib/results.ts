import { RACES } from '@/lib/data'

/** Pozycje kategorii w widoku wyników (1–5) — folder w Blob: `{root}/{raceId}/{position}/...` */
export const RESULT_CATEGORY_POSITIONS = [1, 2, 3, 4, 5] as const
export type ResultCategoryPosition = (typeof RESULT_CATEGORY_POSITIONS)[number]

const ALLOWED = new Set<number>(RESULT_CATEGORY_POSITIONS)
const LEGACY_RESULTS_BLOB_ROOT = 'wyniki'

function isSupportedResultsBlobRoot(root: string): boolean {
  return root === LEGACY_RESULTS_BLOB_ROOT || /^wyscigi_\d{4}$/.test(root)
}

export function getResultsBlobRootPrefix(year: number = new Date().getFullYear()): string {
  const safeYear = Number.isInteger(year) && year >= 2000 && year <= 9999 ? year : new Date().getFullYear()
  return `wyscigi_${safeYear}`
}

export function getResultsBlobPrefixCandidates(year: number = new Date().getFullYear()): string[] {
  return [getResultsBlobRootPrefix(year), LEGACY_RESULTS_BLOB_ROOT]
}

/** Stare pliki `wyniki/{position}/plik.pdf` traktujemy jako należące do pierwszego wyścigu w RACES. */
export function getResultLegacyRaceId(): string {
  return RACES[0]?.id ?? 'legacy'
}

export function isResultCategoryPosition(n: number): n is ResultCategoryPosition {
  return ALLOWED.has(n)
}

export function resultCategoryPrefix(raceId: string, position: number, year?: number): string {
  return `${getResultsBlobRootPrefix(year)}/${raceId}/${position}/`
}

export type ResultsPdfSlotMode = 'category' | 'wave'

/** Segment ścieżki Vercel Blob: `{root}/{segment}/kategoria/...` — bez ukośników. */
export function resultsBlobSlugSegment(slug: string): string {
  const t = slug.trim().replace(/\/+/g, '-').replace(/^\.+/, '')
  return t || 'race'
}

function sanitizeSlotFolderLabel(label: string): string {
  const base = label
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return base || 'slot'
}

function parseSlotFolderIndex(segment: string): number | null {
  if (!segment) return null
  if (/^\d+$/.test(segment)) {
    const onlyNum = Number(segment)
    return Number.isInteger(onlyNum) && onlyNum > 0 ? onlyNum : null
  }
  const match = segment.match(/^(\d+)-/)
  if (!match) return null
  const prefixedNum = Number(match[1])
  return Number.isInteger(prefixedNum) && prefixedNum > 0 ? prefixedNum : null
}

/** Nowy układ: `{root}/{slug}/kategoria|fala/{slotIndex-lub-czytelna-nazwa}/` */
export function resultPdfBlobPrefix(
  slug: string,
  mode: ResultsPdfSlotMode,
  slotIndex: number,
  slotLabel?: string,
  year?: number,
): string {
  const seg = resultsBlobSlugSegment(slug)
  const folder = mode === 'category' ? 'kategoria' : 'fala'
  const slotFolder = slotLabel ? `${slotIndex}-${sanitizeSlotFolderLabel(slotLabel)}` : String(slotIndex)
  return `${getResultsBlobRootPrefix(year)}/${seg}/${folder}/${slotFolder}/`
}

export function resultPdfBlobPrefixCandidates(
  slug: string,
  mode: ResultsPdfSlotMode,
  slotIndex: number,
  slotLabel?: string,
  year?: number,
): string[] {
  const seg = resultsBlobSlugSegment(slug)
  const folder = mode === 'category' ? 'kategoria' : 'fala'
  const numericFolder = String(slotIndex)
  const namedFolder = slotLabel ? `${slotIndex}-${sanitizeSlotFolderLabel(slotLabel)}` : null
  const out: string[] = []
  for (const root of getResultsBlobPrefixCandidates(year)) {
    out.push(`${root}/${seg}/${folder}/${numericFolder}/`)
    if (namedFolder) out.push(`${root}/${seg}/${folder}/${namedFolder}/`)
  }
  return Array.from(new Set(out))
}

/** Regulamin PDF: `{root}/{slug}/regulamin/` */
export function regulationPdfBlobPrefix(slug: string, year?: number): string {
  const seg = resultsBlobSlugSegment(slug)
  return `${getResultsBlobRootPrefix(year)}/${seg}/regulamin/`
}

export type ParsedResultBlob =
  | { kind: 'legacy'; raceId: string; position: number; fileName: string }
  | { kind: 'slug'; slug: string; mode: ResultsPdfSlotMode; slotIndex: number; fileName: string }

/**
 * Rozpoznaje:
 * - `{root}/{slug}/kategoria|fala/{slot}/plik.pdf`
 * - legacy `wyniki/{uuid}/{1-5}/plik.pdf`
 * - legacy `wyniki/{1-5}/plik.pdf`
 */
export function parseResultBlobPathname(pathname: string): ParsedResultBlob | null {
  const parts = pathname.split('/').filter(Boolean)
  if (!isSupportedResultsBlobRoot(parts[0] ?? '')) return null

  if (parts.length === 5) {
    const slugSeg = parts[1]
    const folder = parts[2]
    const slotNum = parseSlotFolderIndex(parts[3])
    const fileName = parts[4]
    if ((folder !== 'kategoria' && folder !== 'fala') || slotNum == null || !fileName) {
      return null
    }
    const mode: ResultsPdfSlotMode = folder === 'kategoria' ? 'category' : 'wave'
    return { kind: 'slug', slug: slugSeg, mode, slotIndex: slotNum, fileName }
  }

  if (parts.length === 4) {
    const raceId = parts[1]
    const position = Number(parts[2])
    const fileName = parts[3]
    if (!ALLOWED.has(position) || !fileName) return null
    return { kind: 'legacy', raceId, position, fileName }
  }

  if (parts.length === 3) {
    const position = Number(parts[1])
    const fileName = parts[2]
    if (!ALLOWED.has(position) || !fileName) return null
    return { kind: 'legacy', raceId: getResultLegacyRaceId(), position, fileName }
  }

  return null
}

/** Bezpieczna nazwa pliku (oryginalna, po wycięciu ścieżki i znaków problematycznych). */
export function safeResultUploadFileName(file: File | Blob, slotIndex: number): string {
  const raw = file instanceof File && typeof file.name === 'string' ? file.name.trim() : ''
  const segment = raw.replace(/\\/g, '/').split('/').pop() ?? raw
  const noTraversal = segment.replace(/\.\./g, '').replace(/[\x00-\x1f<>:"|?*]/g, '_').trim()
  if (!noTraversal) return `wyniki-slot-${slotIndex}.pdf`
  const max = 200
  return noTraversal.length > max ? noTraversal.slice(0, max) : noTraversal
}

export function isPdfUpload(file: File | Blob, fileName: string): boolean {
  if (file.type === 'application/pdf') return true
  return /\.pdf$/i.test(fileName)
}

export function isValidResultsSlotIndex(n: unknown, maxSlot: number): n is number {
  const x = Number(n)
  return Number.isInteger(x) && x >= 1 && x <= maxSlot && maxSlot >= 1
}
