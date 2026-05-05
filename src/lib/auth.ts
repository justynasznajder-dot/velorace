export const ADMIN_EMAIL = 'Admin'

export type AuthUser = {
  email: string
  role: 'admin'
  /** UUID z tabeli users — ustawiane przy logowaniu z bazy */
  id?: string
}

export const AUTH_STORAGE_KEY = 'velorace_auth_user'
