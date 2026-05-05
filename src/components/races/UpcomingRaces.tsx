import Widget from '@/components/shared/Widget'
import { formatDate } from '@/lib/data'
import { listHomePageFinishedRacesCurrentYear, listHomePageRacesCurrentYear } from '@/lib/raceDb'
import { getRaceTypeLabel } from '@/lib/raceDisplay'
import type { Race } from '@/lib/types'
import ResultsDownloadLink from '@/components/races/ResultsDownloadLink'
import styles from './UpcomingRaces.module.css'

function CalendarIcon() {
  return (
    <svg viewBox="0 0 24 24" className={styles.metaIcon} aria-hidden="true">
      <rect x="3" y="5" width="18" height="16" rx="3" fill="currentColor" opacity="0.2" />
      <rect x="3" y="8" width="18" height="13" rx="3" stroke="currentColor" strokeWidth="1.5" fill="none" />
      <path d="M8 3.5v4M16 3.5v4M3 10h18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function StatusBadge({ status }: { status: Race['status'] }) {
  const map = {
    open:     { label: 'Zapisy otwarte', cls: styles.tagOpen },
    soon:     { label: 'Zapisy wkrótce', cls: styles.tagSoon },
    closed:   { label: 'Zapisy zamknięte', cls: styles.tagSoon },
    live:     { label: '● LIVE',         cls: styles.tagLive },
    finished: { label: 'Zakończony',     cls: styles.tagSoon },
    cancelled:{ label: 'Odwołany',       cls: styles.tagSoon },
  }
  const { label, cls } = map[status]
  return <span className={`${styles.tag} ${cls}`}>{label}</span>
}

export default async function UpcomingRaces({
  limitPerSection,
  showMoreLinks = true,
}: {
  limitPerSection?: number
  showMoreLinks?: boolean
} = {}) {
  const allRaces = await listHomePageRacesCurrentYear()
  const allFinishedRaces = await listHomePageFinishedRacesCurrentYear()
  const races = typeof limitPerSection === 'number' ? allRaces.slice(0, limitPerSection) : allRaces
  const finishedRaces =
    typeof limitPerSection === 'number' ? allFinishedRaces.slice(0, limitPerSection) : allFinishedRaces

  return (
    <>
      <Widget
        title="Nadchodzące wyścigi"
        moreLabel={showMoreLinks ? 'Cały kalendarz →' : undefined}
        moreHref={showMoreLinks ? '/kalendarz' : undefined}
      >
        {races.length === 0 ? (
          <p className={styles.empty}>Brak zaplanowanych wyścigów w podglądzie — kalendarz uzupełni się po dodaniu zapisów w bazie.</p>
        ) : null}
        {races.map(race => {
          const { day, month, full } = formatDate(race.date)

          return (
            <div key={race.id} className={styles.row}>
              <div className={styles.dateBlock}>
                <div className={styles.day}>{day}</div>
                <div className={styles.month}>{month}</div>
              </div>

              <div className={styles.info}>
                <div className={styles.name}>{race.name}</div>
                <div className={styles.meta}>
                  <span className={styles.metaWithIcon}>
                    <CalendarIcon />
                    {full}
                  </span>
                  <span>📍 {race.city}</span>
                  {race.spotsTaken > 0 && <span>👥 {race.spotsTaken} zaw.</span>}
                </div>
                <div className={styles.tags}>
                  <StatusBadge status={race.status} />
                  <span className={`${styles.tag} ${styles.tagCat}`}>{getRaceTypeLabel(race.category)}</span>
                </div>
              </div>

              <div className={styles.right}>
                <div className={styles.rightLinks}>
                  <a href={`/wyniki/${race.id}`} className={styles.rightLink}>
                    Zobacz szczegóły
                  </a>
                  {race.regulationUrl ? (
                    <a href={race.regulationUrl} className={styles.rightLink} target="_blank" rel="noreferrer">
                      Pobierz regulamin
                    </a>
                  ) : (
                    <span className={`${styles.rightLink} ${styles.rightLinkDisabled}`}>Pobierz regulamin</span>
                  )}
                  <ResultsDownloadLink
                    raceId={race.id}
                    className={styles.rightLink}
                    disabledClassName={styles.rightLinkDisabled}
                  />
                  {race.status === 'open' ? (
                    <a href={`/zapisy/${race.id}`} className={styles.rightLink}>
                      Zapisz się
                    </a>
                  ) : (
                    <span className={`${styles.rightLink} ${styles.rightLinkDisabled}`}>Zapisz się</span>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </Widget>

      <Widget
        title="Wyścigi zakończone"
        moreLabel={showMoreLinks ? 'Cały kalendarz →' : undefined}
        moreHref={showMoreLinks ? '/kalendarz' : undefined}
      >
        {finishedRaces.length === 0 ? <p className={styles.empty}>Brak zakończonych wyścigów w bieżącym roku.</p> : null}
        {finishedRaces.map(race => {
          const { day, month, full } = formatDate(race.date)
          return (
            <div key={race.id} className={styles.row}>
              <div className={styles.dateBlock}>
                <div className={styles.day}>{day}</div>
                <div className={styles.month}>{month}</div>
              </div>
              <div className={styles.info}>
                <div className={styles.name}>{race.name}</div>
                <div className={styles.meta}>
                  <span className={styles.metaWithIcon}>
                    <CalendarIcon />
                    {full}
                  </span>
                  <span>📍 {race.city}</span>
                </div>
                <div className={styles.tags}>
                  <StatusBadge status="finished" />
                  <span className={`${styles.tag} ${styles.tagCat}`}>{getRaceTypeLabel(race.category)}</span>
                </div>
              </div>
              <div className={styles.right}>
                <div className={styles.rightLinks}>
                  <a href={`/wyniki/${race.id}`} className={styles.rightLink}>
                    Zobacz szczegóły
                  </a>
                  {race.regulationUrl ? (
                    <a href={race.regulationUrl} className={styles.rightLink} target="_blank" rel="noreferrer">
                      Pobierz regulamin
                    </a>
                  ) : (
                    <span className={`${styles.rightLink} ${styles.rightLinkDisabled}`}>Pobierz regulamin</span>
                  )}
                  <ResultsDownloadLink
                    raceId={race.id}
                    className={styles.rightLink}
                    disabledClassName={styles.rightLinkDisabled}
                  />
                  <span className={`${styles.rightLink} ${styles.rightLinkDisabled}`}>Zapisz się</span>
                </div>
              </div>
            </div>
          )
        })}
      </Widget>
    </>
  )
}
