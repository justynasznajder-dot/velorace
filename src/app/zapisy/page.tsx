import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { RACES, formatDate, spotsLeft } from '@/lib/data'
import styles from './page.module.css'

export default function ZapisyPage() {
  const SHOW_OPEN_SIGNUPS = false
  const openRaces = SHOW_OPEN_SIGNUPS ? RACES.filter(r => r.status === 'open') : []

  return (
    <>
      <Navbar />
      <main className={styles.page}>
        <h1 className={styles.pageTitle}>Otwarte zapisy</h1>

        <div className={styles.list}>
          {openRaces.map(race => {
            const { day, month, full } = formatDate(race.date)
            const left = spotsLeft(race)
            const pct = Math.round((race.spotsTaken / race.spotsTotal) * 100)

            return (
              <div key={race.id} className={styles.card}>
                <div className={styles.cardLeft}>
                  <div className={styles.dateBox}>
                    <div className={styles.day}>{day}</div>
                    <div className={styles.month}>{month}</div>
                  </div>
                  <div className={styles.info}>
                    <div className={styles.raceName}>{race.name}</div>
                    <div className={styles.meta}>
                      <span>📍 {race.city}</span>
                      <span>📏 {race.distance} km</span>
                      <span>🏷️ {race.category}</span>
                    </div>
                    {/* Occupancy bar */}
                    <div className={styles.barWrap}>
                      <div className={styles.barTrack}>
                        <div className={styles.barFill} style={{ width: `${pct}%` }} />
                      </div>
                      <span className={styles.barLabel}>
                        {race.spotsTaken}/{race.spotsTotal} miejsc zajętych
                        {left <= 30 && <strong> · Zostało tylko {left}!</strong>}
                      </span>
                    </div>
                  </div>
                </div>
                <a href={`/zapisy/${race.id}`} className={styles.cta}>
                  Zapisz się →
                </a>
              </div>
            )
          })}
        </div>

        {openRaces.length === 0 && (
          <p className={styles.empty}>Brak otwartych zapisów. Sprawdź kalendarz nadchodzących wyścigów.</p>
        )}
      </main>
      <Footer />
    </>
  )
}
