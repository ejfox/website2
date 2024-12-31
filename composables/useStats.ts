// composables/useStats.ts
interface StatsData {
  metrics: {
    keystrokes: number
    musicHours: number
    chessGames: number
    steps: number
    photos: number
    linesOfCode: number
    hoursTracked: number
    activeDays: number
  }
  typing: {
    currentWPM: number
    productivityPulse: number
    bestWPM: number
    accuracy: number
    recentTests: any[]
    historicalWPM: number[]
  }
  music: {
    currentStreak: number
    topArtists: Array<{
      name: string
      plays: number
    }>
    recentTracks: any[]
    dailyMinutes: number[]
    favoriteGenres: string[]
    listenHistory: any[]
  }
  health: {
    sleepScore: number
    activeMinutes: number
    stepCount: number
    sleepHistory: number[]
    activityHeatmap: number[]
    workouts: any[]
    heartRate: {
      resting: number
      zones: number[]
    }
  }
  chess: {
    currentRating: number
    peakRating: number
    recentGames: any[]
    winRate: number
    accuracy: number
    openings: {
      white: any[]
      black: any[]
    }
    ratingHistory: number[]
  }
  code: {
    currentStreak: number
    prCount: number
    contributions: number[]
    languages: string[]
    repositories: any[]
    commitMessages: string[]
    activeHours: number[]
    hourlyDetails: {
      name: string
      count: number
    }[]
    dates: string[]
  }
  productivity: {
    dailyProductivityPulse: number
    topActivities: any[]
    focusedWork: {
      hours: number
      peak: string
      streak: number
    }
    distractions: {
      count: number
      topSources: string[]
      timeWasted: number
    }
    categories: any[]
    trends: {
      daily: number[]
      weekly: number[]
      monthly: number[]
    }
  }
  photography: {
    totalPhotos: number
    recentPhotos: Array<{
      id: string
      url: string
      uploaded_at: string
      width: number
      height: number
      format: string
    }>
    byMonth: Array<{
      month: string
      count: number
    }>
    byFormat: Array<{
      format: string
      count: number
    }>
    byAspectRatio: Array<{
      ratio: string
      count: number
    }>
    photos: Array<{
      public_id: string
      secure_url: string
      created_at: string
    }>
  }
  weather: {
    current: {
      temp: number
      feelsLike: number
      conditions: string
      windSpeed: number
    }
    history: Array<{
      date: string
      temp: number
      conditions: string
    }>
    extremes: {
      coldest: number
      windiest: number
      snowiest: number
    }
    trainingConditions: Array<{
      type: string
      count: number
      lastDate: string
    }>
  }
}

// Add these interfaces at the top
interface GitHubContributionDay {
  contributionCount: number
  date: string
}

interface GitHubRepo {
  name: string
  primaryLanguage?: {
    name: string
  }
  defaultBranchRef?: {
    target: {
      history: {
        nodes: Array<{
          message: string
          committedDate: string
        }>
      }
    }
  }
}

interface GitHubResponse {
  data: {
    viewer: {
      contributionsCollection: {
        contributionCalendar: {
          totalContributions: number
          weeks: Array<{
            contributionDays: GitHubContributionDay[]
          }>
        }
        pullRequestContributions: {
          totalCount: number
          nodes: {
            pullRequest: {
              title: string
              merged: boolean
              mergedAt: string
            }
          }[]
        }
      }
      repositories: {
        nodes: GitHubRepo[]
      }
    }
  }
  errors?: Array<{ message: string }>
}

// Add to the interfaces section
interface CloudinaryPhoto {
  href: string
  public_id: string
  uploaded_at: string
  tags: string[]
  metadata: {
    camera?: string
    lens?: string
    aperture?: string
    iso?: string
    focal_length?: string
  }
}

// Update MonkeyType interfaces to match API
interface MonkeyTypeTest {
  wpm: number
  acc: number
  raw: number
  consistency: number
  timestamp: number
  mode: string
  mode2: string
  language: string
}

