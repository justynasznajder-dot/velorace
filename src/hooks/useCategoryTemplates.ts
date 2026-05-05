'use client'

import { useEffect, useState } from 'react'
import type { CategoryTemplate } from '@/lib/types'

export function useCategoryTemplates() {
  const [templates, setTemplates] = useState<CategoryTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    fetch('/api/category-templates')
      .then(async r => {
        const d = (await r.json()) as {
          ok?: boolean
          templates?: CategoryTemplate[]
          message?: string
          cause?: string
        }
        if (cancelled) return
        if (!r.ok || !d?.ok || !Array.isArray(d.templates)) {
          const base = d?.message || 'Nie udało się wczytać szablonów.'
          const hint =
            typeof d?.cause === 'string' && d.cause.trim()
              ? ` (${d.cause.trim()})`
              : ''
          setError(base + hint)
          setTemplates([])
          return
        }
        setTemplates(d.templates)
      })
      .catch(() => {
        if (!cancelled) {
          setError('Brak połączenia z serwerem.')
          setTemplates([])
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  /** Sukces API, ale 0 wierszy — zwykle brak migracji / seeda `category_templates`. */
  const empty =
    !loading &&
    error == null &&
    templates.length === 0

  return { templates, loading, error, empty }
}
