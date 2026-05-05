'use client'

import { useEffect, useMemo, useState } from 'react'
import styles from './RaceStartlistDownloads.module.css'

type CategoryLike = { id: string; name: string }

export default function RaceStartlistDownloads({
  raceId,
  categories,
}: {
  raceId: string
  categories: CategoryLike[]
}) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [urls, setUrls] = useState<Record<string, string | null>>({})
  const [fileNames, setFileNames] = useState<Record<string, string | null>>({})

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)

    const q = new URLSearchParams({ raceId })
    fetch(`/api/startlists?${q}`, { cache: 'no-store' })
      .then(r => r.json().catch(() => ({})))
      .then((d: { ok?: boolean; message?: string; urls?: Record<string, string | null>; fileNames?: Record<string, string | null> }) => {
        if (cancelled) return
        if (!d?.ok || !d.urls) {
          setError(typeof d?.message === 'string' ? d.message : 'Nie udało się pobrać list startowych.')
          setUrls({})
          setFileNames({})
          return
        }
        setUrls(d.urls)
        setFileNames(d.fileNames ?? {})
      })
      .catch(() => {
        if (cancelled) return
        setError('Błąd połączenia.')
        setUrls({})
        setFileNames({})
      })
      .finally(() => {
        if (cancelled) return
        setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [raceId])

  const published = useMemo(() => {
    return categories
      .map(c => ({ cat: c, href: urls[c.id] ?? null, fileName: fileNames[c.id] ?? null }))
      .filter(x => x.href)
  }, [categories, urls, fileNames])

  if (loading) return <p className={styles.message}>Ładowanie list startowych…</p>
  if (error) return <p className={styles.message}>{error}</p>
  if (published.length === 0) return <p className={styles.message}>Brak opublikowanych list startowych.</p>

  return (
    <div className={styles.list}>
      {published.map(x => (
        <a key={x.cat.id} href={x.href ?? '#'} target="_blank" rel="noreferrer" className={styles.item}>
          <span className={styles.label}>{x.cat.name}</span>
          <span className={styles.action}>Pobierz</span>
        </a>
      ))}
    </div>
  )
}

