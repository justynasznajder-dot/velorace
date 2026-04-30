import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { LATEST_RESULTS } from '@/lib/data'
import styles from './page.module.css'

export default function WynikiPage() {
  const SHOW_RESULTS = false
  const results = SHOW_RESULTS ? LATEST_RESULTS : []

  return (
    <>
      <Navbar />
      <main className={styles.page}>
        <h1 className={styles.pageTitle}>Wyniki</h1>
        {results.map(result => (
          <div key={result.raceId} className={styles.card}>
            <div className={styles.cardHeader}>
              <span>{result.raceName}</span>
              <span>{result.date.split('-').reverse().join('.')} · {result.distance} km</span>
            </div>
            {result.entries.map(e => (
              <div key={e.position} className={styles.row}>
                <span className={styles.pos}>{e.position}</span>
                <span className={styles.name}>{e.riderName}</span>
                <span className={styles.team}>{e.team}</span>
                <span className={styles.time}>{e.time}</span>
                <span className={styles.gap}>{e.gap}</span>
              </div>
            ))}
          </div>
        ))}
        {results.length === 0 && (
          <p style={{ color: 'var(--muted)', fontSize: '14px' }}>
            Na ten moment brak opublikowanych wyników.
          </p>
        )}
      </main>
      <Footer />
    </>
  )
}
