/**
 * @file stats.get.ts
 * @description Aggregates statistics from multiple third-party APIs (GitHub, Chess.com, Last.fm, MonkeyType, LeetCode, RescueTime, Letterboxd, Discogs, etc.) into a single unified response
 * @endpoint GET /api/stats
 * @returns Comprehensive StatsResponse object containing data from all integrated services with graceful error handling for individual service failures
 */
import type { StatsResponse } from '~/composables/useStats'
import githubHandler from './github.get'
import monkeyTypeHandler from './monkeytype.get'
// import photosHandler from './photos.get' // DISABLED: SSL certificate issues
import healthHandler from './apple-health.get' // Re-enabled: using health-webhook.tools.ejfox.com
import leetcodeHandler from './leetcode.get'
import chessHandler from './chess.get'
import rescuetimeHandler from './rescuetime.get'
import lastfmHandler from './lastfm.get'
import gearStatsHandler from './gear-stats.get'
import gistStatsHandler from './gist-stats.get'
import websiteStatsHandler from './website-stats.get'
import letterboxdStatsHandler from './letterboxd.get'
import blogStatsHandler from './blog-stats.get'
import discogsHandler from './discogs.get'
import duolingoHandler from './duolingo.get'
import goodreadsHandler from './goodreads.get'

// Chess types (matching chess.get.ts)
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
  currentRating: { bullet: number; blitz: number; rapid: number }
  bestRating: { bullet: number; blitz: number; rapid: number }
  gamesPlayed: { bullet: number; blitz: number; rapid: number; total: number }
  winRate: { bullet: number; blitz: number; rapid: number; overall: number }
  puzzleStats: {
    rating: number
    totalSolved: number
    bestRating: number
    lowestRating?: number
  }
  recentGames: ChessGameResult[]
  lastUpdated: string
}

// GitHub types
interface GitHubData {
  stats?: {
    totalContributions?: number
    totalRepos?: number
    followers?: number
    following?: number
  }
  contributions?: number[]
  dates?: string[]
  detail?: {
    commits?: GitHubCommit[]
    commitTypes?: CommitType[]
  }
}

