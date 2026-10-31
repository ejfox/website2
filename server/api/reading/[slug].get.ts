/**
 * @file reading/[slug].get.ts
 * @description GET /api/reading/:slug. One book's processed JSON from
 *   content/processed/reading/<slug>.json, merged with Kindle sync data. No cache.
 *   Throws 400 without a slug; 404 if missing, (in production) scheduled, or
 *   not a plain file name. Book slugs carry spaces, commas and unicode, so
 *   this checks for path syntax rather than a charset.
 */
import { defineEventHandler, getRouterParam, createError } from 'h3'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { isServed } from '~/utils/visibility.mjs'
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
  let slug: string
  try {
    slug = decodeURIComponent(rawSlug)
  } catch {
    throw createError({ statusCode: 404, statusMessage: 'Book not found' })
  }

  // A single file name inside content/processed/reading, nothing else.
  if (/[/\\\0]/.test(slug) || slug.includes('..')) {
    throw createError({ statusCode: 404, statusMessage: 'Book not found' })
  }

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

    // Reads processed JSON by slug, bypassing the manifest — hold the gate
    // here too, or a scheduled reading note serves in full by direct URL.
    if (!isServed(bookData, { dev: import.meta.dev })) {
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
