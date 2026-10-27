/**
 * @file notConfigured.ts
 * @description Quiet "credential not set" handling for the vendor stats
 *   handlers (server/api/{github,lastfm,chess,monkeytype,…}.get.ts) and the
 *   /api/stats aggregator that fans out to them.
 *
 * Missing credentials are expected in local dev (the real keys live in the VPS
 * .env), so they shouldn't read like an outage. Log ONE quiet line per service
 * per process, and tag the error so the /api/stats aggregator can skip it.
 */
const warned = new Set<string>()

export function warnNotConfigured(service: string, what: string): void {
  if (warned.has(service)) return
  warned.add(service)
  console.warn(`[${service}] ${what} not set, skipping`)
}

/** A 503 H3Error tagged `data.notConfigured`, for a handler to throw. */
export function notConfigured(service: string, what: string) {
  warnNotConfigured(service, what)
  return createError({
    statusCode: 503,
    message: `${service}: ${what} not configured`,
    data: { notConfigured: true },
  })
}

export function isNotConfigured(err: unknown): boolean {
  const e = err as { data?: { notConfigured?: boolean } } | null
  return e?.data?.notConfigured === true
}

/** Log a sub-handler failure, unless it's just missing config (already warned). */
export function logStatsError(label: string, err: unknown): void {
  if (isNotConfigured(err)) return
  console.error(`❌ ${label} error:`, err)
}
