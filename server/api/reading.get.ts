import { defineEventHandler } from 'h3'
import { readdir, readFile } from 'node:fs/promises'
import path from 'node:path'

// Helper function to extract random highlight from book content
function extractRandomHighlight(htmlContent) {
  if (!htmlContent) return null

  // Find all paragraphs that contain highlights (have location links)
  // eslint-disable-next-line regexp/no-super-linear-backtracking
  const highlightRegex = /<p class="mb-4">([^<]+).*?— location:/g
  const highlights = []
  let match

  while ((match = highlightRegex.exec(htmlContent)) !== null) {
    const highlight = match[1].trim()
    // Skip very short highlights or metadata
    if (
      highlight.length > 20 &&
      !highlight.includes('Author:') &&
      !highlight.includes('ASIN:')
    ) {
      highlights.push(highlight)
    }
  }

  if (highlights.length === 0) return null

  // Return random highlight, truncated to ~3 lines (roughly 200 chars)
  const randomHighlight =
    highlights[Math.floor(Math.random() * highlights.length)]
  return randomHighlight.length > 200
    ? randomHighlight.substring(0, 200) + '...'
    : randomHighlight
}

export default defineEventHandler(async (_event) => {
  try {
    const readingDir = path.join(process.cwd(), 'content/processed/reading')

    // Get all JSON files in the reading directory
    const files = await readdir(readingDir)
    const jsonFiles = files.filter((file) => file.endsWith('.json'))

    // Load all books with error handling
    const results = await Promise.allSettled(
      jsonFiles.map(async (file) => {
        const filePath = path.join(readingDir, file)
        const content = await readFile(filePath, 'utf-8')
        const book = JSON.parse(content)

        // Add slug for routing
        book.slug = path.basename(file, '.json')

        // Extract random highlight for preview
        book.randomHighlight = extractRandomHighlight(book.content || book.html)

        return book
      })
    )

    // Filter to fulfilled results only
    const books = results
      .filter((r) => r.status === 'fulfilled')
      .map((r) => r.value)

    // Sort by last annotated date (most recent first), then by date added
    books.sort((a, b) => {
      const dateA =
        a.metadata?.['kindle-sync']?.lastAnnotatedDate ||
        a.metadata?.date ||
        '1970-01-01'
      const dateB =
        b.metadata?.['kindle-sync']?.lastAnnotatedDate ||
        b.metadata?.date ||
        '1970-01-01'
      return new Date(dateB).getTime() - new Date(dateA).getTime()
    })

    return books
  } catch (error) {
    console.error('Error loading reading collection:', error)

    // Return empty array if directory doesn't exist or other errors
    return []
  }
})
