/** Pozycje kategorii w widoku wyników (1–5) — każda ma osobny folder w Blob: `wyniki/{position}/...` */
export const RESULT_CATEGORY_POSITIONS = [1, 2, 3, 4, 5] as const
export type ResultCategoryPosition = (typeof RESULT_CATEGORY_POSITIONS)[number]

const ALLOWED = new Set<number>(RESULT_CATEGORY_POSITIONS)

export function isResultCategoryPosition(n: number): n is ResultCategoryPosition {
  return ALLOWED.has(n)
}

export function resultCategoryPrefix(position: number): string {
  return `wyniki/${position}/`
}

/** Parsuje pathname typu `wyniki/3/nazwa pliku.pdf` */
export function parseResultBlobPathname(pathname: string): { position: number; fileName: string } | null {
  const m = pathname.match(/^wyniki\/(\d+)\/([^/]+)$/)
  if (!m) return null
  const position = Number(m[1])
  if (!ALLOWED.has(position)) return null
  return { position, fileName: m[2] }
}

/** Bezpieczna nazwa pliku (oryginalna, po wycięciu ścieżki i znaków problematycznych). */
export function safeResultUploadFileName(file: File | Blob, position: number): string {
  const raw = file instanceof File && typeof file.name === 'string' ? file.name.trim() : ''
  const segment = raw.replace(/\\/g, '/').split('/').pop() ?? raw
  const noTraversal = segment.replace(/\.\./g, '').replace(/[\x00-\x1f<>:"|?*]/g, '_').trim()
  if (!noTraversal) return `wyniki-kategoria-${position}.pdf`
  const max = 200
  return noTraversal.length > max ? noTraversal.slice(0, max) : noTraversal
}

export function isPdfUpload(file: File | Blob, fileName: string): boolean {
  if (file.type === 'application/pdf') return true
  return /\.pdf$/i.test(fileName)
}
