/**
 * @file search.get.ts
 * @description Search flashcards by content
 * @endpoint GET /api/flashcards/search?q=term&limit=20
 */
import { getAllCards, type Flashcard } from '~/server/utils/flashcards'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const q = (query.q as string)?.toLowerCase().trim()
  const limit = Math.min(Number.parseInt(query.limit as string) || 20, 100)

  if (!q || q.length < 2) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Query must be at least 2 characters',
    })
  }

  const cards = await getAllCards()

  // Search in front, back, and hints
  const results: Array<Flashcard & { score: number }> = []

  for (const card of cards) {
    let score = 0
    const frontLower = card.front.toLowerCase()
    const backLower = card.back.toLowerCase()
    const hintsLower = card.hints.join(' ').toLowerCase()

    // Exact match in front = highest score
    if (frontLower.includes(q)) {
      score += frontLower === q ? 100 : 50
    }
    // Match in back
    if (backLower.includes(q)) {
      score += backLower === q ? 80 : 30
    }
    // Match in hints
    if (hintsLower.includes(q)) {
      score += 10
    }

    if (score > 0) {
      results.push({ ...card, score })
    }
  }

  // Sort by score descending
  results.sort((a, b) => b.score - a.score)

  return {
    query: q,
    total: results.length,
    results: results.slice(0, limit).map(({ score: _score, ...card }) => card),
  }
})
