/**
 * @file availability.get.ts
 * @description Serves EJ's freelance availability from data/availability.json,
 *   read at request time (same pattern as gear-csv) so flipping the knob on the
 *   VPS + `pm2 reload` updates the live blurb without a rebuild.
 * @endpoint GET /api/availability
 * @returns { known: false } | { known: true, capacity, openSlots, bookedUntil }
 *
 * Fails CLOSED. Every failure path — missing file, bad JSON, a field that isn't
 * a number — returns `{ known: false }`, and the page renders no availability
 * claim at all.
 *
 * This used to default to `{ capacity: 3, openSlots: 3 }` "so the page never
 * breaks", which meant a missing or malformed file made the site advertise
 * MAXIMUM availability. That is the worst possible default: the one claim on
 * this page that can waste a stranger's time and embarrass EJ is the one that
 * was guessed. Silence is always a safe thing to say about your own calendar;
 * "I'm wide open" is not.
 */
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const UNKNOWN = { known: false as const }

export default defineEventHandler(async () => {
  try {
    const raw = await readFile(resolve('data/availability.json'), 'utf-8')
    const json = JSON.parse(raw)

    // Both numbers must be present and sane. A partially-valid file is not a
    // reason to invent the missing half — `openSlots` defaulting to `capacity`
    // is exactly how "file got truncated" became "3 slots are open".
    if (!Number.isFinite(json.capacity) || !Number.isFinite(json.openSlots)) {
      return UNKNOWN
    }

    const capacity = Math.max(1, Math.trunc(json.capacity))
    const openSlots = Math.min(
      capacity,
      Math.max(0, Math.trunc(json.openSlots))
    )

    return {
      known: true as const,
      capacity,
      openSlots,
      bookedUntil: typeof json.bookedUntil === 'string' ? json.bookedUntil : '',
    }
  } catch {
    return UNKNOWN
  }
})
