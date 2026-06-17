/**
 * @file random.get.ts
 * @description Returns a random flashcard from all decks
 * @endpoint GET /api/flashcards/random
 */
import { getAllCards, randomItem } from '~/server/utils/flashcards'

export default defineEventHandler(async () => {
  const cards = await getAllCards()
  const card = randomItem(cards)

  if (!card) {
    throw createError({
      statusCode: 404,
      statusMessage: 'No flashcards found',
    })
  }

  return card
})
