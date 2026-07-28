/**
 * @file useStats.ts
 * @description Stats aggregation composable for fetching and computing personal metrics
 * @returns Stats data, loading states, and computed time breakdowns
 */
import { shallowRef, computed } from 'vue'

import type { StatsResponse } from '~/types/stats'

export function useStats() {
  // Use Nuxt's useFetch for SSR + caching + automatic error handling
  // PERF: lazy: true prevents blocking SSR - page renders immediately, stats load after
  const {
    data: stats,
    status,
    error,
  } = useFetch<StatsResponse>('/api/stats', {
    lazy: true,
    server: false, // Don't fetch during SSR - stats API calls external services
  })

  // Derived states
  const isLoading = computed(() => status.value === 'pending')
  const errors = computed(() => ({ fetch: !!error.value }))
  const hasStaleData = shallowRef(false)

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
  const hasDiscogsData = computed(() => !!stats.value?.discogs?.stats)
  const hasGoodreadsData = computed(() => !!stats.value?.goodreads?.stats)

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
    hasLastFmData,
    hasDiscogsData,
    hasGoodreadsData,
  }
}
