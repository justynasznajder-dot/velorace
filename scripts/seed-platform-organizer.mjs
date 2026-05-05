/**
 * Wstawia organizatora Platforma VeloRace i łączy aktywnych adminów w organizer_members.
 * Użycie: npm run db:seed-platform-organizer
 */
import fs from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'
import postgres from 'postgres'

const __dirname = dirname(fileURLToPath(import.meta.url))

function loadEnvLocal() {
  const p = join(__dirname, '..', '.env.local')
  if (!fs.existsSync(p)) return
  for (const line of fs.readFileSync(p, 'utf8').split(/\r?\n/)) {
    const t = line.trim()
    if (!t || t.startsWith('#')) continue
    const i = t.indexOf('=')
    if (i === -1) continue
    const key = t.slice(0, i).trim()
    let val = t.slice(i + 1).trim()
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1)
    }
    if (key === 'DATABASE_URL' && !process.env.DATABASE_URL) {
      process.env.DATABASE_URL = val
    }
  }
}

loadEnvLocal()

const url = process.env.DATABASE_URL?.trim()
if (!url) {
  console.error('Brak DATABASE_URL (np. w .env.local).')
  process.exit(1)
}

const file = join(__dirname, '..', 'database', 'seed-platform-organizer.sql')
const raw = fs.readFileSync(file, 'utf8')

const sql = postgres(url, { max: 1 })

try {
  await sql.unsafe(raw)
  console.log('OK: Platforma VeloRace (a0000000-0000-4000-8000-000000000001) + organizer_members dla adminów.')
} catch (e) {
  console.error('Błąd SQL:', e?.message || e)
  process.exit(1)
} finally {
  await sql.end({ timeout: 5 })
}
