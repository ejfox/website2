/**
 * @file chess.get.ts
 * @description Fetches Chess.com player statistics including ratings, games played, win rates, and puzzle stats across all time controls
 * @endpoint GET /api/chess
 * @returns ChessStats with current/best ratings, games played, win rates, puzzle stats, and recent game results
 */
import { defineEventHandler, createError } from 'h3'
import { serverEnv } from '~/server/utils/serverEnv'
import { notConfigured } from '~/server/utils/notConfigured'

interface ChessGameResult {
  id: string
  opponent: string
  timeControl: string
  result: 'win' | 'loss' | 'draw'
  timestamp: number
  rating: number
  ratingDiff: number
}

// Chess.com API response types
interface ChessStatsResponse {
  chess_bullet?: {
    last?: { rating: number }
    best?: { rating: number }
    record?: { win: number; loss: number; draw: number }
  }
  chess_blitz?: {
    last?: { rating: number }
    best?: { rating: number }
    record?: { win: number; loss: number; draw: number }
  }
  chess_rapid?: {
    last?: { rating: number }
    best?: { rating: number }
    record?: { win: number; loss: number; draw: number }
  }
  tactics?: {
    highest?: { rating: number; date: number }
    lowest?: { rating: number }
  }
}

interface ArchivesResponse {
  archives: string[]
}

interface ChessPlayer {
  username: string
  rating: number
  result: string
  rating_diff?: number
}

interface ChessGame {
  uuid: string
  url: string
  time_class: string
  end_time: number
  white: ChessPlayer
  black: ChessPlayer
}

interface GamesResponse {
  games: ChessGame[]
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
  const username = serverEnv('CHESS_USERNAME')

  if (!username) {
    throw notConfigured('Chess.com', 'CHESS_USERNAME')
  }

  const makeRequest = async <T>(url: string): Promise<T> => {
    // 10s timeout so a slow/hung Chess.com can't stall the /api/stats aggregator.
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000)
    try {
      const response = await fetch(`https://api.chess.com/pub/${url}`, {
        signal: controller.signal,
      })

      if (!response.ok) {
        throw createError({
          statusCode: response.status,
          message: `Chess.com API error: ${response.statusText}`,
        })
      }

      const data = await response.json()
      return data as T
    } finally {
      clearTimeout(timeoutId)
    }
  }

  try {
    // Fetch all data in parallel with error recovery
    const results = await Promise.allSettled([
      makeRequest<ChessStatsResponse>(`player/${username}/stats`),
      makeRequest<ArchivesResponse>(`player/${username}/games/archives`).then(
        async (archives) => {
          // Get most recent month's games
          const latestArchive = archives.archives[archives.archives.length - 1]
          return makeRequest<GamesResponse>(
            latestArchive.replace('https://api.chess.com/pub/', '')
          )
        }
      ),
    ])

    const stats: ChessStatsResponse =
      results[0].status === 'fulfilled' ? results[0].value : {}
    const games: GamesResponse =
      results[1].status === 'fulfilled' ? results[1].value : { games: [] }

    // Process the stats
    const response: ChessStats = {
      currentRating: {
        bullet: stats.chess_bullet?.last?.rating || 0,
        blitz: stats.chess_blitz?.last?.rating || 0,
        rapid: stats.chess_rapid?.last?.rating || 0,
      },
      // Chess.com omits `best` until a rating is established (e.g. one rapid
      // game), and `best` can lag a fresh high. A peak below the current
      // rating is a contradiction, so the peak is never less than `last`.
      bestRating: {
        bullet: peakRating(stats.chess_bullet),
        blitz: peakRating(stats.chess_blitz),
        rapid: peakRating(stats.chess_rapid),
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
      recentGames: games.games.slice(0, 10).map((game: ChessGame) => ({
        id: game.uuid,
        opponent:
          game[playerSide(game, username) === 'white' ? 'black' : 'white']
            .username,
        timeControl: game.time_class,
        result: determineResult(game, username),
        timestamp: game.end_time,
        rating: game[playerSide(game, username)].rating,
        ratingDiff: calculateRatingDiff(game, username),
      })),
      lastUpdated: new Date().toISOString(),
    }

    // Calculate totals
    response.gamesPlayed.total =
      response.gamesPlayed.bullet +
      response.gamesPlayed.blitz +
      response.gamesPlayed.rapid

    // Overall win rate is wins / games across every time control. Averaging
    // the per-control percentages let one rapid win (100%) drag ~40% bullet
    // and blitz records up to "60% WIN".
    const records = [
      stats.chess_bullet?.record,
      stats.chess_blitz?.record,
      stats.chess_rapid?.record,
    ]
    const totalWins = records.reduce((sum, r) => sum + (r?.win || 0), 0)
    response.winRate.overall =
      response.gamesPlayed.total > 0
        ? Math.round((totalWins / response.gamesPlayed.total) * 100)
        : 0

    return response
  } catch (error) {
    console.error('Chess.com API error details:', error)
    const err = error as Error & { statusCode?: number }
    throw createError({
      statusCode: err.statusCode || 500,
      message: err.message || 'Failed to fetch Chess.com data',
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

// Chess.com per-player result codes. Anything that isn't a win or one of
// these draw codes is a loss (checkmated, timeout, resigned, abandoned, ...).
const DRAW_RESULTS = new Set([
  'agreed',
  'repetition',
  'stalemate',
  'insufficient',
  '50move',
  'timevsinsufficient',
])

function playerSide(game: ChessGame, username: string): 'white' | 'black' {
  return game.white.username.toLowerCase() === username.toLowerCase()
    ? 'white'
    : 'black'
}

function determineResult(
  game: ChessGame,
  username: string
): 'win' | 'loss' | 'draw' {
  const result = game[playerSide(game, username)].result
  if (result === 'win') return 'win'
  return DRAW_RESULTS.has(result) ? 'draw' : 'loss'
}

function peakRating(
  control: { last?: { rating: number }; best?: { rating: number } } | undefined
): number {
  return Math.max(control?.best?.rating || 0, control?.last?.rating || 0)
}

function calculateRatingDiff(game: ChessGame, username: string): number {
  return game[playerSide(game, username)].rating_diff || 0
}
