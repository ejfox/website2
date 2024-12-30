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
  photos: [],
  leetcode: {
    contestStats: null,
    recentSubmissions: [],
    submissionStats: {
      easy: { count: 0, submissions: 0 },
      medium: { count: 0, submissions: 0 },
      hard: { count: 0, submissions: 0 }
    },
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
    const controller = new AbortController()
    const id = setTimeout(() => controller.abort(), timeout)

    try {
      const response = await $fetch(url, {
        signal: controller.signal,
        retry: 1,
        onResponseError: ({ response }) => {
          console.error(`Error from ${url}:`, response._data)
          throw new Error(
            response._data?.message || `Failed to fetch from ${url}`
          )
        }
      })
      clearTimeout(id)
      return response
    } catch (error) {
      clearTimeout(id)
      throw error
    }
  }

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
      const [monkeyType, github, photos, leetcode] = await Promise.allSettled([
        fetchWithTimeout('/api/monkeytype').catch((error) => {
          console.error('MonkeyType API error:', error)
          errors.value.monkeyType =
            error.message || 'Failed to fetch typing stats'
          hasStaleData.value = true
          return stats.value.monkeyType || DEFAULT_STATS.monkeyType
        }),
        fetchWithTimeout('/api/github').catch((error) => {
          console.error('GitHub API error:', error)
          errors.value.github = error.message || 'Failed to fetch GitHub stats'
          hasStaleData.value = true
          return stats.value.github || DEFAULT_STATS.github
        }),
        fetchWithTimeout('/api/photos').catch((error) => {
          console.error('Photos API error:', error)
          errors.value.photos = error.message || 'Failed to fetch photo stats'
          hasStaleData.value = true
          return stats.value.photos || DEFAULT_STATS.photos
        }),
        fetchWithTimeout('/api/leetcode').catch((error) => {
          console.error('LeetCode API error:', error)
          errors.value.leetcode =
            error.message || 'Failed to fetch LeetCode stats'
          hasStaleData.value = true
          return stats.value.leetcode || DEFAULT_STATS.leetcode
        })
      ])

      // Update stats with new data or fallback to cached/default values
      const newStats = {
        monkeyType:
          monkeyType.status === 'fulfilled'
            ? monkeyType.value
            : stats.value.monkeyType || DEFAULT_STATS.monkeyType,
        github:
          github.status === 'fulfilled'
            ? github.value
            : stats.value.github || DEFAULT_STATS.github,
        photos:
          photos.status === 'fulfilled'
            ? photos.value
            : stats.value.photos || DEFAULT_STATS.photos,
        leetcode:
          leetcode.status === 'fulfilled'
            ? leetcode.value
            : stats.value.leetcode || DEFAULT_STATS.leetcode
      }

      // Only update stats if we have at least some valid data
      if (
        Object.values(newStats).some((val) => val !== null && val !== undefined)
      ) {
        stats.value = newStats
      }

      // Record any errors and set stale flag
      if (monkeyType.status === 'rejected') {
        errors.value.monkeyType =
          monkeyType.reason?.message || 'Failed to fetch typing stats'
        hasStaleData.value = true
      }
      if (github.status === 'rejected') {
        errors.value.github =
          github.reason?.message || 'Failed to fetch GitHub stats'
        hasStaleData.value = true
      }
      if (photos.status === 'rejected') {
        errors.value.photos =
          photos.reason?.message || 'Failed to fetch photo stats'
        hasStaleData.value = true
      }
      if (leetcode.status === 'rejected') {
        errors.value.leetcode =
          leetcode.reason?.message || 'Failed to fetch LeetCode stats'
        hasStaleData.value = true
      }

      console.log('Final stats object:', stats.value)
    } catch (error) {
      console.error('Error fetching stats:', error)
      errors.value = {
        ...errors.value,
        leetcode: true
      }
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
      return !!(
        stats.value?.github?.stats &&
        (stats.value?.github?.contributions?.length > 0 ||
          stats.value?.github?.repositories?.length > 0)
      )
    } catch (error) {
      console.error('Error checking GitHub data:', error)
      return false
    }
  })

  const hasPhotoData = computed(() => {
    try {
      return !!stats.value?.photos?.photos?.length
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

  return {
    stats,
    isLoading,
    errors,
    hasStaleData,
    hasTypingData,
    hasGitHubData,
    hasPhotoData,
    hasLeetCodeData,
    refresh: () => fetchStats(true),
    publishedPhotos
  }
}
