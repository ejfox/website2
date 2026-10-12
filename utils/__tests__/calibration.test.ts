import { describe, it, expect } from 'vitest'
import { findCalibrationBucket } from '../calibration'
import analysis from '../../data/calibration-analysis.json'

const b = (min: number, max: number) => ({
  min,
  max,
  label: `${min}-${max}%`,
  count: 1,
  accuracy: 100,
  expected: Math.round((min + max) / 2),
  delta: 0,
})

const buckets = [b(20, 29), b(50, 59), b(60, 69), b(70, 79), b(90, 100)]

describe('findCalibrationBucket', () => {
  it('puts a 65% call in 60-69%, not the 50-59% bucket listed before it', () => {
    expect(findCalibrationBucket(buckets, 65)?.label).toBe('60-69%')
  })

  it('treats min and max as inclusive', () => {
    expect(findCalibrationBucket(buckets, 60)?.label).toBe('60-69%')
    expect(findCalibrationBucket(buckets, 69)?.label).toBe('60-69%')
    expect(findCalibrationBucket(buckets, 100)?.label).toBe('90-100%')
  })

  it('returns null when no bucket holds the confidence', () => {
    expect(findCalibrationBucket(buckets, 85)).toBeNull()
    expect(findCalibrationBucket(buckets, 40)).toBeNull()
  })

  it('returns null on missing input', () => {
    expect(findCalibrationBucket(null, 65)).toBeNull()
    expect(findCalibrationBucket(buckets, undefined)).toBeNull()
  })

  it('works on the generated analysis file', () => {
    const hit = findCalibrationBucket(
      analysis.calibration_as_updated as never,
      65
    )
    if (hit) expect(hit.min <= 65 && hit.max >= 65).toBe(true)
  })
})
