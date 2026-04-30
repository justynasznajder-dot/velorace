'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { useAuth } from '@/components/auth/AuthProvider'
import { ADMIN_EMAIL } from '@/lib/auth'
import styles from './page.module.css'

export default function LoginPage() {
  const router = useRouter()
  const { user, loading, login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)

  if (loading) {
    return (
      <>
        <Navbar />
        <main className={styles.page}>
          <h1 className={styles.title}>Logowanie</h1>
          <div className={styles.card}>
            <p>Sprawdzam sesje...</p>
          </div>
        </main>
        <Footer />
      </>
    )
  }

  if (user) {
    return (
      <>
        <Navbar />
        <main className={styles.page}>
          <h1 className={styles.title}>Logowanie</h1>
          <div className={styles.card}>
            <p>Zalogowano jako {user.email}.</p>
          </div>
        </main>
        <Footer />
      </>
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setPending(true)
    const result = await login(email, password)
    if (!result.ok) {
      setError(result.message || 'Nieprawidlowy email lub haslo.')
      setPending(false)
      return
    }
    router.push('/')
  }

  return (
    <>
      <Navbar />
      <main className={styles.page}>
        <h1 className={styles.title}>Logowanie</h1>
        <form onSubmit={handleSubmit} className={styles.card}>
          <label className={styles.label} htmlFor="email">Login</label>
          <input
            id="email"
            type="text"
            className={styles.input}
            value={email}
            onChange={e => setEmail(e.target.value)}
            autoComplete="username"
            required
          />

          <label className={styles.label} htmlFor="password">Haslo</label>
          <input
            id="password"
            type="password"
            className={styles.input}
            value={password}
            onChange={e => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />

          {error && <p className={styles.error}>{error}</p>}

          <button type="submit" className={styles.btn} disabled={pending}>
            {pending ? 'Logowanie...' : 'Zaloguj sie'}
          </button>
          <p className={styles.hint}>
            Konto testowe admin: {ADMIN_EMAIL}
          </p>
        </form>
      </main>
      <Footer />
    </>
  )
}
