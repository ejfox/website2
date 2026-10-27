import { describe, expect, it } from 'vitest'
import { createRateLimiter } from '../rateLimit'

describe('createRateLimiter', () => {
  it('allows `limit` hits per window, per key, then resets', () => {
    let t = 0
    const hit = createRateLimiter(3, 1000, () => t)
    expect([hit('a'), hit('a'), hit('a'), hit('a')]).toEqual([
      true,
      true,
      true,
      false,
    ])
    expect(hit('b')).toBe(true)
    t = 999
    expect(hit('a')).toBe(false)
    t = 1000
    expect(hit('a')).toBe(true)
  })
})
