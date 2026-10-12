import { describe, it, expect } from 'vitest'
import {
  beliefShortLabel,
  beliefSignedConfidence,
  buildBeliefRows,
} from '../beliefTimeline'

const MAMDANI = {
  slug: 'zohran-mamdani-nyc-mayor-2025',
  statement:
    'Zohran Mamdani will win the 2025 NYC mayoral election by a margin greater than 5%',
  confidence: 80,
  created: '2025-01-20T19:50:00.000Z',
  deadline: '2025-11-30T00:00:00.000Z',
  resolved: true,
  resolved_date: '2025-11-09T00:00:00.000Z',
  status: 'correct',
  updates: [
    {
      timestamp: '2025-11-01T16:35:00.000Z',
      confidenceBefore: 25,
      confidenceAfter: 80,
      reasoning: 'Ground game',
    },
  ],
}

describe('beliefSignedConfidence', () => {
  // `confidence` is overwritten on update; the signed number is what the
  // record must show, or the chart quietly rewrites history
  it('reads the first update’s confidenceBefore, not current confidence', () => {
    expect(beliefSignedConfidence(MAMDANI)).toBe(25)
  })

  it('uses the earliest update even if listed out of order', () => {
    expect(
      beliefSignedConfidence({
        ...MAMDANI,
        updates: [
          {
            timestamp: '2025-11-01',
            confidenceBefore: 40,
            confidenceAfter: 80,
          },
          {
            timestamp: '2025-06-01',
            confidenceBefore: 25,
            confidenceAfter: 40,
          },
        ],
      })
    ).toBe(25)
  })

  it('falls back to confidence with no updates', () => {
    expect(beliefSignedConfidence({ ...MAMDANI, updates: [] })).toBe(80)
  })
})

describe('beliefShortLabel', () => {
  it('cuts long statements at a word boundary', () => {
    const l = beliefShortLabel(MAMDANI.statement)
    expect(l.endsWith('…')).toBe(true)
    expect(l.length).toBeLessThanOrEqual(33)
    expect(MAMDANI.statement.startsWith(l.slice(0, -1))).toBe(true)
  })

  it('leaves short statements alone', () => {
    expect(beliefShortLabel('Vance not GOP nominee')).toBe(
      'Vance not GOP nominee'
    )
  })
})

describe('buildBeliefRows', () => {
  const open = {
    slug: 'open-one',
    statement: 'Open',
    confidence: 60,
    created: '2025-01-20',
    deadline: '2027-12-31',
  }
  const wrong = {
    slug: 'wrong-one',
    statement: 'Wrong',
    confidence: 65,
    created: '2025-01-20',
    deadline: '2025-12-31',
    resolved: true,
    resolved_date: '2026-03-24',
    status: 'incorrect',
  }

  it('orders resolved by resolution date, then open by deadline', () => {
    const rows = buildBeliefRows([open, wrong, MAMDANI])
    expect(rows.map((r) => r.slug)).toEqual([
      MAMDANI.slug,
      'wrong-one',
      'open-one',
    ])
    expect(rows.map((r) => r.status)).toEqual(['correct', 'incorrect', 'open'])
  })

  it('keeps the update trail', () => {
    const [m] = buildBeliefRows([MAMDANI])
    expect(m.signed).toBe(25)
    expect(m.updates).toEqual([
      {
        t: Date.parse('2025-11-01T16:35:00.000Z'),
        before: 25,
        after: 80,
        reasoning: 'Ground game',
      },
    ])
  })

  it('drops rows with no plottable dates', () => {
    expect(buildBeliefRows([{ ...open, deadline: undefined }])).toEqual([])
  })
})
