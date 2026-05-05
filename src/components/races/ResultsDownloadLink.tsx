'use client'

import { useEffect, useState } from 'react'

export default function ResultsDownloadLink({
  raceId,
  className,
  disabledClassName,
}: {
  raceId: string
  className: string
  disabledClassName: string
}) {
  const [hasResults, setHasResults] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)

    const q = new URLSearchParams({ raceId })
    fetch(`/api/results?${q.toString()}`, { cache: 'no-store' })
      .then(r => r.json().catch(() => ({})))
      .then((d: { ok?: boolean; urls?: Record<string, string | null> }) => {
        if (cancelled) return
        const urls = d?.urls ?? {}
        const any = Object.values(urls).some(Boolean)
        setHasResults(any)
      })
      .catch(() => {
        if (cancelled) return
        setHasResults(false)
      })
      .finally(() => {
        if (cancelled) return
        setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [raceId])

  if (loading || !hasResults) {
    return <span className={`${className} ${disabledClassName}`}>Pobierz wyniki</span>
  }

  return (
    <a href={`/wyniki/${raceId}/pobierz`} className={className}>
      Pobierz wyniki
    </a>
  )
}

