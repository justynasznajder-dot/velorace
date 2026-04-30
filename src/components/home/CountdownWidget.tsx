'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Widget from '@/components/shared/Widget'
import { RACES, getNextRace } from '@/lib/data'
import styles from './CountdownWidget.module.css'

function pad(n: number) { return String(n).padStart(2, '0') }

export default function CountdownWidget() {
  const race = getNextRace()
  const [countdown, setCountdown] = useState({ d: '00', h: '00', m: '00' })

  useEffect(() => {
    if (!race) return
    const target = new Date(race.date + 'T08:00:00')

    function tick() {
      const diff = target.getTime() - Date.now()
      if (diff <= 0) { setCountdown({ d: '00', h: '00', m: '00' }); return }
      setCountdown({
        d: pad(Math.floor(diff / 86400000)),
        h: pad(Math.floor((diff % 86400000) / 3600000)),
        m: pad(Math.floor((diff % 3600000) / 60000)),
      })
    }

    tick()
    const id = setInterval(tick, 60_000)
    return () => clearInterval(id)
  }, [race])

  if (!race) return null

  return (
    <Widget title="Do następnego wyścigu">
      <div className={styles.body}>
        <div className={styles.raceName}>{race.name} — {race.date.slice(8, 10)}.{race.date.slice(5, 7)}</div>
        <div className={styles.clock}>
          <div className={styles.unit}>
            <div className={styles.num}>{countdown.d}</div>
            <div className={styles.label}>dni</div>
          </div>
          <div className={styles.sep}>:</div>
          <div className={styles.unit}>
            <div className={styles.num}>{countdown.h}</div>
            <div className={styles.label}>godz</div>
          </div>
          <div className={styles.sep}>:</div>
          <div className={styles.unit}>
            <div className={styles.num}>{countdown.m}</div>
            <div className={styles.label}>min</div>
          </div>
        </div>
        <Link href={`/zapisy/${race.id}`} className={styles.cta}>
          Zapisz się teraz →
        </Link>
      </div>
    </Widget>
  )
}
