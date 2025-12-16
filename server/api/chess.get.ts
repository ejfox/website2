/**
 * @file chess.get.ts
 * @description Fetches Chess.com player statistics including ratings, games played, win rates, and puzzle stats across all time controls
 * @endpoint GET /api/chess
 * @returns ChessStats with current/best ratings, games played, win rates, puzzle stats, and recent game results
 */
import { defineEventHandler, createError } from 'h3'

interface ChessGameResult {
  id: string
  opponent: string
  timeControl: string
  result: 'win' | 'loss' | 'draw'
  timestamp: number
  rating: number
  ratingDiff: number
}

interface ChessStats {
  currentRating: {
    bullet: number
    blitz: number
    rapid: number
  }
  bestRating: {
    bullet: number
    blitz: number
    rapid: number
  }
  gamesPlayed: {
    bullet: number
    blitz: number
    rapid: number
    total: number
  }
  winRate: {
    bullet: number
    blitz: number
    rapid: number
    overall: number
  }
  puzzleStats: {
    rating: number
    totalSolved: number
    bestRating: number
    lowestRating: number
    lastUpdated?: number
  }
  recentPuzzles?: Array<{
    // Future enhancement - Chess.com API doesn't provide individual attempts
    date: string
    rating: number
    solved: boolean
  }>
  recentGames: ChessGameResult[]
  lastUpdated: string
}

export default defineEventHandler(async () => {
  const config = useRuntimeConfig()
  const username = config.CHESS_USERNAME

  if (!username) {
    throw createError({
      statusCode: 401,
      message: 'Chess.com username not configured',
    })
  }

  const makeRequest = async <T>(url: string): Promise<T> => {
    const response = await fetch(`https://api.chess.com/pub/${url}`)

    if (!response.ok) {
      throw createError({
        statusCode: response.status,
        message: `Chess.com API error: ${response.statusText}`,
      })
    }

    const data = await response.json()
    return data as T
  }

  try {
    // Fetch all data in parallel with error recovery
    const results = await Promise.allSettled([
      makeRequest<any>(`player/${username}/stats`),
      makeRequest<any>(`player/${username}/games/archives`).then(
        async (archives) => {
          // Get most recent month's games
          const latestArchive = archives.archives[archives.archives.length - 1]
          return makeRequest<any>(
            latestArchive.replace('https://api.chess.com/pub/', '')
          )
        }
      ),
    ])

    const stats = results[0].status === 'fulfilled' ? results[0].value : {}
    const games =
      results[1].status === 'fulfilled' ? results[1].value : { games: [] }

    // Process the stats
    const response: ChessStats = {
      currentRating: {
        bullet: stats.chess_bullet?.last?.rating || 0,
        blitz: stats.chess_blitz?.last?.rating || 0,
        rapid: stats.chess_rapid?.last?.rating || 0,
      },
      bestRating: {
        bullet: stats.chess_bullet?.best?.rating || 0,
        blitz: stats.chess_blitz?.best?.rating || 0,
        rapid: stats.chess_rapid?.best?.rating || 0,
      },
      gamesPlayed: {
        bullet:
          (stats.chess_bullet?.record?.win || 0) +
          (stats.chess_bullet?.record?.loss || 0) +
          (stats.chess_bullet?.record?.draw || 0),
        blitz:
          (stats.chess_blitz?.record?.win || 0) +
          (stats.chess_blitz?.record?.loss || 0) +
          (stats.chess_blitz?.record?.draw || 0),
        rapid:
          (stats.chess_rapid?.record?.win || 0) +
          (stats.chess_rapid?.record?.loss || 0) +
          (stats.chess_rapid?.record?.draw || 0),
        total: 0, // Will calculate below
      },
      winRate: {
        bullet: calculateWinRate(stats.chess_bullet?.record),
        blitz: calculateWinRate(stats.chess_blitz?.record),
        rapid: calculateWinRate(stats.chess_rapid?.record),
        overall: 0, // Will calculate below
      },
      puzzleStats: {
        rating: stats.tactics?.highest?.rating || 0,
        // Chess.com API doesn't provide total solved count
        totalSolved: 0,
        bestRating: stats.tactics?.highest?.rating || 0,
        lowestRating: stats.tactics?.lowest?.rating || 0,
        lastUpdated: stats.tactics?.highest?.date,
      },
      recentGames: games.games.slice(0, 10).map((game: any) => ({
        id: game.uuid,
        opponent:
          game[username === game.white.username ? 'black' : 'white'].username,
        timeControl: game.time_class,
        result: determineResult(game, username),
        timestamp: game.end_time,
        rating:
          game[username === game.white.username ? 'white' : 'black'].rating,
        ratingDiff: calculateRatingDiff(game, username),
      })),
      lastUpdated: new Date().toISOString(),
    }

    // Calculate totals
    response.gamesPlayed.total =
      response.gamesPlayed.bullet +
      response.gamesPlayed.blitz +
      response.gamesPlayed.rapid

    // Calculate overall win rate as average of non-zero rates
    const nonZeroRates = [
      response.winRate.bullet,
      response.winRate.blitz,
      response.winRate.rapid,
    ].filter((rate) => rate > 0)

    response.winRate.overall =
      nonZeroRates.length > 0
        ? nonZeroRates.reduce((sum, rate) => sum + rate, 0) /
          nonZeroRates.length
        : 0

    return response
  } catch (error: any) {
    console.error('Chess.com API error details:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || 'Failed to fetch Chess.com data',
    })
  }
})

function calculateWinRate(
  record: { win: number; loss: number; draw: number } | undefined
): number {
  if (!record) return 0
  const total = record.win + record.loss + record.draw
  return total > 0 ? Math.round((record.win / total) * 100) : 0
}

function determineResult(game: any, username: string): 'win' | 'loss' | 'draw' {
  if (game.white.username === username) {
    return game.white.result === 'win'
      ? 'win'
      : game.white.result === 'resigned'
        ? 'loss'
        : 'draw'
  } else {
    return game.black.result === 'win'
      ? 'win'
      : game.black.result === 'resigned'
        ? 'loss'
        : 'draw'
  }
}

function calculateRatingDiff(game: any, username: string): number {
  const playerData = game.white.username === username ? game.white : game.black
  return playerData.rating_diff || 0
}
