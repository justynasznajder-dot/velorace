'use client'

import { useEffect, useRef, useState } from 'react'
import styles from './AdminDashboard.module.css'

type QueuedStartlist = { file: File; fileName: string }

export default function AdminStartlistUpload({
  raceId,
  categoryId,
  queued,
  onQueueChange,
}: {
  raceId: string | null
  categoryId: string | null
  queued?: QueuedStartlist | null
  onQueueChange?: (next: QueuedStartlist | null) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [status, setStatus] = useState<'idle' | 'uploading' | 'deleting'>('idle')
  const [error, setError] = useState<string>('')
  const [success, setSuccess] = useState<string>('')

  async function uploadFile(file: File, activeRaceId: string, activeCategoryId: string) {
    setStatus('uploading')
    setError('')
    setSuccess('')

    const data = new FormData()
    data.set('raceId', activeRaceId)
    data.set('categoryId', activeCategoryId)
    data.set('file', file)

    const res = await fetch(`/api/admin/races/${encodeURIComponent(activeRaceId)}/startlists/upload`, {
      method: 'POST',
      credentials: 'include',
      body: data,
    })

    const payload = (await res.json().catch(() => ({}))) as { ok?: boolean; message?: string; url?: string; fileName?: string }
    if (!res.ok || !payload.ok) {
      setStatus('idle')
      setError(payload.message || 'Nie udało się wgrać listy startowej.')
      return false
    }

    setStatus('idle')
    setSuccess('Upload zakończony pomyślnie.')
    onQueueChange?.(null)
    return true
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const fileName = file.name || 'startlist.pdf'

    // Dodawanie: jeśli nie mamy jeszcze id wyścigu lub id kategorii, kolejkujemy plik.
    if ((!raceId || !categoryId) && onQueueChange) {
      onQueueChange({ file, fileName })
      setSuccess(`Wybrano plik: ${fileName}. Zostanie wysłany po zapisaniu wyścigu.`)
      setError('')
      if (inputRef.current) inputRef.current.value = ''
      return
    }

    // Edycja / podmiana: id-y są znane, uploadujemy od razu.
    if (raceId && categoryId) {
      void uploadFile(file, raceId, categoryId)
      if (inputRef.current) inputRef.current.value = ''
      return
    }

    setError('Brak możliwości uploadu (brak raceId lub categoryId).')
    setSuccess('')
    if (inputRef.current) inputRef.current.value = ''
  }

  useEffect(() => {
    if (!queued) return
    if (!raceId || !categoryId) return
    if (!onQueueChange) return
    if (status !== 'idle') return
    // Auto-upload queued file once we have the DB ids (raceId + categoryId).
    void uploadFile(queued.file, raceId, categoryId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queued, raceId, categoryId, onQueueChange])

  return (
    <div style={{ marginTop: 12 }}>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        <button
          type="button"
          className={styles.btnSecondary}
          onClick={() => inputRef.current?.click()}
          disabled={status !== 'idle'}
        >
          {status === 'uploading' ? 'Wgrywanie…' : queued ? 'Podmień listę startową' : 'Wgraj listę startową'}
        </button>

        {success ? <span style={{ color: 'var(--muted)', fontSize: 12 }}>{success}</span> : null}
        {error ? <span style={{ color: 'var(--red-b)', fontSize: 12 }}>{error}</span> : null}
      </div>

      {!raceId ? (
        <p style={{ margin: '6px 0 0', color: 'var(--stone)', fontSize: 12 }}>
          Najpierw zapisz wyścig — lista startowa zostanie wysłana po zapisaniu.
        </p>
      ) : null}

      <input
        ref={inputRef}
        type="file"
        accept="application/pdf"
        onChange={handleFile}
        style={{ display: 'none' }}
      />
    </div>
  )
}

