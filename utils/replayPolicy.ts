/**
 * @file replayPolicy.ts
 * @description When to load Umami's session-replay recorder (rrweb, ~190 KB).
 * Pure functions so they're testable; the caller is plugins/umami.client.js.
 *
 * Recording every visit cost real main-thread time: Lighthouse measured
 * recorder.js at 0.24s on /, 0.9s on /blog and 1.6s on /stats (mobile).
 * EJ watches replays of engaged readers and of the consulting funnel, and
 * rarely anything else (2026-10-20), so:
 *
 * - funnel pages record right away, as before;
 * - everywhere else recording is earned: it loads on the first sign of real
 *   reading (scroll past 25%, a click/key, or 15s of visible time), so
 *   bounces, bots and Lighthouse never pay for it;
 * - outside the funnel, data-saver mode and 2G connections are skipped.
 *
 * Pageviews, Web Vitals and Umami events are unaffected; only recorder.js
 * moves. Sampling itself still lives in the Umami DB (replay_config).
 */

/** Consulting funnel: pages where a replay is worth having for every visit. */
export const FUNNEL_PATHS = [
  '/consulting',
  '/process',
  '/calendar',
  '/ff',
  '/case-study',
]

export function isFunnelPath(path: string): boolean {
  const p = path.replace(/\/+$/, '') || '/'
  return FUNNEL_PATHS.some((f) => p === f || p.startsWith(f + '/'))
}

interface NavigatorLike {
  connection?: { saveData?: boolean; effectiveType?: string }
}

/** False when the visitor asked to save data or is on a 2G-class link. */
export function deviceAllowsReplay(nav: NavigatorLike): boolean {
  const c = nav?.connection
  if (c?.saveData) return false
  if (/(?:^|-)2g$/.test(c?.effectiveType || '')) return false
  return true
}

/** Share of the page scrolled past, 0–1. Short pages count as fully read. */
export function scrollFraction(
  scrollY: number,
  viewport: number,
  docHeight: number
): number {
  const max = docHeight - viewport
  return max <= 0 ? 1 : Math.min(1, Math.max(0, scrollY / max))
}

export const ENGAGED_SCROLL = 0.25
export const ENGAGED_MS = 15_000
