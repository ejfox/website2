/**
 * @file rides/[slug].get.ts
 * @description GET /api/rides/:slug. One processed ride (track + moments + stats)
 *   from content/processed/rides/<slug>.json. Throws 400 unless the slug is
 *   [a-z0-9-]+ (also blocks path traversal), 404 if missing or draft.
 */
import { defineEventHandler, getRouterParam, createError } from 'h3'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug') || ''
  if (!/^[a-z0-9-]+$/.test(slug)) {
    throw createError({ statusCode: 400, message: 'Invalid ride slug' })
  }
  try {
    const raw = await readFile(
      resolve(process.cwd(), `content/processed/rides/${slug}.json`),
      'utf8'
    )
    const ride = JSON.parse(raw)
    // Belt and braces: the processor skips drafts, but a stale JSON could remain.
    if (ride.draft) {
      throw createError({ statusCode: 404, message: 'Ride not found' })
    }
    return ride
  } catch (error: unknown) {
    // Re-throw our own 404; anything else (ENOENT, bad JSON) becomes a 404 too.
    if ((error as { statusCode?: number }).statusCode) throw error
    throw createError({ statusCode: 404, message: 'Ride not found' })
  }
})
