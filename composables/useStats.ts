/**
 * @file useStats.ts
 * @description Stats aggregation composable for fetching and computing personal metrics
 * @returns Stats data, loading states, and computed time breakdowns
 */
import { shallowRef, computed } from 'vue'

import type { StatsResponse } from '~/types/stats'

const STATS_CACHE_KEY = 'stats-swr-v1'

/**
 * @param options Fetch options
 * @param options.server Fetch during SSR. /stats passes true: /api/stats is a cached
 *   swr handler (~60ms warm), and rendering it server-side stops the whole
 *   page popping in after hydration (Lighthouse CLS 0.87 → ~0). Default
 *   false, because /gists is PRERENDERED on CI, where there are no API
 *   secrets: a server fetch would bake empty stats into its static HTML.
 */
export function useStats(options: { server?: boolean } = {}) {
  const server = options.server ?? false
  // Stale-while-revalidate: seed from the last successful payload
  // (sessionStorage) so repeat visits paint real numbers instantly while the
  // slow aggregate refreshes in the background.
  const readCache = (): StatsResponse | null => {
    if (import.meta.server) return null
    try {
      const raw = sessionStorage.getItem(STATS_CACHE_KEY)
      return raw ? JSON.parse(raw) : null
    } catch {
      return null
    }
  }

  const {
    data: stats,
    status,
    error,
  } = useFetch<StatsResponse>('/api/stats', {
    lazy: true,
    server,
    default: () => readCache(),
  })

  // Lite stats (~345 bytes, 5-min server cache): lands in tens of ms, so the
  // skeletons can show real top-line numbers while the full aggregate loads.
  const { data: liteStats } = useFetch<Record<string, number | string>>(
    '/api/stats-lite',
    { lazy: true, server: false }
  )

  const hasStaleData = shallowRef(!!readCache())

  watch(stats, (value) => {
    if (import.meta.server || !value) return
    if (status.value === 'success') hasStaleData.value = false
    try {
      sessionStorage.setItem(STATS_CACHE_KEY, JSON.stringify(value))
    } catch {
      // quota/private-mode — cache is a nicety, not a requirement
    }
  })

  // Derived states — "loading" only when we have nothing at all to show;
  // with a stale seed the page renders content and refreshes silently.
  const isLoading = computed(() => status.value === 'pending' && !stats.value)
  const errors = computed(() => ({ fetch: !!error.value && !stats.value }))

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
    liteStats,
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
