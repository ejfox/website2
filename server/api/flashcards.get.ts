/**
 * @file flashcards.get.ts
 * @description GET /api/flashcards. Every deck with metadata and cards, from
 *   public/data/flashcards/*.csv via server/utils/flashcards.ts. No cache.
 *   Throws 500 if the decks can't be read.
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
