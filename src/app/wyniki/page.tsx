import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { LATEST_RESULTS } from '@/lib/data'
import styles from './page.module.css'

export default function WynikiPage() {
  return (
    <>
      <Navbar />
      <main className={styles.page}>
        <h1 className={styles.pageTitle}>Wyniki</h1>
        {LATEST_RESULTS.map(result => (
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
      </main>
      <Footer />
    </>
  )
}