interface MonkeyTypeStats {
  timeTyping: number
  testsCompleted: number
  testsStarted: number
}

interface MonkeyTypeResponse {
  typingStats: {
    testsCompleted: number
    testsStarted: number
    bestWPM: number
    bestAccuracy: number
    bestConsistency: number
    timePercentile: number
    wordsPercentile: number
  }
  personalBests: {
    time: { [key: string]: any[] }
    words: { [key: string]: any[] }
  }
  speedHistogram: {
    time: { [key: string]: number }
    words: { [key: string]: number }
  }
  lastUpdated: string
}

// Add LeetCode interfaces
interface SubmissionStats {
  count: number
  submissions: number
}

interface ContestRanking {
  rating: number
  globalRanking: number
  totalParticipants: number
  topPercentage: number
}

interface RecentSubmission {
  title: string
  titleSlug: string
  timestamp: string
  statusDisplay: string
  lang: string
}

// Update StatsResponse interface to include LeetCode
interface StatsResponse {
  monkeyType: MonkeyTypeResponse
  github: {
    stats: {
      totalRepos: number
      totalPRs: number
      mergedPRs: number
      followers: number
      following: number
      totalLinesChanged: number
      totalFilesChanged: number
    }
    repositories: Array<{
      name: string
      description: string
      stars: number
      forks: number
      primaryLanguage?: {
        name: string
        color: string
      }
      updatedAt: string
      createdAt: string
    }>
    contributions: number[]
    dates: string[]
    currentStreak: number
    longestStreak: number
    totalContributions: number
  }
  photos: any[]
  leetcode?: {
    contestStats: ContestRanking | null
    recentSubmissions: RecentSubmission[]
    submissionStats: {
      easy: SubmissionStats
      medium: SubmissionStats
      hard: SubmissionStats
    }
    lastUpdated: string
  }
  chess?: {
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
    }
    recentGames: Array<{
      id: string
      opponent: string
      timeControl: string
      result: 'win' | 'loss' | 'draw'
      timestamp: number
      rating: number
      ratingDiff: number
    }>
    lastUpdated: string
  }
}

// Default/fallback values
const DEFAULT_STATS: StatsResponse = {
  monkeyType: {
    typingStats: {
      testsCompleted: 0,
      testsStarted: 0,
      bestWPM: 0,
      bestAccuracy: 0,
      bestConsistency: 0,
      timePercentile: 0,
      wordsPercentile: 0
    },
    personalBests: {
      time: {},
      words: {}
    },
    speedHistogram: {
      time: {},
      words: {}
    },
    lastUpdated: new Date().toISOString()
  },
  github: {
    stats: {
      totalRepos: 0,
      totalPRs: 0,
      mergedPRs: 0,
      followers: 0,
      following: 0,
      totalLinesChanged: 0,
      totalFilesChanged: 0
    },
    repositories: [],
    contributions: [],
    dates: [],
    currentStreak: 0,
    longestStreak: 0,
    totalContributions: 0
  },
  photos: {
    stats: {
      totalPhotos: 0,
      photosThisYear: 0,
      photosThisMonth: 0,
      averagePerMonth: 0,
      mostActiveMonth: { month: '', count: 0 }
    },
    photos: [],
    contributions: [],
    dates: [],
    currentStreak: 0,
    longestStreak: 0
  },
  leetcode: {
    contestStats: null,
    recentSubmissions: [],
    submissionStats: {
      easy: { count: 0, submissions: 0 },
      medium: { count: 0, submissions: 0 },
      hard: { count: 0, submissions: 0 }
    },
    lastUpdated: new Date().toISOString()
  },
  chess: {
    currentRating: {
      bullet: 0,
      blitz: 0,
      rapid: 0
    },
    bestRating: {
      bullet: 0,
      blitz: 0,
      rapid: 0
    },
    gamesPlayed: {
      bullet: 0,
      blitz: 0,
      rapid: 0,
      total: 0
    },
    winRate: {
      bullet: 0,
      blitz: 0,
      rapid: 0,
      overall: 0
    },
    puzzleStats: {
      rating: 0,
      totalSolved: 0,
      bestRating: 0
    },
    recentGames: [],
    lastUpdated: new Date().toISOString()
  }
}

