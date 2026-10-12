/**
 * Calibration helpers for prediction pages. The buckets come from
 * data/calibration-analysis.json (scripts/utils/brier.mjs), each with an
 * inclusive `min`/`max`.
 */

export interface CalibrationBucket {
  min: number
  max: number
  label: string
  count: number
  correct?: number
  accuracy: number
  expected: number
  delta: number
}

/**
 * The bucket a confidence falls in, by its own min/max. A 65% call belongs to
 * 60-69%, never to 50-59% (the old "first bucket within ±10 of the midpoint"
 * lookup picked 50-59% because it came first)
 */
export function findCalibrationBucket(
  buckets: CalibrationBucket[] | null | undefined,
  confidence: number | null | undefined
): CalibrationBucket | null {
  if (!Array.isArray(buckets) || typeof confidence !== 'number') return null
  return buckets.find((b) => confidence >= b.min && confidence <= b.max) ?? null
}
