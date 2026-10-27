/**
 * @file useCalibration.ts
 * @description useFetch wrapper for /api/calibration (prediction calibration
 *   / Brier analysis). Shared key 'calibration-analysis' so the predictions
 *   index and [slug] pages reuse one payload.
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
