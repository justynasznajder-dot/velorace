import Link from 'next/link'
import { LIVE_RACE } from '@/lib/data'
import styles from './LiveWidget.module.css'

export default function LiveWidget() {
  const race = LIVE_RACE
  if (race.status !== 'live') return null

  return (
    <div className={styles.widget}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.liveTag}>
          <span className={styles.dot} /> NA ŻYWO
        </div>
        <div className={styles.raceName}>{race.raceName}</div>
        <div className={styles.status}>
          📍 {race.city} · Km {race.currentKm}/{race.totalKm}
          {race.currentLap && ` · Runda ${race.currentLap}/${race.totalLaps}`}
        </div>
      </div>

      {/* Riders */}
      {race.riders.map((rider, i) => (
        <div key={rider.bibNumber}>
          <div className={styles.row}>
            <div className={styles.pos}>{rider.position}</div>
            <div>
              <div className={styles.name}>{rider.riderName}</div>
              <div className={styles.team}>{rider.team}</div>
            </div>
            <div>
              <div className={styles.time}>{rider.time}</div>
              <div className={`${styles.gap} ${rider.gapTrend === 'gaining' ? styles.gaining : ''}`}>
                {rider.gap}
              </div>
            </div>
          </div>

          {/* Incident after position 3 */}
          {i === 2 && race.incidents.map(inc => (
            <div key={inc.id} className={styles.incident}>
              <div className={styles.incLabel}>⚠ INCYDENT — km {inc.km}</div>
              <div className={styles.incText}>{inc.text}</div>
            </div>
          ))}
        </div>
      ))}

      <Link href="/live" className={styles.fullBtn}>
        Pełny live timing + transmisja →
      </Link>
    </div>
  )
}
