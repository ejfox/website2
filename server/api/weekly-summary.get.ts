/**
 * @file weekly-summary.get.ts
 * @description Aggregates data from multiple services for a specific ISO week
 * @endpoint GET /api/weekly-summary?week=2026-05 or ?week=2026-W05
 * @returns Comprehensive weekly data for Sunday Interview skill
 */
import { defineEventHandler, getQuery, createError } from 'h3'

interface WeekRange {
  weekNumber: number
  year: number
  monday: Date
  sunday: Date
  mondayStr: string
  sundayStr: string
}

interface DaySummary {
  date: string
  dayName: string
  github: {
    commits: number
    repos: string[]
    messages: string[]
  }
  rescuetime: {
    totalHours: number
    productivePercent: number
    topActivities: string[]
  }
  health: {
    steps: number
    exerciseMinutes: number
  }
  chess: {
    gamesPlayed: number
    winRate: number
  }
}

interface WeeklySummary {
  week: {
    number: number
    year: number
    range: string
    monday: string
    sunday: string
  }
  days: DaySummary[]
  github: {
    totalCommits: number
    repos: Array<{
      name: string
      commits: number
      topMessages: string[]
    }>
    newRepos: string[]
  }
  rescuetime: {
    totalHours: number
    productiveHours: number
    productivePercent: number
    topActivities: Array<{
      name: string
      hours: number
      percent: number
    }>
    topCategories: Array<{
      name: string
      hours: number
    }>
  }
  music: {
    totalScrobbles: number
    topArtists: Array<{
      name: string
      plays: number
    }>
    topTracks: Array<{
      name: string
      artist: string
      plays: number
    }>
  }
  films: Array<{
    title: string
    rating: number | null
    watchedDate: string
  }>
  books: {
    reading: string[]
    finished: string[]
  }
  health: {
    totalSteps: number
    avgStepsPerDay: number
    totalExerciseMinutes: number
    avgExercisePerDay: number
    restingHeartRate: number
  }
  chess: {
    gamesPlayed: number
    wins: number
    losses: number
    draws: number
    ratingChange: number
    currentRating: number
  }
  blog: {
    postsPublished: number
    wordsWritten: number
    posts: Array<{
      title: string
      slug: string
      words: number
    }>
  }
  duolingo: {
    streak: number
    xpGained: number
  }
  lastUpdated: string
}

/**
 * Parse week parameter and return date range
 * Accepts: "2026-05", "2026-W05", "05" (assumes current year)
 */
function parseWeekParam(weekParam: string): WeekRange {
  const now = new Date()
  let year: number
  let weekNumber: number

  // Handle different formats
  if (weekParam.includes('W')) {
    // ISO format: 2026-W05
    const parts = weekParam.split('-W')
    year = parseInt(parts[0])
    weekNumber = parseInt(parts[1])
  } else if (weekParam.includes('-')) {
    // Simple format: 2026-05
    const parts = weekParam.split('-')
    year = parseInt(parts[0])
    weekNumber = parseInt(parts[1])
  } else {
    // Just week number, assume current year
    year = now.getFullYear()
    weekNumber = parseInt(weekParam)
  }

  // Calculate Monday of that ISO week
  // ISO week 1 is the week containing January 4th
  const jan4 = new Date(year, 0, 4)
  const dayOfWeek = jan4.getDay() || 7 // Convert Sunday=0 to 7
  const monday = new Date(jan4)
  monday.setDate(jan4.getDate() - dayOfWeek + 1 + (weekNumber - 1) * 7)
  monday.setHours(0, 0, 0, 0)

  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  sunday.setHours(23, 59, 59, 999)

  const formatDate = (d: Date) => d.toISOString().split('T')[0]

  return {
    weekNumber,
    year,
    monday,
    sunday,
    mondayStr: formatDate(monday),
    sundayStr: formatDate(sunday),
  }
}

/**
 * Get current ISO week number
 */
function getCurrentWeek(): string {
  const now = new Date()
  const jan1 = new Date(now.getFullYear(), 0, 1)
  const days = Math.floor((now.getTime() - jan1.getTime()) / 86400000)
  const weekNum = Math.ceil((days + jan1.getDay() + 1) / 7)
  return `${now.getFullYear()}-${String(weekNum).padStart(2, '0')}`
}

/**
 * Check if a date falls within the week range
 */
function isInWeek(dateStr: string, weekRange: WeekRange): boolean {
  const date = new Date(dateStr)
  return date >= weekRange.monday && date <= weekRange.sunday
}

/**
 * Get day name from date
 */
function getDayName(dateStr: string): string {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  return days[new Date(dateStr).getDay()]
}

