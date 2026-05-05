import { rm } from 'node:fs/promises'
import { resolve } from 'node:path'

const root = process.cwd()
const nextDir = resolve(root, '.next')

try {
  await rm(nextDir, { recursive: true, force: true })
  console.log('[clean-next-cache] Removed .next cache.')
} catch (err) {
  console.error('[clean-next-cache] Failed to remove .next cache.', err)
  process.exitCode = 1
}

