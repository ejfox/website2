// composables/useStats.ts
import { ref, computed, onMounted } from 'vue'
import type { Ref as _Ref } from 'vue'

// DELETED: All caching - direct API calls only

interface TimeBreakdown {
  seconds: number
  minutes: number
  hours: number
  hoursDecimal: number
  formatted: string
}

// Define the HealthDataRecord interface
interface _HealthDataRecord {
  id?: string
  record_id?: number
  date: string
  metric_type: string
  data: {
    value?: number
    units?: string
    workoutType?: string
    sleepType?: string
    moodType?: string
    duration?: number
    distance?: number
    calories?: number
    quality?: number
    deepSleep?: number
    notes?: string
    [key: string]: any
  }
  source?: string
  created_at?: string
  [key: string]: any
}

export interface StatsResponse {
  lastfm?: {
    recentTracks: {
      tracks: Array<{
        name: string
        artist: {
          name: string
          url: string
        }
        url: string
        date?: {
          uts: string
          '#text': string
        }
        image: Array<{
          size: string
          '#text': string
        }>
      }>
      total: number
    }
    topArtists: {
      artists: Array<{
        name: string
        playcount: string
        url: string
        image: Array<{
          size: string
          '#text': string
        }>
      }>
      total: number
    }
    topAlbums: {
      albums: Array<{
        name: string
        playcount: string
        artist: {
          name: string
          url: string
        }
        url: string
        image: Array<{
          size: string
          '#text': string
        }>
      }>
      total: number
    }
    topTracks: {
      tracks: Array<{
        name: string
        artist: {
          name: string
          url: string
        }
        url: string
        playcount?: string
        image: Array<{
          size: string
          '#text': string
        }>
      }>
      total: number
    }
    userInfo: {
      playcount: number
      registered: {
        unixtime: string
        formatted: string
      }
      url: string
      image: string
    }
    stats: {
      totalScrobbles: number
      uniqueArtists: number
      uniqueTracks: number
      averagePerDay: number
      topGenres: Array<{
        name: string
        count: number
      }>
    }
    lastUpdated: string
  }
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
    aggregatedMetrics?: {
      availableMetricTypes: string[]
      sleepSummary?: {
        averageDuration: number // in minutes
        averageQuality?: number // if available
        totalRecords: number
        lastRecordDate: string
      }
      workoutSummary?: {
        totalWorkouts: number
        totalDuration: number // in minutes
        totalDistance?: number // in km
        totalCalories?: number
        lastWorkoutDate: string
        workoutTypes: string[]
      }
      mindfulnessSummary?: {
        totalSessions: number
        totalMinutes: number
        lastSessionDate: string
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
  youtube?: {
    stats: {
      totalVideos: number
      videosThisMonth: number
      totalViews: number
      subscriberCount: number
    }
    latestVideos: Array<{
      id: string
      title: string
      description: string
      publishedAt: string
      thumbnails: {
        default: string
        medium: string
        high: string
      }
      url: string
      views: number
      likes: number
    }>
    lastUpdated: string
  }
  gear?: {
    stats: {
      totalItems: number
      totalWeight: number
      containerCount: number
      avgTCWMScore: number
    }
    typeDistribution: Record<string, number>
    lastUpdated: string
  }
  gists?: {
    stats: {
      totalGists: number
      totalFiles: number
      totalSize: number
      averageFilesPerGist: number
      topLanguages: Array<{
        language: string
        count: number
      }>
      yearStats: Record<string, number>
    }
    recentGists: Array<{
      id: string
      description: string
      created_at: string
      files: number
      languages: string[]
      html_url: string
    }>
    lastUpdated: string
  }
  website?: {
    stats: {
      pageviews: { value: number; prev: number }
      visitors: { value: number; prev: number }
      visits: { value: number; prev: number }
      bounces: { value: number; prev: number }
      totaltime: { value: number; prev: number }
    }
    websiteId: string
    lastUpdated: string
    shareUrl: string
  }
  letterboxd?: {
    films: Array<{
      title: string
      slug: string
      rating: number | null
      letterboxdUrl: string
      watchedDate: string
    }>
    stats: {
      totalFilms: number
      thisYear: number
      thisMonth: number
      averageRating: number
      rewatches: number
      topRatedFilms: any[]
      recentFilms: any[]
      filmsByMonth: Record<string, number>
    }
    lastUpdated: string
    source: string
  }
  blog?: {
    posts: {
      thisMonth: number
      total: number
    }
    words: {
      thisMonth: number
      avgPerPost: number
    }
    recentPosts: Array<{
      title: string
      slug: string
      date: string
      words: number
    }>
    month: string
    year: number
  }
}

export function useStats() {
  const stats = ref<StatsResponse | null>(null)
  const isLoading = ref(true)
  const errors = ref<Record<string, boolean>>({})
  const hasStaleData = ref(false)

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
  const hasLastFmData = computed(() => !!stats.value?.lastfm)

  // DELETED: All caching functions

  onMounted(async () => {
    // DELETED: All caching - direct API call only
    await fetchFreshData()
  })

  const fetchFreshData = async () => {
    isLoading.value = true

    try {
      // DELETED: All caching and cache-busting - direct API call
      const response = await fetch('/api/stats')
      if (!response.ok) {
        throw new Error(`Failed to fetch stats: ${response.status}`)
      }
      const data = await response.json()
      stats.value = data
      hasStaleData.value = false
    } catch (error) {
      console.error('Error fetching stats:', error)
      errors.value.fetch = true
    } finally {
      isLoading.value = false
    }
  }

  return {
    stats,
    isLoading,
    errors,
    hasStaleData,
    hasGithubData,
    hasMonkeyTypeData,
    hasPhotoData,
    hasHealthData,
    hasLeetCodeData,
    hasChessData,
    hasRescueTimeData,
    hasLastFmData
    // DELETED: refresh method - not needed without caching
  }
}
