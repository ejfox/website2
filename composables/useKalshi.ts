/**
 * @file useKalshi.ts
 * @description Fetches Kalshi prediction market portfolio data with caching
 * @returns { data, pending, error, refresh } - Kalshi portfolio state
 */
export const useKalshi = () => {
  const { data, pending, error, refresh } = useFetch('/api/kalshi', {
    // Cache for 5 minutes client-side
    key: 'kalshi-data',
    // Dedupe requests
    dedupe: 'defer',
  })

  return {
    data,
    pending,
    error,
    refresh,
  }
}
