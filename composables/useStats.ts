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
  message: string
  data: {
    typingStats: MonkeyTypeStats
  }
}

import { useStorage } from '@vueuse/core'

export const useStats = () => {
  const stats = useStorage<{
    monkeyType: any | null
    github: any | null
    photos: any | null
  }>('stats-cache', {
    monkeyType: null,
    github: null,
    photos: null
  })
  const isLoading = ref(true)
  const errors = useStorage<Record<string, string>>('stats-errors', {})

  const fetchStats = async () => {
    isLoading.value = true
    errors.value = {}

    try {
      const [monkeyType, github, photos] = await Promise.allSettled([
        $fetch('/api/monkeytype'),
        $fetch('/api/github'),
        $fetch('/api/photos')
      ])

      stats.value = {
        monkeyType: monkeyType.status === 'fulfilled' ? monkeyType.value : null,
        github: github.status === 'fulfilled' ? github.value : null,
        photos: photos.status === 'fulfilled' ? photos.value : null
      }

      // Record any errors
      if (monkeyType.status === 'rejected')
        errors.value.monkeyType = monkeyType.reason
      if (github.status === 'rejected') errors.value.github = github.reason
      if (photos.status === 'rejected') errors.value.photos = photos.reason
    } catch (error) {
      console.error('Error fetching stats:', error)
    } finally {
      isLoading.value = false
    }
  }

  onMounted(fetchStats)

  return {
    stats,
    isLoading,
    errors,
    refresh: fetchStats
  }
}
