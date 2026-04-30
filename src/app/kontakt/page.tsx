'use client'

import { useState } from 'react'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import styles from './page.module.css'

export default function KontaktPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [status, setStatus] = useState<'idle' | 'sending' | 'ok' | 'error'>('idle')
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('sending')
    setError('')

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, subject, message }),
      })
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; message?: string }
      if (!res.ok || !data.ok) {
        setStatus('error')
        setError(data.message || 'Nie udało się wysłać wiadomości.')
        return
      }
      setStatus('ok')
      setName('')
      setEmail('')
      setSubject('')
      setMessage('')
    } catch {
      setStatus('error')
      setError('Błąd połączenia.')
    }
  }

  return (
    <>
      <Navbar />
      <main className={styles.page}>
        <h1 className={styles.pageTitle}>Kontakt</h1>

        <div className={styles.grid}>
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>Obsługa platformy</h2>
            <p>
              📧{' '}
              <a href="mailto:kontakt@velorace.pl">kontakt@velorace.pl</a>
            </p>
            <p>
              📞 <a href="tel:+48607267492">607 267 492</a>
            </p>
          </div>
        </div>

        <section className={styles.formSection}>
          <h2 className={styles.formTitle}>Formularz kontaktowy</h2>

          <form className={styles.form} onSubmit={handleSubmit}>
            <div className={styles.formRow}>
              <label className={styles.label} htmlFor="name">
                Imię i nazwisko *
              </label>
              <input
                id="name"
                type="text"
                className={styles.input}
                value={name}
                onChange={e => setName(e.target.value)}
                required
              />
            </div>

            <div className={styles.formRow}>
              <label className={styles.label} htmlFor="email">
                Email *
              </label>
              <input
                id="email"
                type="email"
                className={styles.input}
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>

            <div className={styles.formRow}>
              <label className={styles.label} htmlFor="subject">
                Temat
              </label>
              <input
                id="subject"
                type="text"
                className={styles.input}
                value={subject}
                onChange={e => setSubject(e.target.value)}
              />
            </div>

            <div className={styles.formRow}>
              <label className={styles.label} htmlFor="message">
                Wiadomość *
              </label>
              <textarea
                id="message"
                className={styles.textarea}
                value={message}
                onChange={e => setMessage(e.target.value)}
                rows={6}
                required
              />
            </div>

            {status === 'error' && <p className={styles.errorMsg}>{error}</p>}
            {status === 'ok' && (
              <p className={styles.okMsg}>Dziękujemy! Wiadomość została wysłana.</p>
            )}

            <button
              type="submit"
              className={styles.submitBtn}
              disabled={status === 'sending'}
            >
              {status === 'sending' ? 'Wysyłanie...' : 'Wyślij wiadomość'}
            </button>
          </form>
        </section>
      </main>
      <Footer />
    </>
  )
}
