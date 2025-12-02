import type { StatsResponse } from '~/composables/useStats'
import githubHandler from './github.get'
import monkeyTypeHandler from './monkeytype.get'
// import photosHandler from './photos.get' // DISABLED: SSL certificate issues
// import healthHandler from './health.get' // DISABLED: Network fetch failures
import leetcodeHandler from './leetcode.get'
import chessHandler from './chess.get'
import rescuetimeHandler from './rescuetime.get'
import lastfmHandler from './lastfm.get'
import gearStatsHandler from './gear-stats.get'
import gistStatsHandler from './gist-stats.get'
import websiteStatsHandler from './website-stats.get'
import letterboxdStatsHandler from './letterboxd.get'
import blogStatsHandler from './blog-stats.get'

// Adapter function to convert chess stats to the expected format
function adaptChessStats(chessStats: any) {
  return {
    currentRating: {
      bullet: chessStats.currentRating.bullet || 0,
      blitz: chessStats.currentRating.blitz || 0,
      rapid: chessStats.currentRating.rapid || 0,
    },
    bestRating: {
      bullet: chessStats.bestRating.bullet || 0,
      blitz: chessStats.bestRating.blitz || 0,
      rapid: chessStats.bestRating.rapid || 0,
    },
    gamesPlayed: {
      bullet: chessStats.gamesPlayed.bullet || 0,
      blitz: chessStats.gamesPlayed.blitz || 0,
      rapid: chessStats.gamesPlayed.rapid || 0,
      total: chessStats.gamesPlayed.total || 0,
    },
    winRate: {
      bullet: chessStats.winRate.bullet || 0,
      blitz: chessStats.winRate.blitz || 0,
      rapid: chessStats.winRate.rapid || 0,
      overall: chessStats.winRate.overall || 0,
    },
    puzzleStats: {
      rating: chessStats.puzzleStats.rating || 0,
      totalSolved: chessStats.puzzleStats.totalSolved || 0,
      bestRating: chessStats.puzzleStats.bestRating || 0,
    },
    recentGames: (chessStats.recentGames || []).map((game: any) => ({
      id: game.id,
      opponent: game.opponent,
      timeControl: game.timeControl,
      result: game.result,
      timestamp: game.timestamp,
      rating: game.rating,
      ratingDiff: game.ratingDiff,
    })),
    lastUpdated: chessStats.lastUpdated,
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

function _processCommits(commits: any[]): {
  commits: GitHubCommit[]
  commitTypes: CommitType[]
} {
  // Process commits to extract types and other metadata
  const processedCommits = commits.map((commit: any) => {
    // Extract commit type from message (e.g., "feat: add new feature")
    const typeMatch = commit.message.match(/^(\w+)(\([\w-]+\))?:/)
    const type = typeMatch ? typeMatch[1].toLowerCase() : 'other'

    return {
      ...commit,
      type,
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
      percentage: (count / total) * 100,
    }))
    .sort((a, b) => b.count - a.count)

  return { commits: processedCommits, commitTypes }
}

// Helper function to adapt GitHub stats for compatibility
function adaptGitHubStats(githubData: any) {
  // If there's no data, return undefined to show data unavailable
  if (!githubData || !githubData.stats) {
    return undefined
  }

  // Map the data to expected format
  return {
    stats: {
      totalCommits: githubData.stats.totalContributions || 0,
      totalContributions: githubData.stats.totalContributions || 0,
      totalRepos: githubData.stats.totalRepos || 0,
      followers: githubData.stats.followers || 0,
      following: githubData.stats.following || 0,
    },
    // Include these required properties
    contributions: githubData.contributions || [],
    dates: githubData.dates || [],
    detail: {
      commits: githubData.detail?.commits || [],
      commitTypes: githubData.detail?.commitTypes || [],
    },
  }
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
      // photosResult, // DISABLED: SSL certificate issues
      // healthResult, // DISABLED: Network fetch failures
      leetcodeResult,
      chessResult,
      rescueTimeResult,
      lastfmResult,
      gearStatsResult,
      gistStatsResult,
      websiteStatsResult,
      letterboxdStatsResult,
      blogStatsResult,
    ] = await Promise.allSettled([
      githubHandler(event).catch((err) => {
        console.error('❌ GitHub API error:', err)
        return null
      }),
      monkeyTypeHandler(event).catch((err) => {
        console.error('❌ MonkeyType API error:', err)
        return null
      }),
      // photosHandler(event).catch((err) => {
      //   console.error('❌ Photos API error:', err)
      //   return null
      // }),
      // healthHandler(event).catch((err) => {
      //   console.error('❌ Health API error:', err)
      //   return null
      // }),
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
      }),
      lastfmHandler(event).catch((err) => {
        console.error('❌ Last.fm API error:', err)
        return null
      }),
      gearStatsHandler(event).catch((err) => {
        console.error('❌ Gear stats error:', err)
        return null
      }),
      gistStatsHandler(event).catch((err) => {
        console.error('❌ Gist stats error:', err)
        return null
      }),
      websiteStatsHandler(event).catch((err) => {
        console.error('❌ Website stats error:', err)
        return null
      }),
      letterboxdStatsHandler(event).catch((err) => {
        console.error('❌ Letterboxd stats error:', err)
        return null
      }),
      blogStatsHandler(event).catch((err) => {
        console.error('❌ Blog stats error:', err)
        return null
      }),
    ])

    const response: StatsResponse = {
      github: getValue(githubResult)
        ? adaptGitHubStats(getValue(githubResult))
        : undefined,
      monkeyType: getValue(monkeyTypeResult),
      // photos: getValue(photosResult), // DISABLED: SSL certificate issues
      // health: getValue(healthResult), // DISABLED: Network fetch failures
      leetcode: getValue(leetcodeResult),
      chess: getValue(chessResult)
        ? adaptChessStats(getValue(chessResult))
        : undefined,
      rescueTime: getValue(rescueTimeResult),
      lastfm: getValue(lastfmResult),
      gear: getValue(gearStatsResult),
      gists: getValue(gistStatsResult),
      website: getValue(websiteStatsResult),
      letterboxd: getValue(letterboxdStatsResult),
      blog: getValue(blogStatsResult),
    }

    return response
  } catch (error) {
    console.error('💥 Error in stats handler:', error)
    throw error
  }
})
