'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import styles from './AdminDashboard.module.css'

export type AdminFeedbackMessage = { type: 'ok' | 'err'; text: string } | null

type Props = {
  message: AdminFeedbackMessage
  onDismiss: () => void
}

/** Toast zapisu wyścigu — portal na `body`, zawsze przy dołu viewportu (nie zależy od scrolla panelu). */
export default function AdminFeedbackToast({ message, onDismiss }: Props) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!message) return
    if (message.type === 'err') return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onDismiss()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [message, onDismiss])

  useEffect(() => {
    if (!message || message.type !== 'ok') return
    const t = window.setTimeout(() => onDismiss(), 10_000)
    return () => window.clearTimeout(t)
  }, [message, onDismiss])

  if (!mounted || !message) return null

  const isErr = message.type === 'err'

  return createPortal(
    <div
      className={`${styles.feedbackDock} ${isErr ? styles.feedbackDockError : styles.feedbackDockSuccess}`}
      role={isErr ? 'alert' : 'status'}
      aria-live="polite"
    >
      <div className={styles.feedbackDockRow}>
        <p className={styles.feedbackDockText}>{message.text}</p>
        <button
          type="button"
          className={styles.feedbackDockClose}
          onClick={onDismiss}
          aria-label="Zamknij komunikat"
        >
          ×
        </button>
      </div>
    </div>,
    document.body,
  )
}
