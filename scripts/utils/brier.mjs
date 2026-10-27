/**
 * @file utils/brier.mjs
 * @description Brier + calibration math for `yarn calibrate`
 *   (scripts/meta/calibration-analysis.mjs) and utils/calibration.ts, on two bases:
 *
 * - as signed:  the confidence each prediction was published (and hashed) with
 * - as updated: the last logged change, i.e. the current top-level `confidence`
 *
 * `confidence` in frontmatter is overwritten on update, so the signed number is
 * the first update's `confidenceBefore` — beliefSignedConfidence owns that rule.
 *
 * "Signed" is the house name for "as first committed": predictions are not
 * PGP-signed (CLAUDE.md, Predictions). Buckets are integer ranges, so a
 * fractional confidence like 9.5 falls between two and is not counted.
 */

import { beliefSignedConfidence } from '../../utils/beliefTimeline.ts'

export const asSigned = (p) => beliefSignedConfidence(p)
export const asUpdated = (p) => p.confidence

export const BASES = { as_signed: asSigned, as_updated: asUpdated }

export const isScorable = (p) =>
  Boolean(p.resolved) &&
  (p.status === 'correct' || p.status === 'incorrect') &&
  typeof p.confidence === 'number'

/** Mean of (p - outcome)^2. 0 = perfect, 0.25 = always saying 50%, 1 = worst */
export function brierScore(predictions, confOf = asUpdated) {
  const resolved = predictions.filter(isScorable)
  if (resolved.length === 0) return null
  const total = resolved.reduce((sum, p) => {
    const outcome = p.status === 'correct' ? 1 : 0
    return sum + (confOf(p) / 100 - outcome) ** 2
  }, 0)
  return total / resolved.length
}

// Down to 0: a signed 25% has to land somewhere, or the as-signed table drops
// exactly the predictions that moved the most
export const BUCKETS = [
  { min: 0, max: 9, label: '0-9%' },
  { min: 10, max: 19, label: '10-19%' },
  { min: 20, max: 29, label: '20-29%' },
  { min: 30, max: 39, label: '30-39%' },
  { min: 40, max: 49, label: '40-49%' },
  { min: 50, max: 59, label: '50-59%' },
  { min: 60, max: 69, label: '60-69%' },
  { min: 70, max: 79, label: '70-79%' },
  { min: 80, max: 89, label: '80-89%' },
  { min: 90, max: 100, label: '90-100%' },
]

/** "When I say 70%, does it happen ~70% of the time?" Empty buckets omitted */
export function calibrationBuckets(predictions, confOf = asUpdated) {
  const resolved = predictions.filter(isScorable)
  return BUCKETS.map((bucket) => {
    const inBucket = resolved.filter((p) => {
      const c = confOf(p)
      return c >= bucket.min && c <= bucket.max
    })
    if (inBucket.length === 0) return null

    const correct = inBucket.filter((p) => p.status === 'correct').length
    const accuracy = correct / inBucket.length
    const expectedMidpoint = (bucket.min + bucket.max) / 2 / 100

    return {
      ...bucket,
      count: inBucket.length,
      correct,
      accuracy: Math.round(accuracy * 100),
      expected: Math.round(expectedMidpoint * 100),
      delta: Math.round((accuracy - expectedMidpoint) * 100),
    }
  }).filter(Boolean)
}

export const round3 = (n) =>
  typeof n === 'number' ? Math.round(n * 1000) / 1000 : null
