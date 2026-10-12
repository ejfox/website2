import { describe, it, expect } from 'vitest'
import {
  asSigned,
  asUpdated,
  brierScore,
  calibrationBuckets,
  round3,
} from '../brier.mjs'

// The four resolved predictions as of 2026-10, reduced to what scoring reads
const MAMDANI = {
  slug: 'zohran-mamdani-nyc-mayor-2025',
  confidence: 80,
  resolved: true,
  status: 'correct',
  updates: [
    {
      timestamp: '2025-11-01T16:35:00.000Z',
      confidenceBefore: 25,
      confidenceAfter: 80,
    },
  ],
}
const RESOLVED = [
  MAMDANI,
  { confidence: 55, resolved: true, status: 'correct' },
  { confidence: 65, resolved: true, status: 'incorrect' },
  { confidence: 75, resolved: true, status: 'correct' },
]

describe('confidence bases', () => {
  it('as signed reads the first update’s confidenceBefore', () => {
    expect(asSigned(MAMDANI)).toBe(25)
    expect(asUpdated(MAMDANI)).toBe(80)
  })

  it('both bases agree when a prediction was never updated', () => {
    expect(asSigned(RESOLVED[1])).toBe(55)
    expect(asUpdated(RESOLVED[1])).toBe(55)
  })
})

describe('brierScore', () => {
  it('scores one updated prediction differently per basis', () => {
    expect(brierScore([MAMDANI], asSigned)).toBeCloseTo(0.5625, 10)
    expect(brierScore([MAMDANI], asUpdated)).toBeCloseTo(0.04, 10)
  })

  it('averages across resolved predictions on each basis', () => {
    // (0.75² + 0.45² + 0.65² + 0.25²) / 4
    expect(brierScore(RESOLVED, asSigned)).toBeCloseTo(0.3125, 10)
    // (0.2² + 0.45² + 0.65² + 0.25²) / 4
    expect(brierScore(RESOLVED, asUpdated)).toBeCloseTo(0.181875, 10)
    expect(round3(brierScore(RESOLVED, asSigned))).toBe(0.313)
    expect(round3(brierScore(RESOLVED, asUpdated))).toBe(0.182)
  })

  it('defaults to as updated', () => {
    expect(brierScore(RESOLVED)).toBe(brierScore(RESOLVED, asUpdated))
  })

  it('ignores open, unresolved-status and confidence-less predictions', () => {
    const noise = [
      { confidence: 90, resolved: false },
      { confidence: 90, resolved: true, status: 'annulled' },
      { resolved: true, status: 'correct' },
    ]
    expect(brierScore([...RESOLVED, ...noise], asSigned)).toBeCloseTo(0.3125)
    expect(brierScore(noise, asSigned)).toBeNull()
  })

  it('keeps a perfect 0 as 0, not null', () => {
    const perfect = [{ confidence: 100, resolved: true, status: 'correct' }]
    expect(brierScore(perfect)).toBe(0)
    expect(round3(brierScore(perfect))).toBe(0)
  })
})

describe('calibrationBuckets', () => {
  it('buckets a signed 25% instead of dropping it', () => {
    const signed = calibrationBuckets(RESOLVED, asSigned)
    expect(signed.map((b) => b.label)).toEqual([
      '20-29%',
      '50-59%',
      '60-69%',
      '70-79%',
    ])
    expect(signed[0]).toMatchObject({ count: 1, accuracy: 100, delta: 76 })
  })

  it('puts the same prediction at 80-89% as updated', () => {
    const updated = calibrationBuckets(RESOLVED, asUpdated)
    expect(updated.map((b) => b.label)).toEqual([
      '50-59%',
      '60-69%',
      '70-79%',
      '80-89%',
    ])
    expect(updated.reduce((n, b) => n + b.count, 0)).toBe(4)
  })
})
