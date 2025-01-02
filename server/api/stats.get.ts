import type { StatsResponse } from '~/composables/useStats'
import githubHandler from './github.get'
import monkeyTypeHandler from './monkeytype.get'
import photosHandler from './photos.get'
import healthHandler from './health.get'
import leetcodeHandler from './leetcode.get'
import chessHandler from './chess.get'
import rescuetimeHandler from './rescuetime.get'

// Adapter function to convert chess stats to the expected format
function adaptChessStats(chessStats: any) {
  return {
    currentRating: {
      bullet: chessStats.currentRating.bullet || 0,
      blitz: chessStats.currentRating.blitz || 0,
      rapid: chessStats.currentRating.rapid || 0
    },
    bestRating: {
      bullet: chessStats.bestRating.bullet || 0,
      blitz: chessStats.bestRating.blitz || 0,
      rapid: chessStats.bestRating.rapid || 0
    },
    gamesPlayed: {
      bullet: chessStats.gamesPlayed.bullet || 0,
      blitz: chessStats.gamesPlayed.blitz || 0,
      rapid: chessStats.gamesPlayed.rapid || 0,
      total: chessStats.gamesPlayed.total || 0
    },
    winRate: {
      bullet: chessStats.winRate.bullet || 0,
      blitz: chessStats.winRate.blitz || 0,
      rapid: chessStats.winRate.rapid || 0,
      overall: chessStats.winRate.overall || 0
    },
    puzzleStats: {
      rating: chessStats.puzzleStats.rating || 0,
      totalSolved: chessStats.puzzleStats.totalSolved || 0,
      bestRating: chessStats.puzzleStats.bestRating || 0
    },
    recentGames: (chessStats.recentGames || []).map((game: any) => ({
      id: game.id,
      opponent: game.opponent,
      timeControl: game.timeControl,
      result: game.result,
      timestamp: game.timestamp,
      rating: game.rating,
      ratingDiff: game.ratingDiff
    })),
    lastUpdated: chessStats.lastUpdated
  }
}

// Adapter function to convert GitHub stats to the expected format
function adaptGitHubStats(githubStats: any) {
  return {
    stats: {
      totalRepos: githubStats.stats.totalRepos,
      totalPRs: githubStats.stats.totalPRs,
      mergedPRs: githubStats.stats.mergedPRs,
      followers: githubStats.stats.followers,
      following: githubStats.stats.following,
      totalLinesChanged: githubStats.stats.totalLinesChanged,
      totalFilesChanged: githubStats.stats.totalFilesChanged,
      totalContributions: githubStats.stats.totalContributions
    },
    repositories: githubStats.repositories || [],
    dates: githubStats.dates || [],
    contributions: githubStats.contributions || [],
    currentStreak: githubStats.currentStreak || 0,
    longestStreak: githubStats.longestStreak || 0,
    totalContributions: githubStats.totalContributions || 0
  }
}

export default defineEventHandler(async (event): Promise<StatsResponse> => {
  try {
    const [
      githubRaw,
      monkeyType,
      photos,
      health,
      leetcode,
      chessRaw,
      rescueTime
    ] = await Promise.all([
      githubHandler(event),
      monkeyTypeHandler(event),
      photosHandler(event),
      healthHandler(event),
      leetcodeHandler(event),
      chessHandler(event),
      rescuetimeHandler(event)
    ])

    return {
      github: adaptGitHubStats(githubRaw),
      monkeyType,
      photos,
      health,
      leetcode,
      chess: adaptChessStats(chessRaw),
      rescueTime
    }
  } catch (error) {
    console.error('Error fetching stats:', error)
    throw createError({
      statusCode: 500,
      message: 'Failed to fetch stats',
      cause: error
    })
  }
})
