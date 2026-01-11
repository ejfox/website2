/**
 * @file stats-lite.get.ts
 * @description Lightweight stats API optimized for iOS Shortcuts and slow cellular connections
 * @endpoint GET /api/stats-lite
 * @returns Minimal, top-level summary stats from all services - no arrays, no verbose nested objects
 *
 * Design Philosophy:
 * - Single numbers only, no arrays or complex nested objects
 * - Most recent/current values only, no historical data
 * - Optimized for minimal JSON size on cellular connections
 * - All metrics at top level for easy iOS Shortcuts parsing
 */

import NodeCache from 'node-cache'
import githubHandler from './github.get'
import chessHandler from './chess.get'
import blogStatsHandler from './blog-stats.get'
import lastfmHandler from './lastfm.get'
import rescuetimeHandler from './rescuetime.get'
import gearStatsHandler from './gear-stats.get'
import websiteStatsHandler from './website-stats.get'
import letterboxdStatsHandler from './letterboxd.get'
import discogsHandler from './discogs.get'

// Cache for 5 minutes - good balance for cellular use
const cache = new NodeCache({
  stdTTL: 300,
  checkperiod: 60,
})

interface StatsLiteResponse {
  // Meta
  lastUpdated: string
  cached: boolean

  // GitHub - all time totals
  githubContributionsAllTime?: number
  githubReposTotal?: number
  githubFollowersCurrent?: number

  // Chess - current ELO ratings and all-time games
  chessRatingRapid?: number
  chessRatingBlitz?: number
  chessRatingBullet?: number
  chessRatingPuzzles?: number
  chessGamesAllTime?: number

  // Blog writing - calendar month and all time
  blogPostsCalMonth?: number
  blogPostsAllTime?: number
  blogWordsCalMonth?: number

  // Music listening - all time totals
  musicScrobblesAllTime?: number
  musicTopArtistAllTime?: string

  // Time tracking - last 7 days
  rescueTimeLast7dHours?: number
  rescueTimeLast7dProductivePct?: number

  // Gear inventory - current totals
  gearItemsTotal?: number
  gearWeightTotalOz?: number

  // Website analytics - calendar month
  websitePageviewsCalMonth?: number
  websiteVisitorsCalMonth?: number

  // Movies - calendar year and all time
  letterboxdFilmsCalYear?: number
  letterboxdFilmsAllTime?: number
  letterboxdRatingAvg?: number

  // Vinyl collection - current totals
  discogsRecordsTotal?: number
  discogsValueTotalUsd?: number
}

// Helper to safely extract a value with type checking
function safeNumber(value: unknown): number | undefined {
  if (typeof value === 'number' && !Number.isNaN(value)) return value
  if (typeof value === 'string') {
    const num = Number.parseFloat(value)
    return Number.isNaN(num) ? undefined : num
  }
  return undefined
}

function safeString(value: unknown): string | undefined {
  if (typeof value === 'string' && value.length > 0) return value
  return undefined
}

