import { describe, it, expect } from 'vitest'
import { changedSections, isNewer } from '../../composables/useLiveStats'

const base = {
  generated: '2026-10-20T16:00:00.000Z',
  github: { stats: { totalCommits: 100 } },
  chess: { currentRating: { blitz: 1200 } },
  lastfm: { recentTracks: { tracks: [{ name: 'a' }] } },
  blog: { totalPosts: 10 },
}

describe('changedSections', () => {
  it('reports nothing for identical data', () => {
    expect(changedSections(base, structuredClone(base))).toEqual([])
  })
  it('flags the section and top-stats when a top-line source changes', () => {
    const next = structuredClone(base)
    next.github.stats.totalCommits = 101
    expect(changedSections(base, next)).toEqual(['top-stats', 'github'])
  })
  it('flags only the section for sources not in the top row', () => {
    const next = structuredClone(base)
    next.lastfm.recentTracks.tracks[0].name = 'b'
    expect(changedSections(base, next)).toEqual(['music'])
  })
  it('ignores bookkeeping keys like generated', () => {
    expect(
      changedSections(base, { ...base, generated: '2026-10-20T16:05:00Z' })
    ).toEqual([])
  })
  it('handles missing payloads', () => {
    expect(changedSections(null, base)).toEqual([])
  })
})

describe('isNewer', () => {
  it('compares ISO timestamps', () => {
    expect(isNewer('2026-10-20T16:00:00Z', '2026-10-20T16:05:00Z')).toBe(true)
    expect(isNewer('2026-10-20T16:05:00Z', '2026-10-20T16:00:00Z')).toBe(false)
    expect(isNewer('2026-10-20T16:00:00Z', '2026-10-20T16:00:00Z')).toBe(false)
    expect(isNewer(null, '2026-10-20T16:00:00Z')).toBe(true)
    expect(isNewer('2026-10-20T16:00:00Z', undefined)).toBe(false)
  })
})
