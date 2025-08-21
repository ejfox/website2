import { defineEventHandler, getRouterParam, createError } from 'h3'
import { readFile } from 'fs/promises'
import path from 'path'

export default defineEventHandler(async (event) => {
  const rawSlug = getRouterParam(event, 'slug')
  
  if (!rawSlug) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Book slug is required'
    })
  }

  // Decode URL-encoded slug
  const slug = decodeURIComponent(rawSlug)

  try {
    // Try to find the book in processed content
    const bookPath = path.join(process.cwd(), 'content/processed/reading', `${slug}.json`)
    const bookData = JSON.parse(await readFile(bookPath, 'utf-8'))
    
    return bookData
  } catch (error) {
    // If not found in processed, return 404
    throw createError({
      statusCode: 404,
      statusMessage: `Book "${slug}" not found`
    })
  }
})