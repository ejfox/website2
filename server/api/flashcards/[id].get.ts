/**
 * @file flashcards/[id].get.ts
 * @description GET /api/flashcards/:id. One deck: { id, name, course, cardCount,
 *   cards[] }, read from public/data/flashcards/<id>.csv by loadDeck().
 *   Throws 400 without an id, 404 if the CSV doesn't exist.
 */
import { loadDeck, cardToFlashcard } from '~/server/utils/flashcards'
import { getRouterParam } from 'h3'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Deck ID is required',
    })
  }

  // loadDeck() also returns null for an id that isn't a plain deck name.
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
