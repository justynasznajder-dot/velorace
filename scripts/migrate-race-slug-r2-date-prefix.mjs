/**
 * Jednorazowa migracja: stary slug `{nazwa}-{YYYYMMDD}` → `{YYYYMMDD}-{nazwa}` (zgodnie z defaultAutoRaceSlug).
 * Kopiuje obiekty R2 (wyscigi_* / listy_startowe), aktualizuje races.slug oraz ścieżki regulaminu.
 *
 * Użycie:
 *   node scripts/migrate-race-slug-r2-date-prefix.mjs
 *   node scripts/migrate-race-slug-r2-date-prefix.mjs --dry-run
 *
 * Wymaga: DATABASE_URL, R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME (np. z .env.local).
 */
import fs from 'fs'
import { dirname, join, resolve } from 'path'
import { fileURLToPath } from 'url'
import postgres from 'postgres'
import {
  CopyObjectCommand,
  DeleteObjectsCommand,
  ListObjectsV2Command,
  S3Client,
} from '@aws-sdk/client-s3'

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
    if (process.env[key] === undefined || process.env[key] === '') {
      process.env[key] = val
    }
  }
}

loadEnvLocal()

const dryRun = process.argv.includes('--dry-run')

function slugifyBase(name) {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80)
}

function resultsBlobSlugSegment(slug) {
  const t = String(slug ?? '')
    .trim()
    .replace(/\/+/g, '-')
    .replace(/^\.+/, '')
  return t || 'race'
}

function normalizeSlugHyphens(s) {
  return String(s).replace(/-+/g, '-').replace(/^-|-$/g, '')
}

function defaultAutoRaceSlug(name, raceDateYyyyMmDd) {
  const d = raceDateYyyyMmDd.trim().replace(/-/g, '')
  const core = slugifyBase(name)
  const raw = core ? `${d}-${core}` : d
  return normalizeSlugHyphens(raw)
}

function oldAutoRaceSlug(name, raceDateYyyyMmDd) {
  const d = raceDateYyyyMmDd.trim().replace(/-/g, '')
  return normalizeSlugHyphens(`${slugifyBase(name)}-${d}`)
}

function raceYearFromDate(raceDateText) {
  const y = Number.parseInt(String(raceDateText).slice(0, 4), 10)
  return Number.isInteger(y) && y >= 2000 && y <= 9999 ? y : new Date().getFullYear()
}

function rewriteSegInKey(key, oldSeg, newSeg) {
  if (!key || !oldSeg || oldSeg === newSeg) return key
  const i = key.indexOf(oldSeg)
  if (i === -1) return key
  return key.slice(0, i) + newSeg + key.slice(i + oldSeg.length)
}

function rewriteRegulationFileUrl(url, oldSeg, newSeg) {
  if (!url || oldSeg === newSeg) return url
  const u = String(url).trim()
  if (u.includes('/api/storage/file')) {
    try {
      const qIdx = u.indexOf('?')
      if (qIdx === -1) return u
      const base = u.slice(0, qIdx)
      const params = new URLSearchParams(u.slice(qIdx + 1))
      const key = params.get('key')
      if (key) {
        const nk = rewriteSegInKey(key, oldSeg, newSeg)
        if (nk !== key) {
          params.set('key', nk)
          return `${base}?${params.toString()}`
        }
      }
    } catch {
      return u
    }
  }
  if (u.includes(oldSeg)) return rewriteSegInKey(u, oldSeg, newSeg)
  return u
}

function s3Client() {
  const accountId = process.env.R2_ACCOUNT_ID?.trim()
  const accessKeyId = process.env.R2_ACCESS_KEY_ID?.trim()
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY?.trim()
  const bucket = process.env.R2_BUCKET_NAME?.trim()
  if (!accountId || !accessKeyId || !secretAccessKey || !bucket) {
    throw new Error('Brak R2_ACCOUNT_ID / R2_ACCESS_KEY_ID / R2_SECRET_ACCESS_KEY / R2_BUCKET_NAME.')
  }
  return {
    s3: new S3Client({
      region: 'auto',
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: { accessKeyId, secretAccessKey },
    }),
    bucket,
  }
}

async function listAllKeys(client, bucket, prefix) {
  const keys = []
  let token
  for (;;) {
    const res = await client.send(
      new ListObjectsV2Command({
        Bucket: bucket,
        Prefix: prefix,
        ContinuationToken: token,
        MaxKeys: 1000,
      }),
    )
    for (const o of res.Contents ?? []) {
      if (o.Key) keys.push(o.Key)
    }
    if (!res.IsTruncated) break
    token = res.NextContinuationToken
  }
  return keys
}

async function copyKeys(s3, bucket, keys, oldPrefix, newPrefix) {
  for (const key of keys) {
    if (!key.startsWith(oldPrefix)) continue
    const destKey = newPrefix + key.slice(oldPrefix.length)
    const copySource = `${bucket}/${key.split('/').map(encodeURIComponent).join('/')}`
    await s3.send(
      new CopyObjectCommand({
        Bucket: bucket,
        Key: destKey,
        CopySource: copySource,
      }),
    )
  }
}

