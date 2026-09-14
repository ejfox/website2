/**
 * @file availability.get.ts
 * @description Serves EJ's freelance availability from data/availability.json,
 *   read at request time (same pattern as gear-csv) so flipping the knob on the
 *   VPS + `pm2 reload` updates the live blurb without a rebuild.
 * @endpoint GET /api/availability
 * @returns { capacity: number, openSlots: number, bookedUntil: string }
 */
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

export default defineEventHandler(async () => {
  // Default to a fully-open capacity of 3 if the file is missing/malformed,
  // so the page never breaks.
  try {
    const raw = await readFile(resolve('data/availability.json'), 'utf-8')
    const json = JSON.parse(raw)
    const capacity = Number.isFinite(json.capacity)
      ? Math.max(1, json.capacity)
      : 3
    const openSlots = Number.isFinite(json.openSlots)
      ? Math.min(capacity, Math.max(0, json.openSlots))
      : capacity
    return {
      capacity,
      openSlots,
      bookedUntil: typeof json.bookedUntil === 'string' ? json.bookedUntil : '',
    }
  } catch {
    return { capacity: 3, openSlots: 3, bookedUntil: '' }
  }
})
