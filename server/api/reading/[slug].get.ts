/**
 * @file reading/[slug].get.ts
 * @description GET /api/reading/:slug. One book's processed JSON from
 *   content/processed/reading/<slug>.json, merged with Kindle sync data. No cache.
 *   Throws 400 without a slug; 404 if missing or (in production) scheduled.
 */
import { defineEventHandler, getRouterParam, createError } from 'h3'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { isScheduled } from '~/utils/postFilters'
import { withKindleSync } from '~/server/utils/readingKindle'

export default defineEventHandler(async (event) => {
  const rawSlug = getRouterParam(event, 'slug')

  if (!rawSlug) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Book slug is required',
    })
  }

  // Decode URL-encoded slug
  const slug = decodeURIComponent(rawSlug)

  try {
    // Try to find the book in processed content
    const bookPath = path.join(
      process.cwd(),
      'content/processed/reading',
      `${slug}.json`
    )
    const bookData = withKindleSync(
      JSON.parse(await readFile(bookPath, 'utf-8')),
      slug
    )

    // Reads processed JSON by slug, bypassing the manifest — hold the embargo
    // here too, or a scheduled reading note serves in full by direct URL.
    if (!import.meta.dev && isScheduled(bookData)) {
      throw createError({
        statusCode: 404,
        statusMessage: `Book "${slug}" not found`,
      })
    }

    return bookData
  } catch {
    // If not found in processed, return 404
    throw createError({
      statusCode: 404,
      statusMessage: `Book "${slug}" not found`,
    })
  }
})
