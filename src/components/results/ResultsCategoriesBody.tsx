'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { ResultEntry } from '@/lib/types'
import type { ResultsPdfSlotMode } from '@/lib/results'
import styles from './LatestResults.module.css'

type ResultUrls = Record<number, string | null>

function PublicDownload({ href, listError }: { href: string | null; listError: string | null }) {
  if (listError) {
    return <span className={styles.rowDownloadDisabled}>—</span>
  }
  if (!href) {
    return (
      <span className={styles.rowDownloadDisabled} title="Brak pliku w Blob dla tej pozycji i wyścigu.">
        Brak wyników
      </span>
    )
  }
  return (
    <a href={href} className={styles.rowDownload} target="_blank" rel="noreferrer">
      Pobierz wyniki
    </a>
  )
}

function AdminUpload({
  raceId,
  position,
  resultsPdfMode,
  fileHref,
  fileName,
  onUploaded,
}: {
  raceId: string
  position: number
  resultsPdfMode: ResultsPdfSlotMode
  fileHref: string | null
  fileName: string | null
  onUploaded: () => void | Promise<void>
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [status, setStatus] = useState<'idle' | 'uploading' | 'deleting' | 'success' | 'error'>('idle')
  const [error, setError] = useState<string>('')
  const [successMessage, setSuccessMessage] = useState<string>('')
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false)

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setStatus('uploading')
    setError('')
    setSuccessMessage('')

    const data = new FormData()
    data.set('raceId', raceId)
    data.set('position', String(position))
    data.set('mode', resultsPdfMode)
    data.set('file', file)

    try {
      const res = await fetch('/api/admin/results/upload', {
        method: 'POST',
        body: data,
      })
      const payload = (await res.json().catch(() => ({}))) as { ok?: boolean; message?: string }
      if (!res.ok || !payload.ok) {
        setStatus('error')
        setError(payload.message || 'Nie udalo sie wgrac pliku.')
        return
      }
      setStatus('idle')
      await Promise.resolve(onUploaded())
      setStatus('success')
      setSuccessMessage('Plik został wgrany.')
    } catch {
      setStatus('error')
      setError('Blad polaczenia.')
    } finally {
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  async function handleDeleteConfirmed() {
    if (!fileHref) return
    setStatus('deleting')
    setError('')
    setSuccessMessage('')
    setConfirmDeleteOpen(false)
    try {
      const q = new URLSearchParams({
        raceId,
        position: String(position),
        mode: resultsPdfMode,
      })
      const res = await fetch(`/api/admin/results/upload?${q.toString()}`, {
        method: 'DELETE',
      })
      const payload = (await res.json().catch(() => ({}))) as { ok?: boolean; message?: string; deleted?: number }
      if (!res.ok || !payload.ok) {
        setStatus('error')
        setError(payload.message || 'Nie udalo sie usunac pliku.')
        return
      }
      setStatus('idle')
      await Promise.resolve(onUploaded())
      const deletedCount = typeof payload.deleted === 'number' ? payload.deleted : 0
      setStatus('success')
      setSuccessMessage(deletedCount > 0 ? `Usunięto ${deletedCount} plik(ów).` : 'Brak plików do usunięcia.')
    } catch {
      setStatus('error')
      setError('Blad polaczenia.')
    }
  }

  return (
    <div className={styles.rowAdmin}>
      {fileHref ? (
        <div className={styles.adminHasFile}>
          <span className={styles.adminHasFileLabel}>Plik PDF jest wgrany</span>
          {fileName ? <span className={styles.adminHasFileName}>{fileName}</span> : null}
          <a className={styles.adminHasFileLink} href={fileHref} target="_blank" rel="noreferrer">
            Otwórz / pobierz
          </a>
        </div>
      ) : null}
      <button
        type="button"
        className={styles.rowDownload}
        onClick={() => inputRef.current?.click()}
        disabled={status === 'uploading' || status === 'deleting'}
      >
        {status === 'uploading'
          ? 'Wgrywanie...'
          : status === 'deleting'
            ? 'Usuwanie...'
            : fileHref
              ? 'Podmień plik'
              : 'Wstaw wyniki'}
      </button>
      {fileHref ? (
        <button
          type="button"
          className={styles.rowDelete}
          onClick={() => setConfirmDeleteOpen(true)}
          disabled={status === 'uploading' || status === 'deleting'}
        >
          Usuń wyniki
        </button>
      ) : null}
      {confirmDeleteOpen ? (
        <div className={styles.deleteConfirmBox}>
          <span className={styles.deleteConfirmText}>Usunąć plik wyników dla tego slotu?</span>
          <div className={styles.deleteConfirmActions}>
            <button
              type="button"
              className={styles.deleteConfirmCancel}
              onClick={() => setConfirmDeleteOpen(false)}
              disabled={status === 'deleting'}
            >
              Anuluj
            </button>
            <button
              type="button"
              className={styles.deleteConfirmOk}
              onClick={() => void handleDeleteConfirmed()}
              disabled={status === 'deleting'}
            >
              Usuń
            </button>
          </div>
        </div>
      ) : null}
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf"
        onChange={handleFile}
        style={{ display: 'none' }}
      />
      {status === 'error' && <span className={styles.adminError}>{error}</span>}
      {status === 'success' && successMessage ? <span className={styles.adminOk}>{successMessage}</span> : null}
    </div>
  )
}

export function useResultBlobUrls(raceId: string, blobMetaRefreshKey: string | number = 0) {
  const [downloadHrefs, setDownloadHrefs] = useState<ResultUrls>({})
  const [resultFileNames, setResultFileNames] = useState<ResultUrls>({})
  const [labels, setLabels] = useState<Record<number, string>>({})
  const [resultsPdfMode, setResultsPdfMode] = useState<ResultsPdfSlotMode>('category')
  const [slotCount, setSlotCount] = useState(5)
  const [blobsLoading, setBlobsLoading] = useState(true)
  const [listError, setListError] = useState<string | null>(null)

  const fetchBlobMeta = useCallback(async () => {
    if (!raceId) return
    const q = new URLSearchParams({ raceId })
    const res = await fetch(`/api/results?${q}`, { cache: 'no-store' })
    const data = (await res.json().catch(() => ({}))) as {
      ok?: boolean
      message?: string
      urls?: ResultUrls
      downloadUrls?: ResultUrls
      fileNames?: ResultUrls
      labels?: Record<number, string>
      resultsPdfMode?: ResultsPdfSlotMode
      slotCount?: number
    }

    if (!res.ok || !data.ok) {
      const msg =
        typeof data.message === 'string' && data.message.trim()
          ? data.message.trim()
          : `Nie udało się pobrać listy wyników (${res.status}).`
      setListError(msg)
      setDownloadHrefs({})
      setResultFileNames({})
      setLabels({})
      return
    }

    if (!data.urls) {
      setListError('Nieprawidłowa odpowiedź serwera (brak pola urls).')
      setDownloadHrefs({})
      setResultFileNames({})
      setLabels({})
      return
    }

    setListError(null)
    const next: ResultUrls = {}
    const names: ResultUrls = {}
    for (const [k, v] of Object.entries(data.urls)) {
      const pos = Number(k)
      const dl = data.downloadUrls?.[pos]
      next[pos] = dl || v || null
      names[pos] = data.fileNames?.[pos] ?? null
    }
    setDownloadHrefs(next)
    setResultFileNames(names)
    setLabels(typeof data.labels === 'object' && data.labels ? data.labels : {})
    setResultsPdfMode(data.resultsPdfMode === 'wave' ? 'wave' : 'category')
    setSlotCount(typeof data.slotCount === 'number' && data.slotCount > 0 ? data.slotCount : 5)
  }, [raceId])

  useEffect(() => {
    let cancelled = false
    setBlobsLoading(true)
    void fetchBlobMeta()
      .catch(() => {
        /* ignore */
      })
      .finally(() => {
        if (!cancelled) setBlobsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [raceId, blobMetaRefreshKey, fetchBlobMeta])

  const refreshUrls = useCallback(async () => {
    await fetchBlobMeta()
  }, [fetchBlobMeta])

  return { downloadHrefs, resultFileNames, labels, resultsPdfMode, slotCount, refreshUrls, blobsLoading, listError }
}

export function ResultsCategoriesBody({
  adminMode,
  authLoading = false,
  raceId,
  raceName,
  entries,
  blobMetaRefreshKey = 0,
}: {
  adminMode: boolean
  authLoading?: boolean
  raceId: string
  raceName: string
  entries: ResultEntry[]
  blobMetaRefreshKey?: string | number
}) {
  const { downloadHrefs, resultFileNames, labels, resultsPdfMode, refreshUrls, blobsLoading, listError } =
    useResultBlobUrls(raceId, blobMetaRefreshKey)

  return (
    <div>
      <div className={styles.raceHeader}>
        <span className={styles.raceName}>{raceName}</span>
      </div>

      {listError ? <p className={styles.resultsListAlert}>{listError}</p> : null}

      {entries.map(entry => {
        const rowLabel = labels[entry.position] ?? entry.riderName
        return (
          <div key={entry.position} className={styles.row}>
            <div className={styles.pos}>{entry.position}</div>
            <div>
              <div className={styles.name}>{rowLabel}</div>
              {entry.team ? <div className={styles.team}>{entry.team}</div> : null}
            </div>
            {authLoading ? (
              <span className={styles.rowActionPending}>Sprawdzanie sesji…</span>
            ) : blobsLoading ? (
              <span className={styles.rowActionPending}>Ładowanie…</span>
            ) : adminMode ? (
              <AdminUpload
                raceId={raceId}
                position={entry.position}
                resultsPdfMode={resultsPdfMode}
                fileHref={downloadHrefs[entry.position] ?? null}
                fileName={resultFileNames[entry.position] ?? null}
                onUploaded={refreshUrls}
              />
            ) : (
              <PublicDownload href={downloadHrefs[entry.position] ?? null} listError={listError} />
            )}
          </div>
        )
      })}
    </div>
  )
}
