/**
 * @file [id].get.ts
 * @description Returns a single deck by ID
 * @endpoint GET /api/flashcards/:id
 */
import { loadDeck, cardToFlashcard } from '~/server/utils/flashcards'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Deck ID is required',
    })
  }

  const deck = await loadDeck(id)

  if (!deck) {
    throw createError({
      statusCode: 404,
      statusMessage: `Deck "${id}" not found`,
    })
  }

  return {
    id: deck.id,
    name: deck.name,
    course: deck.course,
    cardCount: deck.cardCount,
    cards: deck.cards.map((card, i) => cardToFlashcard(card, i, deck)),
  }
})
