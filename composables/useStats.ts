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
    lastUpdated: string
  }
  monkeyType?: {
    typingStats?: {
      bestWPM: number
      testsCompleted: number
      bestAccuracy: number
      bestConsistency: number
    }
  }
  github?: {
    stats: {
      totalRepos: number
      totalPRs: number
      mergedPRs: number
      followers: number
      following: number
      totalLinesChanged: number
      totalFilesChanged: number
      totalContributions: number
    }
    repositories: Array<{
      name: string
      description: string
      language: string
      stars: number
      createdAt: string
    }>
    dates: string[]
    contributions: number[]
    currentStreak: number
    longestStreak: number
    totalContributions: number
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
  const hasStaleData = ref(false)

  onMounted(async () => {
    console.log('Fetching stats...')
    try {
      // Try to get cached data first
      const cached = localStorage.getItem('stats')
      if (cached) {
        const { data, timestamp } = JSON.parse(cached)
        const age = Date.now() - timestamp
        if (age < 5 * 60 * 1000) {
          // 5 minutes
          stats.value = data
          console.log('Using cached stats')
          return
        } else {
          hasStaleData.value = true
          stats.value = data // Use stale data while fetching
        }
      }

      const response = await fetch('/api/stats')
      console.log('Stats response:', response)
      if (!response.ok) {
        throw new Error(
          `Failed to fetch stats: ${response.status} ${response.statusText}`
        )
      }
      const data = await response.json()
      console.log('Stats data:', data)
      stats.value = data

      // Cache the fresh data
      localStorage.setItem(
        'stats',
        JSON.stringify({
          data,
          timestamp: Date.now()
        })
      )
      hasStaleData.value = false
    } catch (error) {
      console.error('Error fetching stats:', error)
      errors.value = { fetch: true }
    } finally {
      isLoading.value = false
    }
  })

  return {
    stats,
    isLoading,
    errors,
    hasStaleData
  }
}
