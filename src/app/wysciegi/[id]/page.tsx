import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { formatDate } from '@/lib/data'
import { formatEntryFeePln, getRaceTypeLabel } from '@/lib/raceDisplay'
import { getRaceByIdFromDatabase } from '@/lib/raceDb'
import { notFound } from 'next/navigation'
import styles from './page.module.css'

interface Props {
  params: { id: string }
}

export default async function RaceDetailPage({ params }: Props) {
  const race = await getRaceByIdFromDatabase(params.id)
  if (!race) notFound()

  const { full } = formatDate(race.date)
  const left = Math.max(0, race.spotsTotal - race.spotsTaken)

  const stats: { label: string; value: string }[] = [
    { label: 'Dystans', value: `${race.distance} km` },
  ]
  if (race.lapCount != null) {
    stats.push({ label: 'Liczba okrążeń', value: String(race.lapCount) })
  }
  if (race.lapsDistanceKm != null) {
    stats.push({ label: 'Długość okrążenia', value: `${race.lapsDistanceKm} km` })
  }
  if (race.entryFeePln != null) {
    stats.push({ label: 'Wpłata (wg kategorii)', value: formatEntryFeePln(race.entryFeePln) })
  }
  stats.push(
    { label: 'Przewyższenie', value: race.elevationGain ? `${race.elevationGain} m` : '—' },
    { label: 'Maks. wysokość', value: race.maxElevation ? `${race.maxElevation} m` : '—' },
    { label: 'Miejsca', value: `${race.spotsTaken} / ${race.spotsTotal}` },
  )

  return (
    <>
      <Navbar />
      <main className={styles.page}>
        <div className={styles.back}><a href="/kalendarz">← Powrót do kalendarza</a></div>

        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>{race.name}</h1>
            <div className={styles.meta}>
              <span>📅 {full}</span>
              <span>📍 {race.city}</span>
              <span>📏 {race.distance} km</span>
              <span>🏷️ {getRaceTypeLabel(race.type || race.category)}</span>
            </div>
          </div>
          {race.status === 'open' && (
            <a href={`/zapisy/${race.id}`} className={styles.cta}>
              Zapisz się →
            </a>
          )}
        </div>

        <div className={styles.grid}>
          {/* Stats */}
          <div className={styles.statsGrid}>
            {stats.map(s => (
              <div key={s.label} className={styles.statCell}>
                <div className={styles.statVal}>{s.value}</div>
                <div className={styles.statLabel}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Elevation SVG placeholder */}
          <div className={styles.profileCard}>
            <div className={styles.profileTitle}>Profil trasy</div>
            <svg viewBox="0 0 400 80" preserveAspectRatio="none" className={styles.svg}>
              <defs>
                <linearGradient id="rg" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#D40000" stopOpacity="0.4"/>
                  <stop offset="100%" stopColor="#D40000" stopOpacity="0.03"/>
                </linearGradient>
              </defs>
              <path d="M0,70 L40,60 L80,40 L110,50 L150,20 L180,30 L220,15 L260,25 L300,40 L340,30 L380,50 L400,60 L400,80 L0,80 Z" fill="url(#rg)"/>
              <path d="M0,70 L40,60 L80,40 L110,50 L150,20 L180,30 L220,15 L260,25 L300,40 L340,30 L380,50 L400,60" fill="none" stroke="#D40000" strokeWidth="2"/>
            </svg>
          </div>
        </div>

        {/* Spots bar */}
        {race.status === 'open' && (
          <div className={styles.spotsCard}>
            <div className={styles.spotsInfo}>
              <span>Dostępne miejsca</span>
              <span><strong style={{ color: 'var(--red-b)' }}>{left}</strong> / {race.spotsTotal}</span>
            </div>
            <div className={styles.barTrack}>
              <div
                className={styles.barFill}
                style={{ width: `${Math.round((race.spotsTaken / race.spotsTotal) * 100)}%` }}
              />
            </div>
          </div>
        )}
      </main>
      <Footer />
    </>
  )
}
