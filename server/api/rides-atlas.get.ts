/**
 * @file rides-atlas.get.ts
 * @description GET /api/rides-atlas. The combined all-rides atlas plate (ghosts +
 *   states) from content/processed/rides/atlas.json, for pages/rides.
 *   Returns null if the file is missing.
 */
import { defineEventHandler } from 'h3'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

export default defineEventHandler(async () => {
  try {
    const raw = await readFile(
      resolve(process.cwd(), 'content/processed/rides/atlas.json'),
      'utf8'
    )
    return JSON.parse(raw)
  } catch {
    return null
  }
})
