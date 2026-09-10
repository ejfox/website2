/**
 * @file index.get.ts
 * @description Serves the processed rides index (non-draft rides only —
 * drafts are excluded at process time by scripts/build/process-rides.mjs).
 * @endpoint GET /api/rides
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
