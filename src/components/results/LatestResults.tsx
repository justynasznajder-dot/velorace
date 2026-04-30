import Widget from '@/components/shared/Widget'
import { LATEST_RESULTS } from '@/lib/data'
import styles from './LatestResults.module.css'

function positionClass(pos: number) {
  if (pos === 1) return styles.gold
  if (pos === 2) return styles.silver
  if (pos === 3) return styles.bronze
  return ''
}

export default function LatestResults() {
  return (
    <Widget title="Ostatnie wyniki" moreLabel="Wszystkie wyniki →" moreHref="/wyniki">
      {LATEST_RESULTS.map(result => (
        <div key={result.raceId}>
          {/* Race header */}
          <div className={styles.raceHeader}>
            <span className={styles.raceName}>{result.raceName}</span>
            <span className={styles.raceMeta}>
              {result.date.split('-').reverse().join('.')} · {result.distance} km
            </span>
          </div>

          {/* Entries */}
          {result.entries.map(entry => (
            <div key={entry.position} className={styles.row}>
              <div className={`${styles.pos} ${positionClass(entry.position)}`}>
                {entry.position}
              </div>
              <div>
                <div className={styles.name}>{entry.riderName}</div>
                <div className={styles.team}>{entry.team}</div>
              </div>
              <div>
                <div className={styles.time}>{entry.time}</div>
                <div className={styles.gap}>{entry.gap}</div>
              </div>
            </div>
          ))}

          {/* Footer */}
          <div className={styles.footer}>
            <span>Pełna klasyfikacja: {result.totalRiders} zawodników</span>
            <a href={`/wyniki/${result.raceId}`} className={styles.pdfLink}>
              Pobierz PDF →
            </a>
          </div>
        </div>
      ))}
    </Widget>
  )
}
