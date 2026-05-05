/**
 * Uruchamia plik .sql z katalogu projektu (wiele instrukcji).
 * Użycie: node scripts/run-sql-file.mjs database/migrations/nazwa.sql
 */
import fs from 'fs'
import { dirname, join, resolve } from 'path'
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

const rel = process.argv[2]
if (!rel) {
  console.error('Podaj ścieżkę do pliku .sql, np. database/migrations/20260205_races_country_spots_nullable.sql')
  process.exit(1)
}

const file = resolve(join(__dirname, '..'), rel)
if (!fs.existsSync(file)) {
  console.error('Brak pliku:', file)
  process.exit(1)
}

const url = process.env.DATABASE_URL?.trim()
if (!url) {
  console.error('Brak DATABASE_URL (np. w .env.local).')
  process.exit(1)
}

const raw = fs.readFileSync(file, 'utf8')
const sql = postgres(url, { max: 1 })

try {
  await sql.unsafe(raw)
  console.log('OK:', rel)
} catch (e) {
  console.error('Błąd SQL:', e?.message || e)
  process.exit(1)
} finally {
  await sql.end({ timeout: 5 })
}