// Adapter function to convert chess stats to the expected format
function adaptChessStats(chessStats: ChessStats) {
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
    recentGames: (chessStats.recentGames || []).map(
      (game: ChessGameResult) => ({
        id: game.id,
        opponent: game.opponent,
        timeControl: game.timeControl,
        result: game.result,
        timestamp: game.timestamp,
        rating: game.rating,
        ratingDiff: game.ratingDiff,
      })
    ),
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

function _processCommits(commits: GitHubCommit[]): {
  commits: GitHubCommit[]
  commitTypes: CommitType[]
} {
  // Process commits to extract types and other metadata
  const processedCommits = commits.map((commit: GitHubCommit) => {
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
    (acc: Record<string, number>, commit: GitHubCommit & { type: string }) => {
      const type = commit.type
      acc[type] = (acc[type] || 0) + 1
      return acc
    },
    {}
  )

  // Calculate total commits
  const total: number = (Object.values(typeCounts) as number[]).reduce(
    (sum, count) => sum + count,
    0
  )

  // Convert to array with percentages
  const commitTypes = Object.entries(typeCounts)
    .map(([type, count]) => ({
      type,
      count: count as number,
      percentage: ((count as number) / total) * 100,
    }))
    .sort((a, b) => b.count - a.count)

  return { commits: processedCommits, commitTypes }
}

// Helper function to adapt GitHub stats for compatibility
function adaptGitHubStats(githubData: GitHubData | null) {
  // If there's no data, return undefined to show data unavailable
  if (!githubData || !githubData.stats) {
    return undefined
  }

  // PERF: Only include last 30 days of commits in stats API
  // Full commit history is available via /api/github-commits for CommitMatrix
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  const allRecentCommits = (githubData.detail?.commits || []).filter((commit) => {
    const commitDate = new Date(commit.occurredAt)
    return commitDate >= thirtyDaysAgo
  })

  // PERF: Limit to 50 most recent commits and trim message length
  const trimmedCommits = allRecentCommits
    .sort((a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime())
    .slice(0, 50)
    .map((commit) => ({
      repository: { name: commit.repository.name }, // Drop URL to save space
      message: commit.message.split('\n')[0].slice(0, 80), // First line, max 80 chars
      occurredAt: commit.occurredAt,
      type: commit.type,
    }))

  // Map the data to expected format
  return {
    stats: {
      totalCommits: githubData.stats.totalContributions || 0,
      totalContributions: githubData.stats.totalContributions || 0,
      totalRepos: githubData.stats.totalRepos || 0,
      followers: githubData.stats.followers || 0,
      following: githubData.stats.following || 0,
      // Add commit count for the period
      commitsThisPeriod: allRecentCommits.length,
    },
    // Remove empty arrays that aren't used
    detail: {
      commits: trimmedCommits,
      commitTypes: githubData.detail?.commitTypes || [],
    },
  }
}

// Helper function to safely get value from Promise result
function getValue<T>(result: PromiseSettledResult<T>): T | null {
  return result.status === 'fulfilled' ? result.value : null
}

export default defineEventHandler(async (event): Promise<StatsResponse> => {
  try {
    // console.log('🎯 Stats handler called')

    const [
      githubResult,
      monkeyTypeResult,
      // photosResult, // DISABLED: SSL certificate issues
      healthResult,
      leetcodeResult,
      chessResult,
      rescueTimeResult,
      lastfmResult,
      gearStatsResult,
      gistStatsResult,
      websiteStatsResult,
      letterboxdStatsResult,
      blogStatsResult,
      discogsResult,
      duolingoResult,
      goodreadsResult,
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
      discogsHandler(event).catch((err) => {
        console.error('❌ Discogs API error:', err)
        return null
      }),
      duolingoHandler(event).catch((err) => {
        console.error('❌ Duolingo API error:', err)
        return null
      }),
      goodreadsHandler(event).catch((err) => {
        console.error('❌ Goodreads API error:', err)
        return null
      }),
    ])

    // Build adapted data
    const githubData = getValue(githubResult)
      ? adaptGitHubStats(getValue(githubResult))
      : undefined
    const chessData = getValue(chessResult)
      ? adaptChessStats(getValue(chessResult))
      : undefined
    const rescueTimeData = getValue(rescueTimeResult)
    const healthData = getValue(healthResult)
    const lastfmData = getValue(lastfmResult)
    const letterboxdData = getValue(letterboxdStatsResult)
    const blogData = getValue(blogStatsResult)
    const duolingoData = getValue(duolingoResult)
    const goodreadsData = getValue(goodreadsResult)

    // Build weekly summary - the key metrics for "what did I do this week"
    const weeklySummary = {
      // Time tracking
      productiveHours: rescueTimeData?.week?.summary?.productive?.time?.hoursDecimal || 0,
      totalTrackedHours: rescueTimeData?.week?.summary?.total?.hoursDecimal || 0,
      productivityPercent: rescueTimeData?.week?.summary?.productive?.percentage || 0,
      topActivity: rescueTimeData?.week?.activities?.[0]?.name || null,

      // Coding
      commits: githubData?.detail?.commits?.length || 0,
      topRepos: [...new Set(githubData?.detail?.commits?.map(c => c.repository.name) || [])].slice(0, 5),
      commitTypes: githubData?.detail?.commitTypes?.slice(0, 3) || [],

      // Health
      stepsThisWeek: healthData?.thisWeek?.steps || 0,
      exerciseMinutesThisWeek: healthData?.thisWeek?.exerciseMinutes || 0,
      avgDailySteps: healthData?.averages?.dailySteps || 0,

      // Media consumed
      moviesWatched: letterboxdData?.stats?.thisMonth || 0,
      recentMovies: letterboxdData?.films?.slice(0, 3)?.map((f: { title: string; rating: number | null }) => ({ title: f.title, rating: f.rating })) || [],
      topArtists: lastfmData?.topArtists?.artists?.slice(0, 3)?.map((a: { name: string; playcount: string }) => ({ name: a.name, plays: parseInt(a.playcount) })) || [],
      scrobblesThisWeek: lastfmData?.stats?.averagePerDay ? Math.round(lastfmData.stats.averagePerDay * 7) : 0,

      // Learning
      duolingoStreak: duolingoData?.streak || 0,
      chessGamesThisWeek: chessData?.recentGames?.length || 0,
      chessRating: chessData?.currentRating?.blitz || chessData?.currentRating?.rapid || 0,

      // Writing
      wordsWritten: blogData?.words?.thisMonth || 0,
      postsPublished: blogData?.posts?.thisMonth || 0,

      // Books
      currentlyReading: goodreadsData?.currentlyReading?.map((b: { title: string; author: string }) => ({ title: b.title, author: b.author })) || [],
      booksThisMonth: goodreadsData?.stats?.booksThisMonth || 0,
    }

    const response: StatsResponse = {
      weeklySummary,
      github: githubData,
      monkeyType: getValue(monkeyTypeResult),
      // photos: getValue(photosResult), // DISABLED: SSL certificate issues
      health: healthData,
      leetcode: getValue(leetcodeResult),
      chess: chessData,
      rescueTime: rescueTimeData,
      lastfm: lastfmData,
      gear: getValue(gearStatsResult),
      gists: getValue(gistStatsResult),
      website: getValue(websiteStatsResult),
      letterboxd: letterboxdData,
      blog: blogData,
      discogs: getValue(discogsResult),
      duolingo: duolingoData,
      goodreads: goodreadsData,
    }

    return response
  } catch (error) {
    console.error('💥 Error in stats handler:', error)
    throw error
  }
})
