/**
 * Migracja plików wyników/regulaminów w Vercel Blob:
 * - z: wyniki/...
 * - do: wyscigi_<rok>/...
 *
 * Domyślnie działa w dry-run (bez zapisu).
 *
 * Użycie:
 *   node scripts/migrate-results-blob-prefix.mjs
 *   node scripts/migrate-results-blob-prefix.mjs --year=2026 --apply
 *   node scripts/migrate-results-blob-prefix.mjs --year=2026 --apply --delete-source
 *   node scripts/migrate-results-blob-prefix.mjs --from=wyniki --to=wyscigi_2026 --apply
 */
import fs from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'
import { del, list, put } from '@vercel/blob'

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

function readArg(name) {
  const p = `--${name}=`
  const hit = process.argv.find(a => a.startsWith(p))
  if (!hit) return null
  return hit.slice(p.length).trim()
}

function hasFlag(name) {
  return process.argv.includes(`--${name}`)
}

async function listAll(prefix) {
  const out = []
  let cursor = undefined
  for (;;) {
    const batch = await list({ prefix, cursor })
    out.push(...batch.blobs)
    if (!batch.hasMore || !batch.cursor) break
    cursor = batch.cursor
  }
  return out
}

function mapPathname(pathname, fromRoot, toRoot) {
  const fromPrefix = `${fromRoot}/`
  if (!pathname.startsWith(fromPrefix)) return null
  const rest = pathname.slice(fromPrefix.length)
  if (!rest) return null
  return `${toRoot}/${rest}`
}

async function main() {
  loadEnvLocal()

  if (!process.env.BLOB_READ_WRITE_TOKEN?.trim()) {
    console.error('Brak BLOB_READ_WRITE_TOKEN (np. w .env.local).')
    process.exit(1)
  }

  const yearRaw = readArg('year')
  const year = yearRaw ? Number(yearRaw) : new Date().getFullYear()
  if (!Number.isInteger(year) || year < 2000 || year > 9999) {
    console.error('Niepoprawny --year. Oczekiwano roku, np. 2026.')
    process.exit(1)
  }

  const fromRoot = readArg('from') || 'wyniki'
  const toRoot = readArg('to') || `wyscigi_${year}`
  const apply = hasFlag('apply')
  const deleteSource = hasFlag('delete-source')

  if (fromRoot === toRoot) {
    console.error('Źródło i cel są takie same.')
    process.exit(1)
  }

  const sourcePrefix = `${fromRoot}/`
  console.log(`Źródło: ${sourcePrefix}`)
  console.log(`Cel:    ${toRoot}/`)
  console.log(`Tryb:   ${apply ? 'APPLY' : 'DRY-RUN'}`)
  console.log(`Usuń źródło po kopiowaniu: ${deleteSource ? 'TAK' : 'NIE'}`)

  const blobs = await listAll(sourcePrefix)
  if (blobs.length === 0) {
    console.log('Brak plików do migracji.')
    return
  }

  let migrated = 0
  let skipped = 0
  let failed = 0

  for (const blob of blobs) {
    const nextPath = mapPathname(blob.pathname, fromRoot, toRoot)
    if (!nextPath) {
      skipped += 1
      continue
    }

    if (!apply) {
      console.log(`[DRY] ${blob.pathname} -> ${nextPath}`)
      migrated += 1
      continue
    }

    try {
      const res = await fetch(blob.url)
      if (!res.ok) {
        throw new Error(`HTTP ${res.status} przy pobieraniu ${blob.url}`)
      }
      const data = await res.arrayBuffer()

      await put(nextPath, Buffer.from(data), {
        access: 'public',
        addRandomSuffix: false,
        allowOverwrite: true,
        contentType: blob.contentType || 'application/pdf',
      })

      if (deleteSource) {
        await del(blob.url)
      }

      console.log(`[OK]  ${blob.pathname} -> ${nextPath}`)
      migrated += 1
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e)
      console.error(`[ERR] ${blob.pathname}: ${message}`)
      failed += 1
    }
  }

  console.log('')
  console.log('Podsumowanie:')
  console.log(`- znalezione: ${blobs.length}`)
  console.log(`- zmigrowane: ${migrated}`)
  console.log(`- pominięte:  ${skipped}`)
  console.log(`- błędy:      ${failed}`)
  if (!apply) {
    console.log('To był dry-run. Dodaj --apply, aby wykonać migrację.')
  }
}

main().catch(e => {
  console.error('Błąd krytyczny:', e instanceof Error ? e.message : String(e))
  process.exit(1)
})
