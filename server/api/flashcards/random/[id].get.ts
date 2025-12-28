/**
 * @file [id].get.ts
 * @description Returns a random flashcard from a specific deck
 * @endpoint GET /api/flashcards/random/:id
 */
import { loadDeck, cardToFlashcard, randomItem } from '~/server/utils/flashcards'

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

  if (deck.cards.length === 0) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Deck has no cards',
    })
  }

  const randomIndex = Math.floor(Math.random() * deck.cards.length)
  const card = deck.cards[randomIndex]

  return cardToFlashcard(card, randomIndex, deck)
})
