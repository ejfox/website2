import { ref, computed, onMounted, watch, readonly } from 'vue'
import type { Ref } from 'vue'

interface UmamiPageViews {
  pageviews: Array<{
    x: string // URL
    y: number // View count
  }>
}

interface UmamiOverallStats {
  pageviews: {
    value: number
    change: number
  }
  visitors: {
    value: number
    change: number
  }
  visits: {
    value: number
    change: number
  }
  bounces: {
    value: number
    change: number
  }
  totaltime: {
    value: number
    change: number
  }
}

interface UmamiStatsResponse {
  url: string
  pageViews: UmamiPageViews
  overallStats: UmamiOverallStats | null
  lastUpdated: string
}

// Cache duration in milliseconds (10 minutes for analytics)
const CACHE_DURATION = 10 * 60 * 1000

export function useUmami(initialUrl?: string | Ref<string | null>) {
  const route = useRoute()
  const currentUrl = computed(() => {
    if (typeof initialUrl === 'string') {
      return initialUrl
    } else if (initialUrl && 'value' in initialUrl) {
      return initialUrl.value || route.fullPath
    } else {
      return route.fullPath
    }
  })

  const stats = ref<UmamiStatsResponse | null>(null)
  const isLoading = ref(true)
  const error = ref<string | null>(null)
  const hasStaleData = ref(false)

  // Computed values for easy access
  const pageViews = computed(() => {
    if (!stats.value?.pageViews?.pageviews?.length) return 0
    return stats.value.pageViews.pageviews.reduce(
      (total, item) => total + item.y,
      0
    )
  })

  const totalSiteViews = computed(() => {
    return stats.value?.overallStats?.pageviews?.value || 0
  })

  const totalSiteVisitors = computed(() => {
    return stats.value?.overallStats?.visitors?.value || 0
  })

  const hasData = computed(() => !!stats.value && pageViews.value > 0)

  // Check if we have cached data for this URL
  const getCachedStats = (url: string): UmamiStatsResponse | null => {
    if (process.server) return null

    try {
      const cacheKey = `umami_stats_${url}`
      const cachedData = localStorage.getItem(cacheKey)
      const timestampKey = `umami_stats_timestamp_${url}`
      const timestamp = localStorage.getItem(timestampKey)

      if (!cachedData || !timestamp) return null

      // Check if cache is still valid
      const cacheTime = parseInt(timestamp, 10)
      const now = Date.now()

      if (now - cacheTime > CACHE_DURATION) return null

      // Set hasStaleData to true if we're using cached data
      hasStaleData.value = true

      return JSON.parse(cachedData)
    } catch (_e) {
      return null
    }
  }

  // Save data to cache
  const cacheStats = (url: string, data: UmamiStatsResponse) => {
    if (process.server) return

    try {
      const cacheKey = `umami_stats_${url}`
      const timestampKey = `umami_stats_timestamp_${url}`
      localStorage.setItem(cacheKey, JSON.stringify(data))
      localStorage.setItem(timestampKey, Date.now().toString())
    } catch (_e) {
      // Ignore cache errors
      console.warn('Failed to cache Umami stats:', _e)
    }
  }

  const fetchStats = async (url: string, isBackgroundFetch = false) => {
    if (!isBackgroundFetch) {
      isLoading.value = true
      error.value = null
    }

    try {
      const response = await fetch(
        `/api/umami/stats?url=${encodeURIComponent(url)}`
      )

      if (!response.ok) {
        throw new Error(`Failed to fetch Umami stats: ${response.status}`)
      }

      const data = await response.json()
      stats.value = data

      // Reset stale data flag when we get fresh data
      hasStaleData.value = false

      // Cache the fresh data
      cacheStats(url, data)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      error.value = errorMessage
      console.error('Error fetching Umami stats:', err)
    } finally {
      isLoading.value = false
    }
  }

  const refreshStats = async () => {
    await fetchStats(currentUrl.value, false)
  }

  // Watch for route changes
  watch(currentUrl, async (newUrl, oldUrl) => {
    if (newUrl !== oldUrl) {
      // Check cache first for new URL
      const cachedData = getCachedStats(newUrl)

      if (cachedData) {
        stats.value = cachedData
        isLoading.value = false

        // Refresh in background
        fetchStats(newUrl, true)
      } else {
        // No cache, fetch fresh data
        await fetchStats(newUrl, false)
      }
    }
  })

  onMounted(async () => {
    const url = currentUrl.value

    // Try to load from cache first
    const cachedData = getCachedStats(url)

    if (cachedData) {
      stats.value = cachedData
      isLoading.value = false

      // Refresh in background after using cache
      fetchStats(url, true)
    } else {
      // No cache, fetch fresh data
      await fetchStats(url, false)
    }
  })

  return {
    // Data
    stats: readonly(stats),
    pageViews,
    totalSiteViews,
    totalSiteVisitors,

    // State
    isLoading: readonly(isLoading),
    error: readonly(error),
    hasData,
    hasStaleData: readonly(hasStaleData),

    // Methods
    refreshStats,

    // Current URL being tracked
    currentUrl: readonly(currentUrl)
  }
}
