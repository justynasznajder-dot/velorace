import bcrypt from 'bcryptjs'
import { getDb } from '@/lib/db'
import type { AuthUser } from '@/lib/auth'
import { validateAdminCredentials } from '@/lib/serverAuth'

type UserRow = {
  id: string
  email: string
  password_hash: string | null
  role: string
  is_active: boolean
}

/**
 * Logowanie administratora: najpierw tabela `users` (bcrypt), potem opcjonalnie
 * fallback ENV (ADMIN_EMAIL / ADMIN_PASSWORD) jak przy braku wiersza w bazie lub braku `getDb()`.
 */
export async function authenticateAdminLogin(emailRaw: string, password: string): Promise<AuthUser | null> {
  const email = emailRaw.trim()
  if (!email || !password) return null

  const sql = getDb()
  if (sql) {
    try {
      const rows = await sql`
        SELECT
          id::text AS id,
          email,
          password_hash::text AS password_hash,
          role::text AS role,
          is_active
        FROM users
        WHERE lower(trim(email)) = lower(${email})
        LIMIT 1
      `
      const row = rows[0] as UserRow | undefined
      if (row) {
        if (!row.is_active) return null
        if (row.role !== 'admin') return null

        const hash = row.password_hash?.trim() ?? ''
        if (hash.length > 0) {
          const ok = await bcrypt.compare(password, hash)
          if (!ok) return null
          return { email: row.email, role: 'admin', id: row.id }
        }

        /* Brak hasła w DB — np. konto tylko pod OAuth; pozwól na ten sam email przez ENV. */
        if (validateAdminCredentials(row.email, password)) {
          return { email: row.email, role: 'admin', id: row.id }
        }
        return null
      }
    } catch (e) {
      console.error('[authenticateAdminLogin]', e)
      /* przy awarii DB spróbuj ENV */
    }
  }

  if (validateAdminCredentials(email, password)) {
    return { email, role: 'admin' }
  }
  return null
}
