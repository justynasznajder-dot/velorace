'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { type AuthUser } from '@/lib/auth'

type AuthContextValue = {
  user: AuthUser | null
  loading: boolean
  login: (email: string, password: string) => Promise<{ ok: boolean; message?: string }>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    const ac = new AbortController()
    const timeoutMs = 15000
    const t = window.setTimeout(() => ac.abort(), timeoutMs)

    ;(async () => {
      try {
        const res = await fetch('/api/auth/me', { cache: 'no-store', signal: ac.signal })
        if (!res.ok) return
        const data = (await res.json()) as { user?: AuthUser }
        if (active && data.user?.role === 'admin') {
          setUser(data.user)
        }
      } catch {
        /* sieć / parsowanie / timeout — user=null */
      } finally {
        window.clearTimeout(t)
        // Zawsze kończymy „loading” — w Strict Mode cleanup ustawia active=false przed końcem fetcha;
        // gdybyśmy tu sprawdzali active, UI zostawałoby na zawsze na „Sprawdzam sesję…”.
        setLoading(false)
      }
    })()

    return () => {
      active = false
      ac.abort()
      window.clearTimeout(t)
    }
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    const data = (await res.json().catch(() => ({}))) as { user?: AuthUser; message?: string }
    if (!res.ok || !data.user) {
      return { ok: false, message: data.message || 'Nie udalo sie zalogowac.' }
    }
    setUser(data.user)
    return { ok: true }
  }, [])

  const logout = useCallback(async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    setUser(null)
  }, [])

  const value = useMemo(() => ({ user, loading, login, logout }), [user, loading, login, logout])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return ctx
}
