/**
 * Tworzy lub aktualizuje użytkownika admina w tabeli users (bcrypt hash).
 *
 * Hasło (wymagane): zmienna środowiska USER_PASSWORD lub pierwszy argument:
 *   USER_PASSWORD='twoje-haslo' node scripts/create-admin-user.mjs
 *   node scripts/create-admin-user.mjs 'twoje-haslo'
 *
 * Email (opcjonalnie): USER_EMAIL (domyślnie rafal.makowski@velorace.pl)
 *
 * Logowanie w `/api/auth/login` weryfikuje tabelę `users` (bcrypt). Gdy wiersz
 * istnieje, użyj w formularzu tego samego emaila i hasła. Opcjonalny fallback
 * ENV (ADMIN_EMAIL / ADMIN_PASSWORD) działa, jeśli nie ma pasującego wiersza w DB.
 */
import fs from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'
import bcrypt from 'bcryptjs'
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
    if (!process.env[key]) process.env[key] = val
  }
}

loadEnvLocal()

const email = (process.env.USER_EMAIL || 'rafal.makowski@velorace.pl').trim().toLowerCase()
const password =
  process.env.USER_PASSWORD?.trim() ||
  (process.argv[2] && String(process.argv[2]).trim()) ||
  ''

if (!password) {
  console.error(
    'Podaj hasło: USER_PASSWORD="..." node scripts/create-admin-user.mjs\nlub: node scripts/create-admin-user.mjs "twoje-haslo"',
  )
  process.exit(1)
}

const url = process.env.DATABASE_URL?.trim()
if (!url) {
  console.error('Brak DATABASE_URL (np. w .env.local).')
  process.exit(1)
}

const firstName = 'Rafał'
const lastName = 'Makowski'
const hash = bcrypt.hashSync(password, 12)

const sql = postgres(url, { max: 1 })

try {
  const rows = await sql`
    INSERT INTO users (
      email,
      password_hash,
      first_name,
      last_name,
      role,
      is_active
    )
    VALUES (
      ${email},
      ${hash},
      ${firstName},
      ${lastName},
      'admin'::user_role,
      TRUE
    )
    ON CONFLICT (email) DO UPDATE SET
      password_hash = EXCLUDED.password_hash,
      first_name = EXCLUDED.first_name,
      last_name = EXCLUDED.last_name,
      role = EXCLUDED.role,
      is_active = TRUE,
      updated_at = NOW()
    RETURNING id, email
  `
  const row = rows[0]
  console.log('OK — użytkownik w bazie:')
  console.log('  id:   ', row?.id)
  console.log('  email:', row?.email)
  console.log('  imię: ', firstName, lastName)
  console.log('  rola: admin, is_active: true')
  console.log('')
  console.log('Zaloguj się tym emailem i hasłem w /login. ENV (ADMIN_*) jest tylko awaryjnym')
  console.log('fallbackiem, gdy w bazie nie ma użytkownika o tym emailu.')
} catch (e) {
  console.error('Błąd:', e?.message || e)
  process.exit(1)
} finally {
  await sql.end({ timeout: 5 })
}