export default defineEventHandler(async (event): Promise<WeeklySummary> => {
  const query = getQuery(event)
  const weekParam = (query.week as string) || getCurrentWeek()

  let weekRange: WeekRange
  try {
    weekRange = parseWeekParam(weekParam)
  } catch (e) {
    throw createError({
      statusCode: 400,
      message: `Invalid week format: ${weekParam}. Use YYYY-WW or YYYY-W##`,
    })
  }

  // Fetch all data sources in parallel
  const baseUrl = process.env.NODE_ENV === 'development'
    ? 'http://localhost:3000'
    : 'https://ejfox.com'

  const results = await Promise.allSettled([
    $fetch(`${baseUrl}/api/github`).catch(() => null),
    $fetch(`${baseUrl}/api/rescuetime`).catch(() => null),
    $fetch(`${baseUrl}/api/lastfm`).catch(() => null),
    $fetch(`${baseUrl}/api/letterboxd`).catch(() => null),
    $fetch(`${baseUrl}/api/goodreads`).catch(() => null),
    $fetch(`${baseUrl}/api/apple-health`).catch(() => null),
    $fetch(`${baseUrl}/api/chess`).catch(() => null),
    $fetch(`${baseUrl}/api/blog-stats`).catch(() => null),
    $fetch(`${baseUrl}/api/duolingo`).catch(() => null),
  ])

  // Extract results with fallbacks
  const github = results[0].status === 'fulfilled' ? results[0].value : null
  const rescuetime = results[1].status === 'fulfilled' ? results[1].value : null
  const lastfm = results[2].status === 'fulfilled' ? results[2].value : null
  const letterboxd = results[3].status === 'fulfilled' ? results[3].value : null
  const goodreads = results[4].status === 'fulfilled' ? results[4].value : null
  const health = results[5].status === 'fulfilled' ? results[5].value : null
  const chess = results[6].status === 'fulfilled' ? results[6].value : null
  const blogStats = results[7].status === 'fulfilled' ? results[7].value : null
  const duolingo = results[8].status === 'fulfilled' ? results[8].value : null

  // Process GitHub data - filter commits to this week
  const githubData = (() => {
    if (!github?.detail?.commits) {
      return { totalCommits: 0, repos: [], newRepos: [] }
    }

    const weekCommits = github.detail.commits.filter((c: any) =>
      isInWeek(c.occurredAt, weekRange)
    )

    // Group by repo
    const repoMap = new Map<string, { commits: number; messages: string[] }>()
    for (const commit of weekCommits) {
      const repoName = commit.repository.name
      if (!repoMap.has(repoName)) {
        repoMap.set(repoName, { commits: 0, messages: [] })
      }
      const repo = repoMap.get(repoName)!
      repo.commits++
      repo.messages.push(commit.message.split('\n')[0]) // First line only
    }

    const repos = Array.from(repoMap.entries())
      .map(([name, data]) => ({
        name,
        commits: data.commits,
        topMessages: data.messages.slice(0, 5),
      }))
      .sort((a, b) => b.commits - a.commits)

    return {
      totalCommits: weekCommits.length,
      repos,
      newRepos: [], // Would need separate API call to detect new repos
    }
  })()

  // Process RescueTime data
  const rescuetimeData = (() => {
    if (!rescuetime?.week) {
      return {
        totalHours: 0,
        productiveHours: 0,
        productivePercent: 0,
        topActivities: [],
        topCategories: [],
      }
    }

    const week = rescuetime.week
    return {
      totalHours: week.summary?.total?.hoursDecimal || 0,
      productiveHours: week.summary?.productive?.time?.hoursDecimal || 0,
      productivePercent: week.summary?.productive?.percentage || 0,
      topActivities: (week.activities || []).slice(0, 5).map((a: any) => ({
        name: a.name,
        hours: a.time?.hoursDecimal || 0,
        percent: a.percentageOfTotal || 0,
      })),
      topCategories: (week.categories || []).slice(0, 5).map((c: any) => ({
        name: c.name,
        hours: c.time?.hoursDecimal || 0,
      })),
    }
  })()

  // Process Last.fm data (note: their API gives monthly, not weekly)
  const musicData = (() => {
    if (!lastfm) {
      return { totalScrobbles: 0, topArtists: [], topTracks: [] }
    }

    return {
      totalScrobbles: lastfm.stats?.totalScrobbles || 0,
      topArtists: (lastfm.topArtists?.artists || []).slice(0, 5).map((a: any) => ({
        name: a.name,
        plays: parseInt(a.playcount) || 0,
      })),
      topTracks: (lastfm.topTracks?.tracks || []).slice(0, 5).map((t: any) => ({
        name: t.name,
        artist: t.artist?.name || '',
        plays: parseInt(t.playcount) || 0,
      })),
    }
  })()

  // Process Letterboxd - filter to this week
  const filmsData = (() => {
    if (!letterboxd?.films) return []

    return letterboxd.films
      .filter((f: any) => f.watchedDate && isInWeek(f.watchedDate, weekRange))
      .map((f: any) => ({
        title: f.title,
        rating: f.rating,
        watchedDate: f.watchedDate,
      }))
  })()

  // Process Goodreads
  const booksData = (() => {
    if (!goodreads) return { reading: [], finished: [] }

    return {
      reading: (goodreads.currentlyReading || []).map((b: any) => b.title),
      finished: [], // Would need date filtering
    }
  })()

  // Process Apple Health
  const healthData = (() => {
    if (!health) {
      return {
        totalSteps: 0,
        avgStepsPerDay: 0,
        totalExerciseMinutes: 0,
        avgExercisePerDay: 0,
        restingHeartRate: 0,
      }
    }

    return {
      totalSteps: health.thisWeek?.steps || 0,
      avgStepsPerDay: Math.round((health.thisWeek?.steps || 0) / 7),
      totalExerciseMinutes: health.thisWeek?.exerciseMinutes || 0,
      avgExercisePerDay: Math.round((health.thisWeek?.exerciseMinutes || 0) / 7),
      restingHeartRate: health.heartRate?.resting || 0,
    }
  })()

  // Process Chess.com
  const chessData = (() => {
    if (!chess) {
      return {
        gamesPlayed: 0,
        wins: 0,
        losses: 0,
        draws: 0,
        ratingChange: 0,
        currentRating: 0,
      }
    }

    // Filter recent games to this week
    const weekGames = (chess.recentGames || []).filter((g: any) =>
      g.timestamp && isInWeek(new Date(g.timestamp * 1000).toISOString(), weekRange)
    )

    const wins = weekGames.filter((g: any) => g.result === 'win').length
    const losses = weekGames.filter((g: any) => g.result === 'loss').length
    const draws = weekGames.filter((g: any) => g.result === 'draw').length

    return {
      gamesPlayed: weekGames.length,
      wins,
      losses,
      draws,
      ratingChange: 0, // Would need start/end comparison
      currentRating: chess.ratings?.rapid?.current || chess.ratings?.blitz?.current || 0,
    }
  })()

  // Process blog stats
  const blogData = (() => {
    if (!blogStats) {
      return { postsPublished: 0, wordsWritten: 0, posts: [] }
    }

    // Filter posts to this week
    const weekPosts = (blogStats.recentPosts || []).filter((p: any) =>
      p.date && isInWeek(p.date, weekRange)
    )

    return {
      postsPublished: weekPosts.length,
      wordsWritten: weekPosts.reduce((sum: number, p: any) => sum + (p.wordCount || 0), 0),
      posts: weekPosts.map((p: any) => ({
        title: p.title,
        slug: p.slug,
        words: p.wordCount || 0,
      })),
    }
  })()

  // Process Duolingo
  const duolingoData = (() => {
    if (!duolingo) return { streak: 0, xpGained: 0 }

    return {
      streak: duolingo.streak || 0,
      xpGained: 0, // API doesn't provide weekly XP breakdown
    }
  })()

  // Build day-by-day summary
  const days: DaySummary[] = []
  for (let i = 0; i < 7; i++) {
    const date = new Date(weekRange.monday)
    date.setDate(date.getDate() + i)
    const dateStr = date.toISOString().split('T')[0]

    // Filter GitHub commits for this day
    const dayCommits = github?.detail?.commits?.filter((c: any) =>
      c.occurredAt.startsWith(dateStr)
    ) || []

    const dayRepos = [...new Set(dayCommits.map((c: any) => c.repository.name))]

    // Get health data for this day from trends
    const dayIndex = health?.trends?.daily?.dates?.indexOf(dateStr) ?? -1
    const daySteps = dayIndex >= 0 ? health.trends.daily.steps[dayIndex] : 0
    const dayExercise = dayIndex >= 0 ? health.trends.daily.exercise[dayIndex] : 0

    days.push({
      date: dateStr,
      dayName: getDayName(dateStr),
      github: {
        commits: dayCommits.length,
        repos: dayRepos,
        messages: dayCommits.map((c: any) => c.message.split('\n')[0]).slice(0, 3),
      },
      rescuetime: {
        totalHours: 0, // RescueTime API doesn't give daily breakdown easily
        productivePercent: 0,
        topActivities: [],
      },
      health: {
        steps: daySteps,
        exerciseMinutes: dayExercise,
      },
      chess: {
        gamesPlayed: 0, // Would need to filter
        winRate: 0,
      },
    })
  }

  return {
    week: {
      number: weekRange.weekNumber,
      year: weekRange.year,
      range: `${weekRange.mondayStr} to ${weekRange.sundayStr}`,
      monday: weekRange.mondayStr,
      sunday: weekRange.sundayStr,
    },
    days,
    github: githubData,
    rescuetime: rescuetimeData,
    music: musicData,
    films: filmsData,
    books: booksData,
    health: healthData,
    chess: chessData,
    blog: blogData,
    duolingo: duolingoData,
    lastUpdated: new Date().toISOString(),
  }
})