export default defineEventHandler(async (event): Promise<StatsLiteResponse> => {
  // Check cache first
  const cacheKey = 'stats-lite'
  const cached = cache.get<StatsLiteResponse>(cacheKey)
  if (cached) {
    return { ...cached, cached: true }
  }

  // Fetch all data in parallel with error handling
  const [
    githubResult,
    chessResult,
    blogStatsResult,
    lastfmResult,
    rescueTimeResult,
    gearStatsResult,
    websiteStatsResult,
    letterboxdStatsResult,
    discogsResult,
  ] = await Promise.allSettled([
    githubHandler(event).catch(() => null),
    chessHandler(event).catch(() => null),
    blogStatsHandler(event).catch(() => null),
    lastfmHandler(event).catch(() => null),
    rescuetimeHandler(event).catch(() => null),
    gearStatsHandler(event).catch(() => null),
    websiteStatsHandler(event).catch(() => null),
    letterboxdStatsHandler(event).catch(() => null),
    discogsHandler(event).catch(() => null),
  ])

  // Extract values safely
  const github = githubResult.status === 'fulfilled' ? githubResult.value : null
  const chess = chessResult.status === 'fulfilled' ? chessResult.value : null
  const blogStats =
    blogStatsResult.status === 'fulfilled' ? blogStatsResult.value : null
  const lastfm = lastfmResult.status === 'fulfilled' ? lastfmResult.value : null
  const rescueTime =
    rescueTimeResult.status === 'fulfilled' ? rescueTimeResult.value : null
  const gearStats =
    gearStatsResult.status === 'fulfilled' ? gearStatsResult.value : null
  const websiteStats =
    websiteStatsResult.status === 'fulfilled' ? websiteStatsResult.value : null
  const letterboxd =
    letterboxdStatsResult.status === 'fulfilled'
      ? letterboxdStatsResult.value
      : null
  const discogs =
    discogsResult.status === 'fulfilled' ? discogsResult.value : null

  // Build minimal response
  const response: StatsLiteResponse = {
    lastUpdated: new Date().toISOString(),
    cached: false,
  }

  // GitHub - all time totals
  if (github?.stats) {
    response.githubContributionsAllTime = safeNumber(
      github.stats.totalContributions
    )
    response.githubReposTotal = safeNumber(github.stats.totalRepos)
    response.githubFollowersCurrent = safeNumber(github.stats.followers)
  }

  // Chess - current ELO ratings and all-time games
  if (chess) {
    response.chessRatingRapid = safeNumber(chess.currentRating?.rapid)
    response.chessRatingBlitz = safeNumber(chess.currentRating?.blitz)
    response.chessRatingBullet = safeNumber(chess.currentRating?.bullet)
    response.chessRatingPuzzles = safeNumber(chess.puzzleStats?.rating)
    response.chessGamesAllTime = safeNumber(chess.gamesPlayed?.total)
  }

  // Blog stats - calendar month and all time
  if (blogStats) {
    response.blogPostsCalMonth = safeNumber(blogStats.posts?.thisMonth)
    response.blogPostsAllTime = safeNumber(blogStats.posts?.total)
    response.blogWordsCalMonth = safeNumber(blogStats.words?.thisMonth)
  }

  // Last.fm - all time totals and top artist
  if (lastfm) {
    response.musicScrobblesAllTime = safeNumber(lastfm.userInfo?.playcount)
    // Get top artist name from topArtists array
    if (lastfm.topArtists?.artists?.[0]?.name) {
      response.musicTopArtistAllTime = safeString(
        lastfm.topArtists.artists[0].name
      )
    }
  }

  // RescueTime - last 7 days summary
  if (rescueTime?.week?.summary) {
    const weekHours = rescueTime.week.summary.total?.hoursDecimal
    const productivePercent = rescueTime.week.summary.productive?.percentage
    response.rescueTimeLast7dHours = safeNumber(weekHours)
    response.rescueTimeLast7dProductivePct = safeNumber(productivePercent)
  }

  // Gear stats - current totals
  if (gearStats?.stats) {
    response.gearItemsTotal = safeNumber(gearStats.stats.totalItems)
    response.gearWeightTotalOz = safeNumber(gearStats.stats.totalWeight)
  }

  // Website stats - calendar month only
  if (websiteStats?.stats) {
    response.websitePageviewsCalMonth = safeNumber(
      websiteStats.stats.pageviews?.value
    )
    response.websiteVisitorsCalMonth = safeNumber(
      websiteStats.stats.visitors?.value
    )
  }

  // Letterboxd - calendar year and all time
  if (letterboxd?.stats) {
    response.letterboxdFilmsCalYear = safeNumber(letterboxd.stats.thisYear)
    response.letterboxdFilmsAllTime = safeNumber(letterboxd.stats.totalFilms)
    response.letterboxdRatingAvg = safeNumber(letterboxd.stats.averageRating)
  }

  // Discogs - current totals with USD
  if (discogs?.stats) {
    response.discogsRecordsTotal = safeNumber(discogs.stats.totalItems)
    response.discogsValueTotalUsd = safeNumber(discogs.stats.totalValue)
  }

  // Cache the response
  cache.set(cacheKey, response)

  return response
})
