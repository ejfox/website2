/**
 * Rate limits for /api/ping (anyone can buzz EJ's phone, so this is the whole
 * safety story). In-memory on purpose: website2 is one pm2 process, and a
 * restart forgetting the counters is fine. Pure, so it's unit-testable.
 *
 * Per visitor (a daily-salted IP hash): 1 ping per 10 minutes, 3 per day.
 * Everyone together: 10 per hour, 40 per day.
 */
export const PING_LIMITS = {
  perVisitorGapMs: 10 * 60 * 1000,
  perVisitorPerDay: 3,
  globalPerHour: 10,
  globalPerDay: 40,
}

const HOUR = 60 * 60 * 1000
const DAY = 24 * HOUR

export interface PingLimiter {
  check(
    visitor: string,
    now?: number
  ):
    | { ok: true }
    | { ok: false; retryAfterSec: number; scope: 'visitor' | 'global' }
  record(visitor: string, now?: number): void
}

export function createPingLimiter(limits = PING_LIMITS): PingLimiter {
  const byVisitor = new Map<string, number[]>()
  let all: number[] = []

  const prune = (now: number) => {
    all = all.filter((t) => now - t < DAY)
    for (const [k, ts] of byVisitor) {
      const kept = ts.filter((t) => now - t < DAY)
      if (kept.length) byVisitor.set(k, kept)
      else byVisitor.delete(k)
    }
  }

  return {
    check(visitor, now = Date.now()) {
      prune(now)
      const mine = byVisitor.get(visitor) || []
      const last = mine[mine.length - 1]
      if (last !== undefined && now - last < limits.perVisitorGapMs)
        return {
          ok: false,
          retryAfterSec: Math.ceil(
            (limits.perVisitorGapMs - (now - last)) / 1000
          ),
          scope: 'visitor',
        }
      if (mine.length >= limits.perVisitorPerDay)
        return {
          ok: false,
          retryAfterSec: Math.ceil((DAY - (now - mine[0])) / 1000),
          scope: 'visitor',
        }
      const lastHour = all.filter((t) => now - t < HOUR)
      if (lastHour.length >= limits.globalPerHour)
        return {
          ok: false,
          retryAfterSec: Math.ceil((HOUR - (now - lastHour[0])) / 1000),
          scope: 'global',
        }
      if (all.length >= limits.globalPerDay)
        return {
          ok: false,
          retryAfterSec: Math.ceil((DAY - (now - all[0])) / 1000),
          scope: 'global',
        }
      return { ok: true }
    },
    record(visitor, now = Date.now()) {
      byVisitor.set(visitor, [...(byVisitor.get(visitor) || []), now])
      all.push(now)
    },
  }
}
