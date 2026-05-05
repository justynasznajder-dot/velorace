'use client'

import { useMemo } from 'react'
import { useResultBlobUrls } from '@/components/results/ResultsCategoriesBody'
import styles from './RaceResultsDownloads.module.css'

export default function RaceResultsDownloads({ raceId }: { raceId: string }) {
  const { downloadHrefs, labels, slotCount, blobsLoading, listError } = useResultBlobUrls(raceId)

  const rows = useMemo(
    () =>
      Array.from({ length: slotCount }, (_, i) => i + 1)
        .map(slot => ({
          slot,
          label: labels[slot] ?? `Wyniki ${slot}`,
          href: downloadHrefs[slot] ?? null,
        }))
        .filter(row => row.href),
    [downloadHrefs, labels, slotCount],
  )

  if (blobsLoading) {
    return <p className={styles.message}>Ładowanie listy wyników…</p>
  }

  if (listError) {
    return <p className={styles.message}>{listError}</p>
  }

  if (rows.length === 0) {
    return <p className={styles.message}>Wyniki nie zostały jeszcze opublikowane.</p>
  }

  return (
    <div className={styles.list}>
      {rows.map(row => (
        <a key={row.slot} href={row.href ?? '#'} target="_blank" rel="noreferrer" className={styles.item}>
          <span>{row.label}</span>
          <span className={styles.itemAction}>Pobierz</span>
        </a>
      ))}
    </div>
  )
}