import { useStorage } from '@vueuse/core'

export const useStats = () => {
  const stats = useStorage<StatsResponse>('stats-cache', DEFAULT_STATS)
  const isLoading = ref(true)
  const errors = useStorage<Record<string, string>>('stats-errors', {})
  const hasStaleData = ref(false)
  const lastFetchAttempt = useStorage('stats-last-fetch', 0)
  const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

  const fetchWithTimeout = async (url: string, timeout = 5000) => {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), timeout)

      const response = await $fetch(url, {
        signal: controller.signal
      })

      clearTimeout(timeoutId)
      return response
    } catch (error) {
      console.error(`Fetch error for ${url}:`, error)
      // If it's an abort error, throw a more specific error
      if (error.name === 'AbortError') {
        throw new Error(`Request to ${url} timed out after ${timeout}ms`)
      }
      throw error
    }
  }

  // Add this helper function to transform GitHub data
  const transformGithubData = (rawData: any) => {
    if (!rawData?.data?.viewer) return null

    const { viewer } = rawData.data
    const contributions =
      viewer.contributionsCollection.contributionCalendar.weeks
        .flatMap((week) => week.contributionDays)
        .map((day) => ({
          date: day.date,
          count: day.contributionCount
        }))

    return {
      stats: {
        totalRepos: viewer.repositories.nodes.length,
        totalPRs:
          viewer.contributionsCollection.pullRequestContributions.totalCount,
        mergedPRs:
          viewer.contributionsCollection.pullRequestContributions.nodes.filter(
            (pr) => pr.pullRequest.merged
          ).length,
        totalContributions:
          viewer.contributionsCollection.contributionCalendar.totalContributions
      },
      repositories: viewer.repositories.nodes.map((repo) => ({
        name: repo.name,
        description: repo.description || '',
        stars: repo.stargazerCount,
        forks: repo.forkCount,
        primaryLanguage: repo.primaryLanguage
      })),
      contributions: contributions.map((c) => c.count),
      dates: contributions.map((c) => c.date),
      currentStreak: calculateStreak(contributions),
      longestStreak: calculateLongestStreak(contributions),
      totalContributions:
        viewer.contributionsCollection.contributionCalendar.totalContributions,
      lastUpdated: new Date().toISOString()
    }
  }

  // Update the fetchStats function's GitHub handling
  const fetchStats = async (force = false) => {
    // Check if we should use cache
    const now = Date.now()
    if (!force && now - lastFetchAttempt.value < CACHE_DURATION) {
      console.log('Using cached stats')
      return
    }

    isLoading.value = true
    errors.value = {}
    hasStaleData.value = false
    lastFetchAttempt.value = now

    try {
      console.log('Fetching stats...')
      const [monkeyType, github, photos, leetcode, chess, health] =
        await Promise.allSettled([
          $fetch('/api/monkeytype'),
          $fetch('/api/github'),
          $fetch('/api/photos'),
          $fetch('/api/leetcode'),
          $fetch('/api/chess'),
          $fetch('/api/health')
        ])

      console.log('Health response:', health)

      const newStats = {
        monkeyType: monkeyType.status === 'fulfilled' ? monkeyType.value : null,
        github: github.status === 'fulfilled' ? github.value : null,
        photos: photos.status === 'fulfilled' ? photos.value : null,
        leetcode: leetcode.status === 'fulfilled' ? leetcode.value : null,
        chess: chess.status === 'fulfilled' ? chess.value : null,
        health: health.status === 'fulfilled' ? health.value : null
      }

      // Update stats
      stats.value = {
        ...stats.value,
        ...newStats
      }

      // Update errors object
      errors.value = {
        monkeyType: monkeyType.status === 'rejected',
        github: github.status === 'rejected',
        photos: photos.status === 'rejected',
        leetcode: leetcode.status === 'rejected',
        chess: chess.status === 'rejected',
        health: health.status === 'rejected'
      }

      console.log('Updated errors:', errors.value)
    } catch (error) {
      console.error('Error in fetchStats:', error)
    } finally {
      isLoading.value = false
    }
  }

  // Fetch on mount if cache is stale
  onMounted(() => {
    const now = Date.now()
    if (now - lastFetchAttempt.value >= CACHE_DURATION) {
      fetchStats()
    }
  })

  // Computed properties for data availability
  const hasTypingData = computed(() => {
    try {
      return !!stats.value?.monkeyType?.typingStats?.timeTyping
    } catch (error) {
      console.error('Error checking typing data:', error)
      return false
    }
  })

  const hasGitHubData = computed(() => {
    try {
      console.log('GitHub Data Check:', {
        stats: stats.value?.github,
        totalContributions: stats.value?.github?.totalContributions,
        reposLength: stats.value?.github?.repositories?.length,
        contributionsLength: stats.value?.github?.contributions?.length
      })

      return !!(
        stats.value?.github &&
        (stats.value.github.totalContributions > 0 ||
          stats.value.github.repositories?.length > 0 ||
          stats.value.github.contributions?.length > 0 ||
          stats.value.github.stats?.totalRepos > 0)
      )
    } catch (error) {
      console.error('Error checking GitHub data:', error)
      return false
    }
  })

  const hasPhotoData = computed(() => {
    try {
      return !!(
        stats.value?.photos?.stats?.totalPhotos &&
        Array.isArray(stats.value?.photos?.photos) &&
        stats.value?.photos?.photos.length > 0
      )
    } catch (error) {
      console.error('Error checking photo data:', error)
      return false
    }
  })

  // Compute published photos
  const publishedPhotos = computed(() => {
    return stats.value?.photos?.filter((photo) => photo.published) || []
  })

  // Add hasLeetCodeData computed property
  const hasLeetCodeData = computed(() => {
    try {
      return !!stats.value?.leetcode?.submissionStats
    } catch (error) {
      console.error('Error checking LeetCode data:', error)
      return false
    }
  })

  // Add hasChessData computed property
  const hasChessData = computed(() => {
    try {
      return !!stats.value?.chess?.currentRating
    } catch (error) {
      console.error('Error checking chess data:', error)
      return false
    }
  })

  // Helper function to calculate current streak
  const calculateStreak = (
    contributions: Array<{ date: string; count: number }>
  ) => {
    let streak = 0
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    for (let i = contributions.length - 1; i >= 0; i--) {
      const contribution = contributions[i]
      const date = new Date(contribution.date)
      date.setHours(0, 0, 0, 0)

      if (contribution.count === 0) break
      streak++
    }

    return streak
  }

  // Helper function to calculate longest streak
  const calculateLongestStreak = (
    contributions: Array<{ date: string; count: number }>
  ) => {
    let currentStreak = 0
    let longestStreak = 0

    for (const contribution of contributions) {
      if (contribution.count > 0) {
        currentStreak++
        longestStreak = Math.max(longestStreak, currentStreak)
      } else {
        currentStreak = 0
      }
    }

    return longestStreak
  }

  // Add a computed for this year's photos
  const photosThisYear = computed(() => {
    if (!stats.value?.photos?.photos) return 0
    const currentYear = new Date().getFullYear()
    return stats.value.photos.photos.filter(
      (photo) => new Date(photo.uploaded_at).getFullYear() === currentYear
    ).length
  })

  return {
    stats,
    isLoading,
    errors,
    hasStaleData,
    hasTypingData,
    hasGitHubData,
    hasPhotoData,
    hasLeetCodeData,
    hasChessData,
    refresh: () => fetchStats(true),
    publishedPhotos,
    photosThisYear
  }
}
