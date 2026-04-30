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
  const SPECIAL_RACE_ID = 'xxxix-chrzastowice-2026'
  const HIDE_TAGS_FOR_IDS = ['xxxix-chrzastowice-2026']
  const REGULATION_URL = 'https://drive.google.com/file/d/1lPMj5ymv1ii2b3iUlfYZePvGoQ5GJfPv/view?usp=sharing'

  return (
    <Widget title="Nadchodzące wyścigi" moreLabel="Pełny kalendarz →" moreHref="/kalendarz">
      {races.map(race => {
        const { day, month } = formatDate(race.date)
        const left = spotsLeft(race)
        const isSpecialRace = race.id === SPECIAL_RACE_ID
        const fullDate = race.date.split('-').reverse().join('.')

        return (
          <div key={race.id} className={styles.row}>
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
                {isSpecialRace && <span>📅 {fullDate} r.</span>}
                {race.distance > 0 && <span>📏 {race.distance} km</span>}
                {race.spotsTaken > 0 && <span>👥 {race.spotsTaken} zaw.</span>}
              </div>
              {isSpecialRace && (
                <a href={REGULATION_URL} target="_blank" rel="noreferrer" className={styles.regulationLink}>
                  Pobierz regulamin
                </a>
              )}
              {!HIDE_TAGS_FOR_IDS.includes(race.id) && (
                <div className={styles.tags}>
                  <StatusBadge status={race.status} />
                  <span className={`${styles.tag} ${styles.tagCat}`}>{race.category}</span>
                </div>
              )}
            </div>

            {/* Right */}
            <div className={styles.right}>
              {race.distance > 0 && (
                <div className={styles.dist}>
                  {race.distance} <small>km</small>
                </div>
              )}
              {race.status === 'open' ? (
                <div className={styles.slots}>
                  Zostało: <span>{left} miejsc</span>
                </div>
              ) : (
                <div className={styles.slotsGray}>
                  {race.type === 'criterium' ? 'Criterium' : race.type === 'gravel' ? 'Gravel' : race.type === 'mountain' ? 'Górski' : ''}
                </div>
              )}
            </div>
          </div>
        )
      })}
    </Widget>
  )
}
