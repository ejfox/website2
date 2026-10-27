/**
 * @file rides.get.ts
 * @description GET /api/rides. The processed rides index,
 *   content/processed/rides/index.json. Drafts are already excluded at process
 *   time by scripts/build/process-rides.mjs. Returns [] if the file is missing.
 */
import { defineEventHandler } from 'h3'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

export default defineEventHandler(async () => {
  try {
    const raw = await readFile(
      resolve(process.cwd(), 'content/processed/rides/index.json'),
      'utf8'
    )
    return JSON.parse(raw)
  } catch {
    return []
  }
})
