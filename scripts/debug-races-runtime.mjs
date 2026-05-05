import fs from 'fs'
import { join, dirname } from 'path'
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
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1)
    }
    if (!process.env[key]) process.env[key] = val
  }
}

loadEnvLocal()

const url = process.env.DATABASE_URL?.trim()
if (!url) {
  console.error('Brak DATABASE_URL.')
  process.exit(1)
}

const sql = postgres(url, { max: 1 })

try {
  const dbMeta = await sql`
    select
      current_database() as db,
      current_user as db_user,
      now() as now_ts
  `
  const rows2026 = await sql`
    SELECT id::text AS id, name, slug, race_date::text AS race_date, status::text AS status
    FROM races
    WHERE EXTRACT(YEAR FROM race_date)::int = 2026
    ORDER BY race_date DESC, name ASC
  `
  const eee = await sql`
    SELECT id::text AS id, name, slug, race_date::text AS race_date, status::text AS status
    FROM races
    WHERE id = '25db00dd-54e7-452f-a8d0-29b21566c274'::uuid
  `

  console.log(
    JSON.stringify(
      {
        db: dbMeta[0]?.db,
        dbUser: dbMeta[0]?.db_user,
        now: dbMeta[0]?.now_ts,
        count2026: rows2026.length,
        rows2026,
        eee,
      },
      null,
      2,
    ),
  )
} catch (e) {
  console.error('Błąd debug-races-runtime:', e?.message || e)
  process.exit(1)
} finally {
  await sql.end({ timeout: 5 })
}

