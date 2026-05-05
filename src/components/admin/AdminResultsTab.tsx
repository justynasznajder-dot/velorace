'use client'

import { forwardRef, useEffect, useImperativeHandle, useMemo, useState } from 'react'
import { getLatestResultByRaceId } from '@/lib/data'
import { RESULT_CATEGORY_POSITIONS } from '@/lib/results'
import type { ResultsPdfSlotMode } from '@/lib/results'
import type { AdminDbRaceListItem } from '@/lib/raceDb'
import type { ResultEntry } from '@/lib/types'
import AdminFeedbackToast from '@/components/admin/AdminFeedbackToast'
import type { AdminFeedbackMessage } from '@/components/admin/AdminFeedbackToast'
import { ResultsCategoriesBody } from '@/components/results/ResultsCategoriesBody'
import styles from './AdminDashboard.module.css'

type RaceResultsPdfSlot = { slot: number; label: string }

type ResultsSlotsPayload = {
  ok: true
  raceId: string
  slug: string
  resultsPdfSlotMode: ResultsPdfSlotMode | null
  effectiveMode: ResultsPdfSlotMode
  categorySlots: RaceResultsPdfSlot[]
  waveSlots: RaceResultsPdfSlot[]
}

function defaultPdfResultSlots(): ResultEntry[] {
  return RESULT_CATEGORY_POSITIONS.map(p => ({
    position: p,
    riderName: `PDF wyników — slot ${p}`,
    team: '',
    time: '—',
    gap: '—',
  }))
}

function slotsToEntries(slots: RaceResultsPdfSlot[]): ResultEntry[] {
  return slots.map(s => ({
    position: s.slot,
    riderName: s.label,
    team: '',
    time: '—',
    gap: '—',
  }))
}

function yearFromIsoDate(iso: string): number | null {
  const m = iso.trim().match(/^(\d{4})-\d{2}-\d{2}$/)
  if (!m) return null
  const y = Number.parseInt(m[1], 10)
  return Number.isFinite(y) ? y : null
}

function raceDateSortValue(isoDate: string): number {
  const t = Date.parse(`${isoDate}T00:00:00`)
  return Number.isFinite(t) ? t : Number.NEGATIVE_INFINITY
}

function isEndedRaceStatus(status: string): boolean {
  return status === 'finished' || status === 'cancelled'
}

function isUpcomingOrTodayRaceDate(raceDate: string): boolean {
  const today = new Date().toISOString().slice(0, 10)
  return raceDate >= today
}

const STATUS_LABEL: Record<string, string> = {
  draft: 'Szkic',
  published: 'Opublikowany',
  registration_open: 'Zapisy otwarte',
  registration_closed: 'Zapisy zamknięte',
  live: 'Na żywo',
  finished: 'Zakończony',
  cancelled: 'Odwołany',
}

function raceDateBadgeParts(raceDate: string): { day: string; month: string; dateLine: string } {
  const m = raceDate.trim().match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (!m) return { day: '—', month: '—', dateLine: raceDate }
  const [, y, mo, d] = m
  const MONTHS = ['STY', 'LUT', 'MAR', 'KWI', 'MAJ', 'CZE', 'LIP', 'SIE', 'WRZ', 'PAŹ', 'LIS', 'GRU'] as const
  const mi = Number(mo) - 1
  return {
    day: String(Number(d)),
    month: mi >= 0 && mi < 12 ? MONTHS[mi] : '—',
    dateLine: `${d}.${mo}.${y} r.`,
  }
}

export type AdminResultsTabHandle = {
  backToList: () => void
  openRace: (race: AdminDbRaceListItem) => void
}

