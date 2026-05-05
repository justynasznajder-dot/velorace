import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import RaceResultsDownloads from '@/components/results/RaceResultsDownloads'
import { listRacesMerged } from '@/lib/raceDb'
import { formatDate } from '@/lib/data'
import { getRaceTypeLabel } from '@/lib/raceDisplay'
import type { Race } from '@/lib/types'
import styles from './page.module.css'

interface Props {
  searchParams?: { rok?: string }
}

function raceYear(isoDate: string): number | null {
  const date = new Date(isoDate)
  if (Number.isNaN(date.getTime())) return null
  return date.getFullYear()
}

function StatusBadge({ status }: { status: Race['status'] }) {
  const map = {
    open: { label: 'Zapisy otwarte', cls: styles.tagOpen },
    soon: { label: 'Zapisy wkrótce', cls: styles.tagSoon },
    closed: { label: 'Zapisy zamknięte', cls: styles.tagSoon },
    live: { label: 'LIVE', cls: styles.tagLive },
    finished: { label: 'Zakończony', cls: styles.tagSoon },
    cancelled: { label: 'Odwołany', cls: styles.tagSoon },
  }
  const { label, cls } = map[status]
  return <span className={`${styles.tag} ${cls}`}>{label}</span>
}

export default async function WynikiPage({ searchParams }: Props) {
  const allRaces = await listRacesMerged()
  const years = Array.from(new Set(allRaces.map(r => raceYear(r.date)).filter((y): y is number => y != null))).sort(
    (a, b) => b - a,
  )

  const requestedYear = Number(searchParams?.rok)
  const currentYear = new Date().getFullYear()
  const selectedYear = years.includes(requestedYear) ? requestedYear : (years.includes(currentYear) ? currentYear : years[0])

  const racesInYear = allRaces
    .filter(r => raceYear(r.date) === selectedYear)
    .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : a.name.localeCompare(b.name, 'pl')))

  return (
    <>
      <Navbar />
      <main className={styles.page}>
        <h1 className={styles.pageTitle}>Wyniki</h1>
        <section className={styles.filtersCard}>
          <span className={styles.filtersLabel}>Rok:</span>
          <div className={styles.yearChips}>
            {years.map(year => (
              <a
                key={year}
                href={`/wyniki?rok=${year}`}
                className={year === selectedYear ? `${styles.yearChip} ${styles.yearChipActive}` : styles.yearChip}
              >
                {year}
              </a>
            ))}
          </div>
        </section>

        {racesInYear.length === 0 ? (
          <p className={styles.emptyState}>Brak wyścigów z opublikowanymi wynikami dla wybranego roku.</p>
        ) : (
          racesInYear.map(race => {
            const { day, month, full } = formatDate(race.date)
            return (
              <details key={race.id} className={styles.raceCard}>
                <summary className={styles.raceCardHeader}>
                  <div className={styles.dateBlock}>
                    <div className={styles.day}>{day}</div>
                    <div className={styles.month}>{month}</div>
                  </div>

                  <div className={styles.info}>
                    <h2 className={styles.raceName}>{race.name}</h2>
                    <div className={styles.raceMeta}>
                      <span>📅 {full}</span>
                      <span>📍 {race.city}</span>
                    </div>
                    <div className={styles.tags}>
                      <StatusBadge status={race.status} />
                      <span className={`${styles.tag} ${styles.tagCat}`}>{getRaceTypeLabel(race.type || race.category)}</span>
                    </div>
                  </div>

                  <div className={styles.raceActions}>
                    <a href={`/wyniki/${race.id}`} className={styles.raceActionLink}>
                      Zobacz szczegóły wyścigu
                    </a>
                    <div className={styles.raceActionRow}>
                      <span className={styles.raceActionLink}>
                        Zobacz wyniki
                      </span>
                      <span className={styles.expandIcon} aria-hidden="true">
                        ▾
                      </span>
                    </div>
                  </div>
                </summary>
                <div className={styles.raceCardBody}>
                  <RaceResultsDownloads raceId={race.id} />
                </div>
              </details>
            )
          })
        )}
      </main>
      <Footer />
    </>
  )
}
