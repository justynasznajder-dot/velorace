'use client'

import { useState } from 'react'
import Widget from '@/components/shared/Widget'
import styles from './RiderSearch.module.css'

export default function RiderSearch() {
  const [query, setQuery] = useState('')

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (query.trim()) {
      window.location.href = `/zawodnicy?q=${encodeURIComponent(query.trim())}`
    }
  }

  return (
    <Widget title="Szukaj zawodnika">
      <div className={styles.body}>
        <form className={styles.form} onSubmit={handleSearch}>
          <input
            type="text"
            className={styles.input}
            placeholder="Imię, nazwisko lub nr licencji..."
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
          <button type="submit" className={styles.btn}>🔍</button>
        </form>
        <p className={styles.hint}>Dostęp do wyników, historii startów i profilu zawodnika</p>
      </div>
    </Widget>
  )
}
