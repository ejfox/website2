import { describe, it, expect } from 'vitest'
import { createPingLimiter } from '../pingLimit'

const T0 = Date.parse('2026-10-21T12:00:00Z')
const MIN = 60 * 1000

describe('ping rate limits', () => {
  it('lets a first ping through, then makes the same visitor wait 10 minutes', () => {
    const l = createPingLimiter()
    expect(l.check('a', T0).ok).toBe(true)
    l.record('a', T0)
    const blocked = l.check('a', T0 + 5 * MIN)
    expect(blocked.ok).toBe(false)
    if (!blocked.ok) expect(blocked.retryAfterSec).toBe(5 * 60)
    expect(l.check('a', T0 + 10 * MIN).ok).toBe(true)
  })

  it('caps one visitor at 3 a day', () => {
    const l = createPingLimiter()
    for (let i = 0; i < 3; i++) l.record('a', T0 + i * 11 * MIN)
    expect(l.check('a', T0 + 60 * MIN).ok).toBe(false)
    expect(l.check('a', T0 + 25 * 60 * MIN).ok).toBe(true)
  })

  it('caps everyone together at 10 an hour', () => {
    const l = createPingLimiter()
    for (let i = 0; i < 10; i++) l.record(`v${i}`, T0 + i * MIN)
    const r = l.check('new', T0 + 15 * MIN)
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.scope).toBe('global')
    expect(l.check('new', T0 + 61 * MIN).ok).toBe(true)
  })

  it('caps everyone together at 40 a day', () => {
    const l = createPingLimiter()
    for (let i = 0; i < 40; i++) l.record(`v${i}`, T0 + i * 7 * MIN)
    expect(l.check('new', T0 + 40 * 7 * MIN).ok).toBe(false)
  })
})
