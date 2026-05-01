'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Widget from '@/components/shared/Widget'
import { LATEST_RESULTS } from '@/lib/data'
import { useAuth } from '@/components/auth/AuthProvider'
import styles from './LatestResults.module.css'

type ResultUrls = Record<number, string | null>

function PublicDownload({ href }: { href: string | null }) {
  if (!href) {
    return <span className={styles.rowDownloadDisabled}>Brak wyników</span>
  }
  return (
    <a
      href={href}
      className={styles.rowDownload}
      target="_blank"
      rel="noreferrer"
    >
      Pobierz wyniki
    </a>
  )
}

function AdminUpload({
  position,
  fileHref,
  fileName,
  onUploaded,
}: {
  position: number
  fileHref: string | null
  fileName: string | null
  onUploaded: () => void | Promise<void>
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [status, setStatus] = useState<'idle' | 'uploading' | 'error'>('idle')
  const [error, setError] = useState<string>('')

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setStatus('uploading')
    setError('')

    const data = new FormData()
    data.set('position', String(position))
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
    } catch {
      setStatus('error')
      setError('Blad polaczenia.')
    } finally {
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <div className={styles.rowAdmin}>
      {fileHref ? (
        <div className={styles.adminHasFile}>
          <span className={styles.adminHasFileLabel}>Plik PDF jest wgrany</span>
          {fileName ? <span className={styles.adminHasFileName}>{fileName}</span> : null}
          <a
            className={styles.adminHasFileLink}
            href={fileHref}
            target="_blank"
            rel="noreferrer"
          >
            Otwórz / pobierz
          </a>
        </div>
      ) : null}
      <button
        type="button"
        className={styles.rowDownload}
        onClick={() => inputRef.current?.click()}
        disabled={status === 'uploading'}
      >
        {status === 'uploading' ? 'Wgrywanie...' : fileHref ? 'Podmień plik' : 'Wstaw wyniki'}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf"
        onChange={handleFile}
        style={{ display: 'none' }}
      />
      {status === 'error' && <span className={styles.adminError}>{error}</span>}
    </div>
  )
}

export default function LatestResults() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'
  const [downloadHrefs, setDownloadHrefs] = useState<ResultUrls>({})
  const [resultFileNames, setResultFileNames] = useState<ResultUrls>({})

  const refreshUrls = useCallback(async () => {
    try {
      const res = await fetch('/api/results', { cache: 'no-store' })
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean
        urls?: ResultUrls
        downloadUrls?: ResultUrls
        fileNames?: ResultUrls
      }
      if (!data.ok || !data.urls) return
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
    } catch {
      /* ignore */
    }
  }, [])

  useEffect(() => {
    refreshUrls()
  }, [refreshUrls])

  return (
    <Widget title="Wyniki wyścigu:" moreLabel="Wszystkie wyniki →" moreHref="/wyniki">
      {LATEST_RESULTS.map(result => (
        <div key={result.raceId}>
          <div className={styles.raceHeader}>
            <span className={styles.raceName}>{result.raceName}</span>
          </div>

          {result.entries.map(entry => (
            <div key={entry.position} className={styles.row}>
              <div className={styles.pos}>{entry.position}</div>
              <div>
                <div className={styles.name}>{entry.riderName}</div>
                {entry.team.startsWith('Juniorka Młodsza') ? (
                  <>
                    <div className={styles.name}>{entry.team}</div>
                    <div className={styles.team}>27 km (2x13,5 km)</div>
                  </>
                ) : (
                  <div className={styles.team}>{entry.team}</div>
                )}
              </div>
              {isAdmin ? (
                <AdminUpload
                  position={entry.position}
                  fileHref={downloadHrefs[entry.position] ?? null}
                  fileName={resultFileNames[entry.position] ?? null}
                  onUploaded={refreshUrls}
                />
              ) : (
                <PublicDownload href={downloadHrefs[entry.position] ?? null} />
              )}
            </div>
          ))}
        </div>
      ))}
    </Widget>
  )
}
