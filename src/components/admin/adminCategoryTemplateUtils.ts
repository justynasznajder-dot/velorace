import type { CategoryTemplate } from '@/lib/types'

/** Tekst pomocniczy: roczniki ze szablonu są tylko wartościami startowymi i można je potem ręcznie zmienić. */
export function birthYearTemplateHint(t: CategoryTemplate): string {
  if (t.birthYearMin == null && t.birthYearMax == null) return ''
  if (t.birthYearMin != null && t.birthYearMax != null) {
    return `Szablon PZKol podstawił roczniki: od ${t.birthYearMin}, do ${t.birthYearMax}. W razie potrzeby możesz je zmienić ręcznie.`
  }
  if (t.birthYearMin != null) {
    return `Szablon PZKol podstawił rocznik „od”: ${t.birthYearMin}. W razie potrzeby możesz go zmienić ręcznie.`
  }
  if (t.birthYearMax != null) {
    return `Szablon PZKol podstawił rocznik „do”: ${t.birthYearMax}. W razie potrzeby możesz go zmienić ręcznie.`
  }
  return ''
}

export function templateGenderToForm(g: 'M' | 'K' | null | undefined): '' | 'M' | 'F' {
  if (g === 'M') return 'M'
  if (g === 'K') return 'F'
  return ''
}
