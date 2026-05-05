'use client'

import { useEffect, useMemo, useState } from 'react'
import styles from '@/app/wyniki/[id]/page.module.css'
import listStyles from './RaceStartlistDownloads.module.css'

type CategoryLike = { id: string; name: string }

export default function RaceStartlistsSection({
  raceId,
  categories,
}: {
  raceId: string
  categories: CategoryLike[]
}) {
  const [loading, setLoading] = useState(true)
  const [urls, setUrls] = useState<Record<string, string | null>>({})

  useEffect(() => {
    let cancelled = false
    setLoading(true)

    const q = new URLSearchParams({ raceId })
    fetch(`/api/startlists?${q}`, { cache: 'no-store' })
      .then(r => r.json().catch(() => ({})))
      .then((d: { ok?: boolean; urls?: Record<string, string | null> }) => {
        if (cancelled) return
        if (!d?.ok || !d.urls) {
          setUrls({})
          return
        }
        setUrls(d.urls)
      })
      .catch(() => {
        if (cancelled) return
        setUrls({})
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
      .map(c => ({ cat: c, href: urls[c.id] ?? null }))
      .filter(x => x.href)
  }, [categories, urls])

  if (loading) return null
  if (published.length === 0) return null

  return (
    <>
      <h2 className={styles.cardTitle}>Pobierz listy startowe</h2>
      <div className={styles.downloadsBody}>
        <div className={listStyles.list}>
          {published.map(x => (
            <a key={x.cat.id} href={x.href ?? '#'} target="_blank" rel="noreferrer" className={listStyles.item}>
              <span className={listStyles.label}>{x.cat.name}</span>
              <span className={listStyles.action}>Pobierz</span>
            </a>
          ))}
        </div>
      </div>
    </>
  )
}

