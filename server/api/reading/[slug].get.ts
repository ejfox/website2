/**
 * @file reading/[slug].get.ts
 * @description Retrieves individual book data with highlights and metadata from processed reading collection
 * @endpoint GET /api/reading/{slug}
 * @params slug: string - URL-encoded book slug
 * @returns Complete book data including Kindle highlights, metadata, and sync information
 */
import { defineEventHandler, getRouterParam, createError } from 'h3'
import { readFile } from 'node:fs/promises'
import path from 'node:path'

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
    const bookData = JSON.parse(await readFile(bookPath, 'utf-8'))

    return bookData
  } catch {
    // If not found in processed, return 404
    throw createError({
      statusCode: 404,
      statusMessage: `Book "${slug}" not found`,
    })
  }
})
