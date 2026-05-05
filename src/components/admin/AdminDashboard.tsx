'use client'

import { useCallback, useRef, useState } from 'react'
import AdminAddRaceTab from '@/components/admin/AdminAddRaceTab'
import AdminEditRaceTab, { type AdminEditRaceTabHandle } from '@/components/admin/AdminEditRaceTab'
import AdminHistoryTab, { type AdminHistoryTabHandle } from '@/components/admin/AdminHistoryTab'
import AdminResultsTab, { type AdminResultsTabHandle } from '@/components/admin/AdminResultsTab'
import type { AdminDbRaceListItem } from '@/lib/raceDb'
import styles from './AdminDashboard.module.css'

type TabId = 'race' | 'edit' | 'results' | 'history'

const TABS: { id: TabId; label: string }[] = [
  { id: 'race', label: 'Dodaj wyścig' },
  { id: 'edit', label: 'Edytuj wyścig' },
  { id: 'results', label: 'Wstaw wyniki' },
  { id: 'history', label: 'Historia' },
]

export default function AdminDashboard() {
  const [tab, setTab] = useState<TabId>('race')
  const editRef = useRef<AdminEditRaceTabHandle>(null)
  const resultsRef = useRef<AdminResultsTabHandle>(null)
  const historyRef = useRef<AdminHistoryTabHandle>(null)

  const handleTabClick = useCallback(
    async (next: TabId) => {
      if (next === tab) {
        if (next === 'edit') await editRef.current?.backToList()
        else if (next === 'results') resultsRef.current?.backToList()
        else if (next === 'history') historyRef.current?.backToRoot()
        return
      }
      if (tab === 'edit') {
        const ok = await editRef.current?.confirmLeaveIfEditing()
        if (ok === false) return
      }
      setTab(next)
    },
    [tab],
  )

  const openEditFromHistory = useCallback(
    async (race: AdminDbRaceListItem) => {
      if (tab === 'edit') {
        await editRef.current?.openRace(race)
        return
      }
      setTab('edit')
      setTimeout(() => {
        void editRef.current?.openRace(race)
      }, 0)
    },
    [tab],
  )

  const openResultsFromHistory = useCallback(
    (race: AdminDbRaceListItem) => {
      if (tab === 'results') {
        resultsRef.current?.openRace(race)
        return
      }
      setTab('results')
      setTimeout(() => {
        resultsRef.current?.openRace(race)
      }, 0)
    },
    [tab],
  )

  return (
    <div className={styles.wrap}>
      <div className={styles.tabs} role="tablist" aria-label="Panel administratora">
        {TABS.map(t => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            className={`${styles.tab} ${tab === t.id ? styles.tabActive : ''}`}
            onClick={() => void handleTabClick(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'race' && <AdminAddRaceTab />}
      {tab === 'edit' && <AdminEditRaceTab ref={editRef} />}
      {tab === 'results' && <AdminResultsTab ref={resultsRef} />}
      {tab === 'history' && (
        <AdminHistoryTab
          ref={historyRef}
          onOpenEditRace={openEditFromHistory}
          onOpenResultsRace={openResultsFromHistory}
        />
      )}
    </div>
  )
}
