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

  // GitHub - just the essentials
  githubContributions?: number
  githubRepos?: number
  githubFollowers?: number

  // Chess - current ratings only
  chessRapid?: number
  chessBlitz?: number
  chessBullet?: number
  chessPuzzles?: number
  chessGamesTotal?: number

  // Blog writing
  blogPostsThisMonth?: number
  blogPostsTotal?: number
  blogWordsThisMonth?: number

  // Music listening
  musicTotalScrobbles?: number
  musicTopArtist?: string

  // Time tracking
  rescueTimeWeekHours?: number
  rescueTimeWeekProductivePercent?: number

  // Gear
  gearTotalItems?: number
  gearTotalWeightOz?: number

  // Website analytics
  websitePageviewsMonth?: number
  websiteVisitorsMonth?: number

  // Movies
  letterboxdThisYear?: number
  letterboxdTotal?: number
  letterboxdAvgRating?: number

  // Vinyl collection
  discogsTotal?: number
  discogsValue?: number
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
  const github =
    githubResult.status === 'fulfilled' ? githubResult.value : null
  const chess = chessResult.status === 'fulfilled' ? chessResult.value : null
  const blogStats =
    blogStatsResult.status === 'fulfilled' ? blogStatsResult.value : null
  const lastfm =
    lastfmResult.status === 'fulfilled' ? lastfmResult.value : null
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

  // GitHub - just top-level numbers
  if (github?.stats) {
    response.githubContributions = safeNumber(github.stats.totalContributions)
    response.githubRepos = safeNumber(github.stats.totalRepos)
    response.githubFollowers = safeNumber(github.stats.followers)
  }

  // Chess - current ratings only
  if (chess) {
    response.chessRapid = safeNumber(chess.currentRating?.rapid)
    response.chessBlitz = safeNumber(chess.currentRating?.blitz)
    response.chessBullet = safeNumber(chess.currentRating?.bullet)
    response.chessPuzzles = safeNumber(chess.puzzleStats?.rating)
    response.chessGamesTotal = safeNumber(chess.gamesPlayed?.total)
  }

  // Blog stats
  if (blogStats) {
    response.blogPostsThisMonth = safeNumber(blogStats.posts?.thisMonth)
    response.blogPostsTotal = safeNumber(blogStats.posts?.total)
    response.blogWordsThisMonth = safeNumber(blogStats.words?.thisMonth)
  }

  // Last.fm - just totals and top artist
  if (lastfm) {
    response.musicTotalScrobbles = safeNumber(lastfm.userInfo?.playcount)
    // Get top artist name from topArtists array
    if (lastfm.topArtists?.artists?.[0]?.name) {
      response.musicTopArtist = safeString(lastfm.topArtists.artists[0].name)
    }
  }

  // RescueTime - just weekly summary
  if (rescueTime?.week?.summary) {
    const weekHours = rescueTime.week.summary.total?.hoursDecimal
    const productivePercent = rescueTime.week.summary.productive?.percentage
    response.rescueTimeWeekHours = safeNumber(weekHours)
    response.rescueTimeWeekProductivePercent = safeNumber(productivePercent)
  }

  // Gear stats
  if (gearStats?.stats) {
    response.gearTotalItems = safeNumber(gearStats.stats.totalItems)
    response.gearTotalWeightOz = safeNumber(gearStats.stats.totalWeight)
  }

  // Website stats - current month only
  if (websiteStats?.stats) {
    response.websitePageviewsMonth = safeNumber(
      websiteStats.stats.pageviews?.value
    )
    response.websiteVisitorsMonth = safeNumber(
      websiteStats.stats.visitors?.value
    )
  }

  // Letterboxd
  if (letterboxd?.stats) {
    response.letterboxdThisYear = safeNumber(letterboxd.stats.thisYear)
    response.letterboxdTotal = safeNumber(letterboxd.stats.totalFilms)
    response.letterboxdAvgRating = safeNumber(letterboxd.stats.averageRating)
  }

  // Discogs
  if (discogs?.stats) {
    response.discogsTotal = safeNumber(discogs.stats.totalItems)
    response.discogsValue = safeNumber(discogs.stats.totalValue)
  }

  // Cache the response
  cache.set(cacheKey, response)

  return response
})
