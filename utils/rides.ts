/**
 * @file rides.ts
 * @description Unit formatting shared by /rides and /rides/[slug]. Inputs are
 * the SI units the ride JSON stores (meters, m/s, seconds).
 *
 * The exports carry a `ride` prefix because everything in utils/ is
 * auto-imported site-wide, and bare `mi`/`ft`/`duration` globals would be a
 * trap. The pages import them under their short local names.
 */

/** meters → kilometers, one decimal: 12345 → "12.3" */
export const rideKm = (m: number) => (m / 1000).toFixed(1)

/** meters → miles, one decimal: 16093.4 → "10.0" */
export const rideMi = (m: number) => (m / 1609.34).toFixed(1)

/** meters → whole feet: 100 → 328 */
export const rideFt = (m: number) => Math.round(m * 3.28084)

/** m/s → whole mph: 10 → 22 */
export const rideMph = (mps: number) => Math.round(mps * 2.237)

/** seconds → "1h05m" (hours unpadded, minutes padded to two digits) */
export const rideDuration = (s: number) =>
  `${Math.floor(s / 3600)}h${String(Math.floor((s % 3600) / 60)).padStart(2, '0')}m`
