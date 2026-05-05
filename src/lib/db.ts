import postgres from 'postgres'
import { existsSync, readFileSync } from 'fs'
import { join } from 'path'

let sql: any = null
let sqlUrl = ''

function readDatabaseUrlFromEnvLocal(): string {
  try {
    const envPath = join(process.cwd(), '.env.local')
    if (!existsSync(envPath)) return ''
    const raw = readFileSync(envPath, 'utf8')
    const m = raw.match(/^DATABASE_URL\s*=\s*(.+)$/m)
    if (!m) return ''
    return m[1].trim().replace(/^["']|["']$/g, '')
  } catch {
    return ''
  }
}

/** Klient SQL (Neon). Brak `DATABASE_URL` → null. */
export function getDb(): any {
  const fromEnv = process.env.DATABASE_URL?.trim() ?? ''
  const fromEnvDirect = process.env.DATABASE_URL_DIRECT?.trim() ?? ''
  const fromFile = process.env.NODE_ENV !== 'production' ? readDatabaseUrlFromEnvLocal() : ''
  const url = (fromEnvDirect || fromFile || fromEnv).trim()
  if (!url) return null
  if (!sql || sqlUrl !== url) {
    if (sql && sqlUrl !== url) {
      void sql.end({ timeout: 5 }).catch(() => {
        /* ignore close errors on reconnect */
      })
    }
    sql = postgres(url, { max: 1 })
    sqlUrl = url
  }
  return sql
}
