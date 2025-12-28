/**
 * @file flashcards.get.ts
 * @description Serves raw flashcard CSV file content
 * @endpoint GET /api/flashcards
 * @returns Raw CSV file content as plain text
 */
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

export default defineEventHandler(async () => {
  try {
    // Read the CSV file from public/data/flashcards directory
    const csvPath = resolve('public/data/flashcards/all-cards.csv')
    const csvContent = await readFile(csvPath, 'utf-8')

    return csvContent
  } catch (error) {
    console.error('Error reading flashcards CSV:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to load flashcard data',
    })
  }
})
