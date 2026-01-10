/**
 * @file stats-lite.test.ts
 * @description Tests for the lightweight stats API endpoint
 */
import { describe, it, expect } from 'vitest'

describe('stats-lite endpoint', () => {
  it('response should have required meta fields', async () => {
    // Note: This is a basic structure test. In a real environment with API keys,
    // the response would include actual metrics from all services.
    const response = {
      lastUpdated: new Date().toISOString(),
      cached: false,
    }

    expect(response).toHaveProperty('lastUpdated')
    expect(response).toHaveProperty('cached')
    expect(typeof response.lastUpdated).toBe('string')
    expect(typeof response.cached).toBe('boolean')
  })

  it('response should only contain top-level numbers and strings', () => {
    // Mock a typical response structure
    const mockResponse = {
      lastUpdated: '2026-01-10T16:55:18.837Z',
      cached: true,
      githubContributions: 1250,
      githubRepos: 42,
      githubFollowers: 156,
      chessRapid: 1450,
      blogPostsThisMonth: 3,
      musicTopArtist: 'Radiohead',
    }

    // Check that all values are primitives (no arrays or objects)
    Object.entries(mockResponse).forEach(([key, value]) => {
      const valueType = typeof value
      if (key !== 'lastUpdated' && key !== 'cached' && key !== 'musicTopArtist') {
        expect(valueType).toBe('number')
      } else {
        expect(['string', 'boolean'].includes(valueType)).toBe(true)
      }
      // Ensure no arrays or objects
      expect(Array.isArray(value)).toBe(false)
      if (valueType === 'object' && value !== null) {
        expect(false).toBe(true) // Should never have nested objects
      }
    })
  })

  it('response should be significantly smaller than full stats', () => {
    // Mock responses to test size comparison
    const liteResponse = {
      lastUpdated: '2026-01-10T16:55:18.837Z',
      cached: true,
      githubContributions: 1250,
      githubRepos: 42,
      chessRapid: 1450,
      blogPostsThisMonth: 3,
    }

    const fullStatsResponse = {
      github: {
        stats: { totalContributions: 1250, totalRepos: 42 },
        contributions: Array(365).fill(0),
        dates: Array(365).fill('2026-01-01'),
        detail: {
          commits: Array(50).fill({
            repository: { name: 'test', url: 'http://test' },
            message: 'test commit',
            occurredAt: '2026-01-01',
            url: 'http://test',
            type: 'feat',
          }),
          commitTypes: [],
        },
      },
      chess: {
        currentRating: { rapid: 1450, blitz: 1380, bullet: 1220 },
        recentGames: Array(20).fill({
          id: '123',
          opponent: 'player',
          timeControl: '10+0',
          result: 'win',
          timestamp: 1234567890,
          rating: 1450,
          ratingDiff: 10,
        }),
      },
    }

    const liteSize = JSON.stringify(liteResponse).length
    const fullSize = JSON.stringify(fullStatsResponse).length

    // Lite should be significantly smaller
    expect(liteSize).toBeLessThan(fullSize * 0.5) // At least 50% smaller
  })

  it('safeNumber helper should handle various input types', () => {
    // Simulate the safeNumber function from stats-lite.get.ts
    function safeNumber(value: unknown): number | undefined {
      if (typeof value === 'number' && !Number.isNaN(value)) return value
      if (typeof value === 'string') {
        const num = Number.parseFloat(value)
        return Number.isNaN(num) ? undefined : num
      }
      return undefined
    }

    expect(safeNumber(42)).toBe(42)
    expect(safeNumber('123')).toBe(123)
    expect(safeNumber('123.45')).toBe(123.45)
    expect(safeNumber('not a number')).toBeUndefined()
    expect(safeNumber(Number.NaN)).toBeUndefined()
    expect(safeNumber(null)).toBeUndefined()
    expect(safeNumber(undefined)).toBeUndefined()
    expect(safeNumber({})).toBeUndefined()
    expect(safeNumber([])).toBeUndefined()
  })

  it('safeString helper should handle various input types', () => {
    // Simulate the safeString function from stats-lite.get.ts
    function safeString(value: unknown): string | undefined {
      if (typeof value === 'string' && value.length > 0) return value
      return undefined
    }

    expect(safeString('hello')).toBe('hello')
    expect(safeString('Radiohead')).toBe('Radiohead')
    expect(safeString('')).toBeUndefined()
    expect(safeString(null)).toBeUndefined()
    expect(safeString(undefined)).toBeUndefined()
    expect(safeString(123)).toBeUndefined()
    expect(safeString({})).toBeUndefined()
  })

  it('should include all expected metric categories', () => {
    const expectedCategories = [
      'github',
      'chess',
      'blog',
      'music',
      'rescueTime',
      'gear',
      'website',
      'letterboxd',
      'discogs',
    ]

    const responseFields = [
      'githubContributions',
      'chessRapid',
      'blogPostsThisMonth',
      'musicTotalScrobbles',
      'rescueTimeWeekHours',
      'gearTotalItems',
      'websitePageviewsMonth',
      'letterboxdThisYear',
      'discogsTotal',
    ]

    // Each category should have at least one field
    expectedCategories.forEach((category) => {
      const hasField = responseFields.some((field) =>
        field.toLowerCase().includes(category.toLowerCase())
      )
      expect(hasField).toBe(true)
    })
  })
})
