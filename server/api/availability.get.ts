/**
 * @file availability.get.ts
 * @description Serves EJ's freelance availability from data/availability.json,
 *   read at request time (same pattern as gear-csv) so flipping the knob on the
 *   VPS + `pm2 reload` updates the live blurb without a rebuild.
 * @endpoint GET /api/availability
 * @returns { open: boolean, bookedUntil: string }
 */
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

export default defineEventHandler(async () => {
  // Default to open so the page never breaks if the file is missing/malformed.
  try {
    const raw = await readFile(resolve('data/availability.json'), 'utf-8')
    const json = JSON.parse(raw)
    return {
      open: json.open !== false,
      bookedUntil: typeof json.bookedUntil === 'string' ? json.bookedUntil : '',
    }
  } catch {
    return { open: true, bookedUntil: '' }
  }
})
