/**
 * @file rides-atlas.get.ts
 * @description Serves the combined all-rides atlas plate (ghosts + states).
 * @endpoint GET /api/rides-atlas
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