const AdminResultsTab = forwardRef<AdminResultsTabHandle>(function AdminResultsTab(_, ref) {
  const [selectedRaceId, setSelectedRaceId] = useState<string | null>(null)
  const [races, setRaces] = useState<AdminDbRaceListItem[] | null>(null)
  const [slotsMeta, setSlotsMeta] = useState<ResultsSlotsPayload | null>(null)
  const [slotsLoading, setSlotsLoading] = useState(false)
  const [slotsError, setSlotsError] = useState<string | null>(null)
  const [modeSaving, setModeSaving] = useState(false)
  const [blobRefreshKey, setBlobRefreshKey] = useState(0)
  const [deletingAll, setDeletingAll] = useState(false)
  const [confirmDeleteAllOpen, setConfirmDeleteAllOpen] = useState(false)
  const [feedback, setFeedback] = useState<AdminFeedbackMessage>(null)

  useImperativeHandle(ref, () => ({
    backToList: () => setSelectedRaceId(null),
    openRace: (race: AdminDbRaceListItem) => {
      if (!race?.id) return
      setRaces(prev => {
        if (!prev) return [race]
        if (prev.some(x => x.id === race.id)) return prev
        return [race, ...prev]
      })
      setSelectedRaceId(race.id)
    },
  }))

  useEffect(() => {
    let cancelled = false
    fetch('/api/admin/races/database', {
      credentials: 'include',
      cache: 'no-store',
    })
      .then(r => r.json())
      .then((d: { ok?: boolean; races?: AdminDbRaceListItem[] }) => {
        if (cancelled) return
        if (d?.ok && Array.isArray(d.races)) {
          setRaces(d.races)
        }
        else setRaces([])
      })
      .catch(() => {
        if (!cancelled) setRaces([])
      })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!selectedRaceId) {
      setSlotsMeta(null)
      setSlotsError(null)
      setSlotsLoading(false)
      setConfirmDeleteAllOpen(false)
      setFeedback(null)
      return
    }
    let cancelled = false
    setSlotsLoading(true)
    setSlotsError(null)
    setSlotsMeta(null)
    fetch(`/api/admin/races/${encodeURIComponent(selectedRaceId)}/results-slots`, {
      credentials: 'include',
    })
      .then(async r => {
        const d = (await r.json().catch(() => ({}))) as
          | ResultsSlotsPayload
          | { ok?: boolean; message?: string }
        if (cancelled) return
        if (!r.ok || !d || typeof d !== 'object' || !('ok' in d) || !d.ok) {
          const msg =
            typeof (d as { message?: string }).message === 'string'
              ? (d as { message: string }).message
              : 'Nie udało się wczytać slotów wyników.'
          setSlotsError(msg)
          setSlotsMeta(null)
          return
        }
        setSlotsMeta(d as ResultsSlotsPayload)
      })
      .catch(() => {
        if (!cancelled) setSlotsError('Błąd połączenia.')
      })
      .finally(() => {
        if (!cancelled) setSlotsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [selectedRaceId])

  async function handleResultsModeChange(mode: ResultsPdfSlotMode) {
    if (!selectedRaceId || !slotsMeta || modeSaving) return
    if (mode === slotsMeta.effectiveMode && slotsMeta.resultsPdfSlotMode != null) return
    if (mode === 'category' && slotsMeta.categorySlots.length === 0) return
    if (mode === 'wave' && slotsMeta.waveSlots.length === 0) return

    setModeSaving(true)
    try {
      const res = await fetch(`/api/admin/races/${encodeURIComponent(selectedRaceId)}/results-pdf-mode`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode }),
      })
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; message?: string }
      if (!res.ok || !data.ok) {
        setFeedback({
          type: 'err',
          text: typeof data.message === 'string' ? data.message : 'Nie udało się zapisać trybu wyników.',
        })
        return
      }
      const r2 = await fetch(`/api/admin/races/${encodeURIComponent(selectedRaceId)}/results-slots`, {
        credentials: 'include',
      })
      const d2 = (await r2.json().catch(() => ({}))) as ResultsSlotsPayload | { ok?: boolean }
      if (r2.ok && d2 && typeof d2 === 'object' && 'ok' in d2 && d2.ok) {
        setSlotsMeta(d2 as ResultsSlotsPayload)
        setBlobRefreshKey(k => k + 1)
      }
    } finally {
      setModeSaving(false)
    }
  }

  async function handleDeleteAllResultsConfirmed() {
    if (!selectedRaceId || deletingAll) return

    setDeletingAll(true)
    try {
      const res = await fetch(`/api/admin/races/${encodeURIComponent(selectedRaceId)}/results`, {
        method: 'DELETE',
        credentials: 'include',
      })
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; message?: string; deleted?: number }
      if (!res.ok || !data.ok) {
        setFeedback({
          type: 'err',
          text: typeof data.message === 'string' ? data.message : 'Nie udało się usunąć wyników.',
        })
        return
      }
      setBlobRefreshKey(k => k + 1)
      const deletedCount = typeof data.deleted === 'number' ? data.deleted : 0
      setFeedback({
        type: 'ok',
        text:
          deletedCount > 0
            ? `Usunięto ${deletedCount} plik(ów) wyników dla wyścigu.`
            : 'Dla tego wyścigu nie było żadnych plików do usunięcia.',
      })
      setConfirmDeleteAllOpen(false)
    } finally {
      setDeletingAll(false)
    }
  }

  const entries = useMemo((): ResultEntry[] => {
    if (!slotsMeta) return []
    const slots =
      slotsMeta.effectiveMode === 'category' ? slotsMeta.categorySlots : slotsMeta.waveSlots
    if (slots.length === 0) return defaultPdfResultSlots()
    return slotsToEntries(slots)
  }, [slotsMeta])

  const racesSorted = useMemo(() => {
    if (!races) return races
    return [...races].sort((a, b) => {
      const aEnded = isEndedRaceStatus(a.status)
      const bEnded = isEndedRaceStatus(b.status)
      if (aEnded !== bEnded) return aEnded ? 1 : -1

      const aUpcoming = isUpcomingOrTodayRaceDate(a.race_date)
      const bUpcoming = isUpcomingOrTodayRaceDate(b.race_date)
      if (aUpcoming !== bUpcoming) return aUpcoming ? -1 : 1

      if (aUpcoming && bUpcoming) {
        return raceDateSortValue(a.race_date) - raceDateSortValue(b.race_date) || a.name.localeCompare(b.name)
      }
      return raceDateSortValue(b.race_date) - raceDateSortValue(a.race_date) || a.name.localeCompare(b.name)
    })
  }, [races])

  if (selectedRaceId) {
    const selectedRace = racesSorted?.find(r => r.id === selectedRaceId)
    const template = getLatestResultByRaceId(selectedRaceId)
    const raceName = template?.raceName ?? selectedRace?.name ?? 'Wyścig'

    const hasCategories = (slotsMeta?.categorySlots.length ?? 0) > 0
    const hasWaves = (slotsMeta?.waveSlots.length ?? 0) > 0
    const showModePicker = hasCategories || hasWaves

    return (
      <div className={styles.panel}>
        <button type="button" className={styles.backLink} onClick={() => setSelectedRaceId(null)}>
          ← Lista wyścigów
        </button>

        {!selectedRace && races !== null ? (
          <p className={styles.noTemplate}>Nie znaleziono tego wyścigu na liście — wróć i wybierz ponownie.</p>
        ) : (
          <>
            <p className={styles.intro}>
              Wgraj pliki PDF wyników dla każdego slotu zdefiniowanego w wyścigu. Gdy są kategorie lub fale startu,
              pliki trafiają do Vercel Blob pod <code>wyscigi_{'{rok}'}/{'{slug}'}/kategoria/…</code> lub{' '}
              <code>wyscigi_{'{rok}'}/{'{slug}'}/fala/…</code> (zależnie od trybu). Bez kategorii i fal używana jest ścieżka
              legacy (folder po UUID wyścigu). Ponowne wgranie zastępuje plik w danym slocie.
            </p>
            <div className={styles.resultsDangerZone}>
              <button
                type="button"
                className={`${styles.btnSecondary} ${styles.btnDanger}`}
                onClick={() => setConfirmDeleteAllOpen(true)}
                disabled={deletingAll}
              >
                {deletingAll ? 'Usuwanie wyników...' : 'Usuń wszystkie wyniki'}
              </button>
              {confirmDeleteAllOpen ? (
                <div className={styles.resultsDangerConfirmBox}>
                  <p className={styles.resultsDangerConfirmText}>Usunąć wszystkie pliki wyników dla tego wyścigu?</p>
                  <div className={styles.resultsDangerConfirmActions}>
                    <button
                      type="button"
                      className={`${styles.btnSecondary} ${styles.resultsDangerCancel}`}
                      onClick={() => setConfirmDeleteAllOpen(false)}
                      disabled={deletingAll}
                    >
                      Anuluj
                    </button>
                    <button
                      type="button"
                      className={`${styles.btnSecondary} ${styles.btnDanger}`}
                      onClick={() => void handleDeleteAllResultsConfirmed()}
                      disabled={deletingAll}
                    >
                      {deletingAll ? 'Usuwanie...' : 'Usuń'}
                    </button>
                  </div>
                </div>
              ) : null}
            </div>

            {slotsError ? <p className={styles.noTemplate}>{slotsError}</p> : null}

            {slotsLoading ? (
              <p className={styles.slotsLoading}>Wczytywanie kategorii i fal startu…</p>
            ) : slotsMeta && showModePicker ? (
              <>
                <div className={styles.resultsModeBar} aria-busy={modeSaving}>
                  <p className={styles.resultsModeLegend}>Rodzaj wyników</p>
                  <div className={styles.resultsModeOptions}>
                    <label
                      className={`${styles.resultsModeOption} ${!hasCategories ? styles.resultsModeOptionDisabled : ''}`}
                    >
                      <input
                        type="radio"
                        name="results-pdf-mode"
                        checked={slotsMeta.effectiveMode === 'category'}
                        disabled={modeSaving || !hasCategories}
                        onChange={() => void handleResultsModeChange('category')}
                      />
                      Wg kategorii
                    </label>
                    <label
                      className={`${styles.resultsModeOption} ${!hasWaves ? styles.resultsModeOptionDisabled : ''}`}
                    >
                      <input
                        type="radio"
                        name="results-pdf-mode"
                        checked={slotsMeta.effectiveMode === 'wave'}
                        disabled={modeSaving || !hasWaves}
                        onChange={() => void handleResultsModeChange('wave')}
                      />
                      Wg fal startu
                    </label>
                  </div>
                </div>
                {!hasCategories || !hasWaves ? (
                  <p className={styles.resultsModeHint}>
                    {!hasCategories && !hasWaves
                      ? 'Brak kategorii i fal w bazie — użyte zostaną sloty 1–5 (ścieżka legacy). Uzupełnij kategorie lub fale w edycji wyścigu, aby powiązać PDF-y z konkretnymi etykietami.'
                      : !hasCategories
                        ? 'Ten wyścig nie ma zdefiniowanych kategorii — dostępne są tylko wyniki wg fal startu.'
                        : 'Ten wyścig nie ma zdefiniowanych fal startu — dostępne są tylko wyniki wg kategorii.'}
                  </p>
                ) : null}
              </>
            ) : null}

            {!slotsLoading && !slotsError && slotsMeta ? (
              <ResultsCategoriesBody
                adminMode
                raceId={selectedRaceId}
                raceName={raceName}
                entries={entries}
                blobMetaRefreshKey={blobRefreshKey}
              />
            ) : null}
          </>
        )}
        <AdminFeedbackToast message={feedback} onDismiss={() => setFeedback(null)} />
      </div>
    )
  }

  return (
    <div className={styles.panel}>
      <p className={styles.intro}>
        Wybierz wyścig (również archiwalny) — po wejściu zobaczysz sloty na pliki PDF (wg kategorii lub wg fal startu,
        zgodnie z ustawieniami wyścigu).
      </p>

      {racesSorted === null ? (
        <p className={styles.placeholder}>Wczytywanie listy wyścigów…</p>
      ) : racesSorted.length === 0 ? (
        <p className={styles.placeholder}>
          Brak wyścigów na liście — dodaj wyścig w zakładce „Dodaj wyścig”.
        </p>
      ) : (
        <ul className={styles.editRaceList}>
          {racesSorted.map(race => {
            const { day, month, dateLine } = raceDateBadgeParts(race.race_date)

            return (
              <li key={race.id} className={styles.editRaceListItem}>
                <button
                  type="button"
                  className={`${styles.editRaceListMain} ${styles.editRaceListMainClickable}`}
                  onClick={() => setSelectedRaceId(race.id)}
                  aria-label={`Wstaw wyniki: ${race.name}`}
                >
                  <div className={styles.editRaceListRow}>
                    <div className={`${styles.raceListDate} ${styles.editRaceDateBadge}`}>
                      <span className={`${styles.raceListDay} ${styles.editRaceDay}`}>{day}</span>
                      <span className={`${styles.raceListMonth} ${styles.editRaceMonth}`}>{month}</span>
                    </div>
                    <div className={styles.editRaceListText}>
                      <div className={styles.editRaceListTitle}>{race.name}</div>
                      <div className={styles.editRaceListMetaRow}>
                        <span className={styles.editRaceListMetaItem}>
                          <span className={styles.editRaceListMetaIcon} aria-hidden>
                            📍
                          </span>
                          {race.city}
                        </span>
                        <span className={styles.editRaceListMetaItem}>
                          <span className={styles.editRaceListMetaIcon} aria-hidden>
                            📅
                          </span>
                          {dateLine}
                        </span>
                        <span className={styles.editRaceListMetaStatus}>{STATUS_LABEL[race.status] ?? race.status}</span>
                      </div>
                      <div className={styles.editRaceListSlug}>
                        <code>{race.slug}</code>
                      </div>
                    </div>
                  </div>
                </button>
                <button type="button" className={styles.btnSecondary} onClick={() => setSelectedRaceId(race.id)}>
                  Wstaw wyniki
                </button>
              </li>
            )
          })}
        </ul>
      )}
      <AdminFeedbackToast message={feedback} onDismiss={() => setFeedback(null)} />
    </div>
  )
})

export default AdminResultsTab
