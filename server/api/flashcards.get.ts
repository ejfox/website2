/**
 * @file flashcards.get.ts
 * @description Serves all flashcard decks with metadata
 * @endpoint GET /api/flashcards
 * @returns Array of deck objects with name, course, cards
 */
import { loadAllDecks } from '~/server/utils/flashcards'

export default defineEventHandler(async () => {
  try {
    return await loadAllDecks()
  } catch (error) {
    console.error('Error reading flashcard decks:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to load flashcard decks',
    })
  }
})
