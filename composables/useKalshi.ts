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
