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

interface GitHubCommit {
  repository: {
    name: string
    url: string
  }
  message: string
  occurredAt: string
  url: string
  type: string
}

interface CommitType {
  type: string
  count: number
  percentage: number
}

function processCommits(commits: any[]): {
  commits: GitHubCommit[]
  commitTypes: CommitType[]
} {
  // Process commits to extract types and other metadata
  const processedCommits = commits.map((commit: any) => {
    // Extract commit type from message (e.g., "feat: add new feature")
    const typeMatch = commit.message.match(/^(\w+)(\([\w-]+\))?:/i)
    const type = typeMatch ? typeMatch[1].toLowerCase() : 'other'

    return {
      ...commit,
      type
    }
  })

  // Count commit types
  const typeCounts = processedCommits.reduce(
    (acc: Record<string, number>, commit: any) => {
      const type = commit.type
      acc[type] = (acc[type] || 0) + 1
      return acc
    },
    {}
  )

  // Calculate total commits
  const total = Object.values(typeCounts).reduce(
    (sum: number, count: number) => sum + count,
    0
  )

  // Convert to array with percentages
  const commitTypes = Object.entries(typeCounts)
    .map(([type, count]: [string, number]) => ({
      type,
      count,
      percentage: (count / total) * 100
    }))
    .sort((a, b) => b.count - a.count)

  return { commits: processedCommits, commitTypes }
}

function adaptGitHubStats(githubStats: any) {
  // console.log('Adapting GitHub stats:', githubStats)

  if (!githubStats) {
    console.error('No GitHub stats to adapt!')
    return undefined
  }

  // Handle both old and new data structures
  const isOldFormat =
    'repositories' in githubStats && !('detail' in githubStats)

  if (isOldFormat) {
    // console.log('Converting from old GitHub format')
    // Convert old format to new format
    return {
      stats: {
        totalRepos: githubStats.stats.totalRepos,
        totalContributions: githubStats.stats.totalContributions || 0,
        followers: githubStats.stats.followers,
        following: githubStats.stats.following
      },
      contributions: githubStats.contributions || [],
      dates: githubStats.dates || [],
      detail: {
        commits: [], // We'll need to fetch fresh data
        commitTypes: []
      }
    }
  }

  // Process new format
  const { commits, commitTypes } = processCommits(
    githubStats.detail?.commits || []
  )

  const adapted = {
    stats: {
      totalRepos: githubStats.stats.totalRepos,
      totalContributions: githubStats.stats.totalContributions,
      followers: githubStats.stats.followers,
      following: githubStats.stats.following
    },
    contributions: githubStats.contributions || [],
    dates: githubStats.dates || [],
    detail: { commits, commitTypes }
  }

  // console.log('Adapted GitHub stats:', adapted)
  return adapted
}

// Helper function to safely get value from Promise result
function getValue(result: PromiseSettledResult<any>) {
  return result.status === 'fulfilled' ? result.value : null
}

export default defineEventHandler(async (event): Promise<StatsResponse> => {
  try {
    // console.log('🎯 Stats handler called')

    const [
      githubResult,
      monkeyTypeResult,
      photosResult,
      healthResult,
      leetcodeResult,
      chessResult,
      rescueTimeResult
    ] = await Promise.allSettled([
      githubHandler(event).catch((err) => {
        console.error('❌ GitHub API error:', err)
        return null
      }),
      monkeyTypeHandler(event).catch((err) => {
        console.error('❌ MonkeyType API error:', err)
        return null
      }),
      photosHandler(event).catch((err) => {
        console.error('❌ Photos API error:', err)
        return null
      }),
      healthHandler(event).catch((err) => {
        console.error('❌ Health API error:', err)
        return null
      }),
      leetcodeHandler(event).catch((err) => {
        console.error('❌ LeetCode API error:', err)
        return null
      }),
      chessHandler(event).catch((err) => {
        console.error('❌ Chess API error:', err)
        return null
      }),
      rescuetimeHandler(event).catch((err) => {
        console.error('❌ RescueTime API error:', err)
        return null
      })
    ])

    const response: StatsResponse = {
      github: getValue(githubResult)
        ? adaptGitHubStats(getValue(githubResult))
        : undefined,
      monkeyType: getValue(monkeyTypeResult),
      photos: getValue(photosResult),
      health: getValue(healthResult),
      leetcode: getValue(leetcodeResult),
      chess: getValue(chessResult)
        ? adaptChessStats(getValue(chessResult))
        : undefined,
      rescueTime: getValue(rescueTimeResult)
    }

    return response
  } catch (error) {
    console.error('💥 Error in stats handler:', error)
    throw error
  }
})
