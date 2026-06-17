/**
 * @file stats.get.ts
 * @description Returns flashcard statistics
 * @endpoint GET /api/flashcards/stats
 */
import { loadAllDecks } from '~/server/utils/flashcards'

export default defineEventHandler(async () => {
  const decks = await loadAllDecks()

  const totalCards = decks.reduce((sum, d) => sum + d.cardCount, 0)

  // Group by course
  const byCourse: Record<string, { decks: number; cards: number }> = {}
  for (const deck of decks) {
    if (!byCourse[deck.course]) {
      byCourse[deck.course] = { decks: 0, cards: 0 }
    }
    byCourse[deck.course].decks++
    byCourse[deck.course].cards += deck.cardCount
  }

  // Find largest/smallest decks
  const sortedBySize = [...decks].sort((a, b) => b.cardCount - a.cardCount)

  return {
    totalDecks: decks.length,
    totalCards,
    byCourse,
    largestDeck: sortedBySize[0]
      ? {
          id: sortedBySize[0].id,
          name: sortedBySize[0].name,
          cards: sortedBySize[0].cardCount,
        }
      : null,
    smallestDeck: sortedBySize[sortedBySize.length - 1]
      ? {
          id: sortedBySize[sortedBySize.length - 1].id,
          name: sortedBySize[sortedBySize.length - 1].name,
          cards: sortedBySize[sortedBySize.length - 1].cardCount,
        }
      : null,
    decks: decks.map((d) => ({
      id: d.id,
      name: d.name,
      course: d.course,
      cards: d.cardCount,
    })),
  }
})
