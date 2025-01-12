// composables/useStats.ts
import { ref, computed, onMounted } from 'vue'
import type { Ref } from 'vue'

interface TimeBreakdown {
  seconds: number
  minutes: number
  hours: number
  hoursDecimal: number
  formatted: string
}

export interface StatsResponse {
  rescueTime?: {
    week: {
      categories: Array<{
        name: string
        time: TimeBreakdown
        percentageOfTotal: number
        productivity: number
      }>
      activities: Array<{
        name: string
        time: TimeBreakdown
        percentageOfTotal: number
        category: string
        productivity: number
      }>
      summary: {
        total: TimeBreakdown
        productive: {
          time: TimeBreakdown
          percentage: number
        }
        distracting: {
          time: TimeBreakdown
          percentage: number
        }
        neutral: {
          time: TimeBreakdown
          percentage: number
        }
      }
    }
    month: {
      categories: Array<{
        name: string
        time: TimeBreakdown
        percentageOfTotal: number
        productivity: number
      }>
      activities: Array<{
        name: string
        time: TimeBreakdown
        percentageOfTotal: number
        category: string
        productivity: number
      }>
      summary: {
        total: TimeBreakdown
        productive: {
          time: TimeBreakdown
          percentage: number
        }
        distracting: {
          time: TimeBreakdown
          percentage: number
        }
        neutral: {
          time: TimeBreakdown
          percentage: number
        }
      }
    }
    lastUpdated: string
  }
  monkeyType?: {
    typingStats: {
      bestWPM: number
      testsCompleted: number
      bestAccuracy: number
      bestConsistency: number
      recentTests: Array<{
        timestamp: string
        wpm: number
        accuracy: number
      }>
    } | null
    lastUpdated: string
  }
  github?: {
    stats: {
      totalRepos: number
      totalContributions: number
      followers: number
      following: number
    }
    contributions: number[] // Daily contribution counts
    dates: string[] // Corresponding dates for contributions
    detail: {
      commits: Array<{
        // Recent commits (last 7 days)
        repository: {
          name: string
          url: string
        }
        message: string
        occurredAt: string
        url: string
        type: string
      }>
      commitTypes: Array<{
        type: string
        count: number
        percentage: number
      }>
    }
  }
  photos?: {
    stats: {
      totalPhotos: number
      photosThisMonth: number
      averagePerMonth: number
    }
    photos: Array<{
      id: string
      uploaded_at: string
    }>
  }
  health?: {
    today: {
      steps: number
      standHours: number
      exerciseMinutes: number
      distance: number
      calories: number
    }
    thisWeek: {
      steps: number
      exerciseMinutes: number
      distance: number
      calories: number
    }
    thisYear: {
      steps: number
      exerciseMinutes: number
      distance: number
      calories: number
      averageStepsPerDay: number
      averageExercisePerWeek: number
    }
    averages: {
      dailySteps: number
      dailyStandHours: number
      dailyExerciseMinutes: number
      dailyDistance: number
      restingHeartRate: number
    }
    heartRate: {
      resting: number
      walking: number
      current: number
      variability: number
    }
    activity: {
      monthlyDistance: number
      monthlyExerciseMinutes: number
      monthlySteps: number
      flightsClimbed: number
    }
    trends: {
      daily: {
        dates: string[]
        steps: number[]
        exercise: number[]
        distance: number[]
      }
      weekly: {
        dates: string[]
        steps: number[]
        exercise: number[]
        distance: number[]
      }
      monthly: {
        dates: string[]
        steps: number[]
        exercise: number[]
        distance: number[]
      }
    }
    lastUpdated: string
  }
  leetcode?: {
    contestStats?: {
      rating: number
      globalRanking: number
      totalParticipants: number
      topPercentage: number
    }
    submissionStats: {
      easy: { count: number; submissions: number }
      medium: { count: number; submissions: number }
      hard: { count: number; submissions: number }
    }
    recentSubmissions: Array<{
      title: string
      titleSlug: string
      timestamp: string
      statusDisplay: string
      lang: string
    }>
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

export function useStats() {
  const stats = ref<StatsResponse | null>(null)
  const isLoading = ref(true)
  const errors = ref<Record<string, boolean>>({})

  const hasGithubData = computed(() => {
    return !!(
      stats.value?.github?.stats && stats.value?.github?.detail?.commits
    )
  })

  const hasMonkeyTypeData = computed(() => {
    return !!stats.value?.monkeyType?.typingStats?.bestWPM
  })

  const hasPhotoData = computed(() => !!stats.value?.photos?.stats)
  const hasHealthData = computed(() => !!stats.value?.health)
  const hasLeetCodeData = computed(
    () => !!stats.value?.leetcode?.submissionStats
  )
  const hasChessData = computed(() => !!stats.value?.chess)
  const hasRescueTimeData = computed(() => !!stats.value?.rescueTime)

  onMounted(async () => {
    try {
      // Force fresh data
      const response = await fetch('/api/stats')
      if (!response.ok) {
        throw new Error(`Failed to fetch stats: ${response.status}`)
      }
      const data = await response.json()
      stats.value = data
    } catch (error) {
      console.error('Error fetching stats:', error)
      errors.value.fetch = true
    } finally {
      isLoading.value = false
    }
  })

  return {
    stats,
    isLoading,
    errors,
    hasGithubData,
    hasMonkeyTypeData,
    hasPhotoData,
    hasHealthData,
    hasLeetCodeData,
    hasChessData,
    hasRescueTimeData
  }
}
