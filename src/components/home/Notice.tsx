'use client'

import { useState } from 'react'
import styles from './Notice.module.css'

export default function Notice() {
  const [visible, setVisible] = useState(true)
  if (!visible) return null

  return (
    <div className={styles.notice}>
      <span className={styles.icon}>📋</span>
      <span className={styles.text}>
        <strong>Tour de Silesia</strong> — zapisy zamykają się za 3 dni. Zostało tylko <strong>20 miejsc</strong>.
      </span>
      <a href="/zapisy/tour-silesia-2025-e1" className={styles.cta}>Zapisz się →</a>
      <button className={styles.close} onClick={() => setVisible(false)} aria-label="Zamknij">×</button>
    </div>
  )
}
