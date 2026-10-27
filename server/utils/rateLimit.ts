/**
 * @file rateLimit.ts
 * @description Fixed-window, in-memory request counter per client key. Used by
 *   server/api/suggest.get.ts. Per process: resets on pm2 reload, which is fine
 *   for a single-process site. clientIp() prefers Cloudflare's
 *   cf-connecting-ip (prod traffic arrives through the tunnel) and falls back
 *   to the socket address.
 */
import { getRequestHeader, type H3Event } from 'h3'

export function clientIp(event: H3Event): string {
  return (
    getRequestHeader(event, 'cf-connecting-ip')?.trim() ||
    event.node.req.socket?.remoteAddress ||
    'unknown'
  )
}

/**
 * Returns a `hit(key)` that is true while `key` is within `limit` requests per
 * `windowMs`, false once it is over.
 */
export function createRateLimiter(
  limit: number,
  windowMs: number,
  now: () => number = Date.now
) {
  const windows = new Map<string, { count: number; resetAt: number }>()

  return function hit(key: string): boolean {
    const t = now()
    // Drop expired windows so the map only holds recently active clients.
    if (windows.size > 1000) {
      for (const [k, w] of windows) if (w.resetAt <= t) windows.delete(k)
    }
    const w = windows.get(key)
    if (!w || w.resetAt <= t) {
      windows.set(key, { count: 1, resetAt: t + windowMs })
      return true
    }
    w.count++
    return w.count <= limit
  }
}
