/**
 * @file [slug].get.ts
 * @description Serves a single processed ride (track + moments + stats).
 * @endpoint GET /api/rides/:slug
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
    if (ride.draft) {
      throw createError({ statusCode: 404, message: 'Ride not found' })
    }
    return ride
  } catch (error: unknown) {
    if ((error as { statusCode?: number }).statusCode) throw error
    throw createError({ statusCode: 404, message: 'Ride not found' })
  }
})
