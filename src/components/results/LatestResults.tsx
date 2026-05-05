'use client'

import { usePathname } from 'next/navigation'
import Widget from '@/components/shared/Widget'
import { LATEST_RESULTS } from '@/lib/data'
import { useAuth } from '@/components/auth/AuthProvider'
import { ResultsCategoriesBody } from '@/components/results/ResultsCategoriesBody'

/** Narzędzia wgrywania PDF tylko w panelu /admin (na stronie głównej admin widzi stronę jak gość). */
export default function LatestResults() {
  const pathname = usePathname()
  const { user, loading } = useAuth()
  const adminMode = user?.role === 'admin' && pathname.startsWith('/admin')

  return (
    <Widget title="Wyniki wyścigu:" moreLabel="Wszystkie wyniki →" moreHref="/wyniki">
      {LATEST_RESULTS.length === 0 ? (
        <p style={{ margin: 0, padding: '12px 16px 16px', fontSize: 14, color: 'var(--muted)' }}>
          Brak opublikowanych wyników w podglądzie — pojawią się po wgraniu plików PDF w panelu administracyjnym.
        </p>
      ) : (
        LATEST_RESULTS.map(result => (
          <ResultsCategoriesBody
            key={result.raceId}
            adminMode={adminMode}
            authLoading={adminMode && loading}
            raceId={result.raceId}
            raceName={result.raceName}
            entries={result.entries}
          />
        ))
      )}
    </Widget>
  )
}