async function deleteKeys(s3, bucket, keys) {
  const chunk = 1000
  for (let i = 0; i < keys.length; i += chunk) {
    const part = keys.slice(i, i + chunk)
    await s3.send(
      new DeleteObjectsCommand({
        Bucket: bucket,
        Delete: { Objects: part.map(Key => ({ Key })), Quiet: true },
      }),
    )
  }
}

function planNewSlug(row) {
  const slug = String(row.slug ?? '')
  const name = String(row.name ?? '')
  const raceDate = String(row.race_date ?? '').slice(0, 10)
  const dateCompact = raceDate.replace(/-/g, '')
  if (!/^\d{8}$/.test(dateCompact)) {
    return { skip: true, reason: 'niepoprawna data wyścigu' }
  }

  if (slug.startsWith(`${dateCompact}-`)) {
    return { skip: true, reason: 'już format YYYYMMDD-…' }
  }

  const fromOldAuto = oldAutoRaceSlug(name, raceDate)
  if (slug === fromOldAuto) {
    return { skip: false, newSlug: defaultAutoRaceSlug(name, raceDate) }
  }

  if (slug.endsWith(`-${dateCompact}`)) {
    const base = slug.slice(0, -(dateCompact.length + 1))
    return { skip: false, newSlug: normalizeSlugHyphens(`${dateCompact}-${base}`) }
  }

  return {
    skip: true,
    reason: 'ręczny slug — nie pasuje do wzorca końcówki -data; popraw ręcznie lub dopasuj skrypt',
  }
}

async function main() {
  const dbUrl = process.env.DATABASE_URL?.trim()
  if (!dbUrl) {
    console.error('Brak DATABASE_URL.')
    process.exit(1)
  }

  const sql = postgres(dbUrl, { max: 1 })
  const { s3, bucket } = s3Client()

  try {
    const rows = await sql`
      SELECT id::text AS id, name, slug, race_date::text AS race_date,
             regulation_storage_path, regulation_file_url
      FROM races
      ORDER BY race_date ASC, name ASC
    `

    console.log(`Znaleziono ${rows.length} wyścigów. dry-run=${dryRun}`)

    for (const row of rows) {
      const plan = planNewSlug(row)
      if (plan.skip) {
        console.log(`— [${row.id}] ${row.slug}: pomijam (${plan.reason})`)
        continue
      }

      let { newSlug } = plan
      const oldSlug = String(row.slug)
      const oldSeg = resultsBlobSlugSegment(oldSlug)
      let newSeg = resultsBlobSlugSegment(newSlug)
      const year = raceYearFromDate(row.race_date)

      for (let attempt = 0; attempt < 8; attempt++) {
        const clash = await sql`
          SELECT id::text FROM races WHERE slug = ${newSlug} AND id <> ${row.id}::uuid LIMIT 1
        `
        if (!clash.length) break
        newSlug = `${newSlug}-${Date.now().toString(36)}`
        newSeg = resultsBlobSlugSegment(newSlug)
      }

      const wyscigiOld = `wyscigi_${year}/${oldSeg}/`
      const wyscigiNew = `wyscigi_${year}/${newSeg}/`
      const listyOld = `listy_startowe/${year}/${oldSeg}/`
      const listyNew = `listy_startowe/${year}/${newSeg}/`

      console.log(`* [${row.id}] ${oldSlug} → ${newSlug}`)

      const keysWy = await listAllKeys(s3, bucket, wyscigiOld)
      const keysLi = await listAllKeys(s3, bucket, listyOld)
      const allOld = [...keysWy, ...keysLi]

      if (dryRun) {
        console.log(`  R2: skopiowałbym ${keysWy.length} + ${keysLi.length} kluczy`)
        continue
      }

      if (allOld.length > 0) {
        await copyKeys(s3, bucket, keysWy, wyscigiOld, wyscigiNew)
        await copyKeys(s3, bucket, keysLi, listyOld, listyNew)
      }

      const regPath = row.regulation_storage_path
        ? rewriteSegInKey(String(row.regulation_storage_path), oldSeg, newSeg)
        : null
      const regUrl = row.regulation_file_url
        ? rewriteRegulationFileUrl(String(row.regulation_file_url), oldSeg, newSeg)
        : null

      await sql`
        UPDATE races
        SET
          slug = ${newSlug},
          regulation_storage_path = ${regPath},
          regulation_file_url = ${regUrl},
          updated_at = NOW()
        WHERE id = ${row.id}::uuid
      `

      if (allOld.length > 0) {
        await deleteKeys(s3, bucket, allOld)
      }

      console.log(`  OK (R2: ${allOld.length} obiektów przeniesionych)`)
    }

    console.log('Gotowe.')
  } catch (e) {
    console.error('Błąd:', e?.message || e)
    process.exit(1)
  } finally {
    await sql.end({ timeout: 5 })
  }
}

main()
