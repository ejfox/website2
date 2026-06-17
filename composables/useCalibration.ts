/**
 * Calibration Analysis Composable
 *
 * Fetches meta-analysis data for prediction performance
 */

export const useCalibration = () => {
  const { data, pending, error, refresh } = useFetch('/api/calibration', {
    key: 'calibration-analysis',
    dedupe: 'defer',
  })

  return {
    data,
    pending,
    error,
    refresh,
  }
}
