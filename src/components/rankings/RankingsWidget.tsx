'use client'

import { useState } from 'react'
import Widget from '@/components/shared/Widget'
import { RANKINGS_INDIVIDUAL, RANKINGS_TEAM, RANKINGS_MASTERS } from '@/lib/data'
import type { RankingEntry } from '@/lib/types'
import styles from './RankingsWidget.module.css'

const TABS = [
  { key: 'individual', label: 'Indyw.' },
  { key: 'team',       label: 'Drużyny' },
  { key: 'masters',    label: 'Masters' },
] as const

type TabKey = typeof TABS[number]['key']

const DATA: Record<TabKey, RankingEntry[]> = {
  individual: RANKINGS_INDIVIDUAL,
  team:       RANKINGS_TEAM,
  masters:    RANKINGS_MASTERS,
}

export default function RankingsWidget() {
  const [active, setActive] = useState<TabKey>('individual')
  const entries = DATA[active]

  return (
    <Widget title="Ranking 2025" moreLabel="Pełny →" moreHref="/rankingi">
      {/* Tabs */}
      <div className={styles.tabs}>
        {TABS.map(tab => (
          <button
            key={tab.key}
            className={`${styles.tab} ${active === tab.key ? styles.activeTab : ''}`}
            onClick={() => setActive(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Entries */}
      {entries.map(entry => (
        <div key={entry.position} className={styles.row}>
          <div className={`${styles.pos} ${entry.position <= 3 ? styles.top : ''}`}>
            {entry.position}
          </div>
          <div>
            <div className={styles.name}>{entry.name}</div>
            {entry.team && <div className={styles.team}>{entry.team}</div>}
          </div>
          <div className={styles.pts}>
            {entry.points} <small>pkt</small>
          </div>
        </div>
      ))}
    </Widget>
  )
}
