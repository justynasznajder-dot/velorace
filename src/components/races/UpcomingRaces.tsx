import Link from 'next/link'
import Widget from '@/components/shared/Widget'
import { RACES, formatDate, spotsLeft } from '@/lib/data'
import type { Race } from '@/lib/types'
import styles from './UpcomingRaces.module.css'

function StatusBadge({ status }: { status: Race['status'] }) {
  const map = {
    open:     { label: 'Zapisy otwarte', cls: styles.tagOpen },
    soon:     { label: 'Zapisy wkrótce', cls: styles.tagSoon },
    live:     { label: '● LIVE',         cls: styles.tagLive },
    finished: { label: 'Zakończony',     cls: styles.tagSoon },
  }
  const { label, cls } = map[status]
  return <span className={`${styles.tag} ${cls}`}>{label}</span>
}

export default function UpcomingRaces() {
  const races = RACES.filter(r => r.status !== 'finished')

  return (
    <Widget title="Nadchodzące wyścigi" moreLabel="Pełny kalendarz →" moreHref="/kalendarz">
      {races.map(race => {
        const { day, month } = formatDate(race.date)
        const left = spotsLeft(race)

        return (
          <Link key={race.id} href={`/wysciegi/${race.id}`} className={styles.row}>
            {/* Date block */}
            <div className={styles.dateBlock}>
              <div className={styles.day}>{day}</div>
              <div className={styles.month}>{month}</div>
            </div>

            {/* Info */}
            <div className={styles.info}>
              <div className={styles.name}>{race.name}</div>
              <div className={styles.meta}>
                <span>📍 {race.city}</span>
                <span>📏 {race.distance} km</span>
                {race.spotsTaken > 0 && <span>👥 {race.spotsTaken} zaw.</span>}
              </div>
              <div className={styles.tags}>
                <StatusBadge status={race.status} />
                <span className={`${styles.tag} ${styles.tagCat}`}>{race.category}</span>
              </div>
            </div>

            {/* Right */}
            <div className={styles.right}>
              <div className={styles.dist}>
                {race.distance} <small>km</small>
              </div>
              {race.status === 'open' ? (
                <div className={styles.slots}>
                  Zostało: <span>{left} miejsc</span>
                </div>
              ) : (
                <div className={styles.slotsGray}>
                  {race.type === 'criterium' ? 'Criterium' : race.type === 'gravel' ? 'Gravel' : race.type === 'mountain' ? 'Górski' : '—'}
                </div>
              )}
              <div className={styles.arrow}>→</div>
            </div>
          </Link>
        )
      })}
    </Widget>
  )
}
