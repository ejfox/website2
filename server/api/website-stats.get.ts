/**
 * @file website-stats.get.ts
 * @description Site-wide Umami stats for ejfox.com, read straight from the
 * co-located Umami Postgres (the HTTP API creds were stale — same reason
 * reach.get.ts reads the DB). Returns last-30-days totals with the previous
 * 30 days as `prev`, in the shape components/stats/UmamiStats.vue expects.
 * @endpoint GET /api/website-stats
 */
import { Pool } from 'pg'

const EJFOX_WEBSITE_ID = '165590cb-c361-4ad8-9459-6c6390744c64' // ejfox.com
const SHARE_URL =
  'https://umami.tools.ejfox.com/share/dWCg9vByZmweX6qa/ejfox.com'

let pool: Pool | null = null
function getPool(): Pool | null {
  if (pool) return pool
  const connectionString = process.env.UMAMI_DATABASE_URL
  if (!connectionString) return null
  pool = new Pool({ connectionString, max: 2, idleTimeoutMillis: 30_000 })
  return pool
}

interface Metrics {
  pageviews: number
  visitors: number
  visits: number
  bounces: number
  totaltime: number
}

// Mirrors Umami v2's own getWebsiteStats math: aggregate pageviews per
// (session, visit), then a single-pageview visit counts as a bounce and the
// per-visit dwell time (max-min created_at, in seconds) sums to totaltime.
async function summarize(db: Pool, start: Date, end: Date): Promise<Metrics> {
  const { rows } = await db.query(
    `SELECT
       COALESCE(SUM(t.c), 0)::int                                 AS pageviews,
       COUNT(DISTINCT t.session_id)::int                          AS visitors,
       COUNT(DISTINCT t.visit_id)::int                            AS visits,
       COALESCE(SUM(CASE WHEN t.c = 1 THEN 1 ELSE 0 END), 0)::int AS bounces,
       COALESCE(SUM(t.time), 0)::int                              AS totaltime
     FROM (
       SELECT session_id,
              visit_id,
              COUNT(*) AS c,
              EXTRACT(EPOCH FROM MAX(created_at) - MIN(created_at)) AS time
         FROM website_event
        WHERE website_id = $1
          AND event_type = 1
          AND created_at >= $2
          AND created_at < $3
        GROUP BY session_id, visit_id
     ) t`,
    [EJFOX_WEBSITE_ID, start, end]
  )
  const r = rows[0] || {}
  return {
    pageviews: r.pageviews ?? 0,
    visitors: r.visitors ?? 0,
    visits: r.visits ?? 0,
    bounces: r.bounces ?? 0,
    totaltime: r.totaltime ?? 0,
  }
}

export default defineEventHandler(async () => {
  const db = getPool()
  if (!db) {
    console.error('Website stats: UMAMI_DATABASE_URL not set')
    return { error: 'UMAMI_DATABASE_URL not set', stats: null }
  }

  try {
    const now = Date.now()
    const day = 24 * 60 * 60 * 1000
    const curStart = new Date(now - 30 * day)
    const prevStart = new Date(now - 60 * day)

    const [current, previous] = await Promise.all([
      summarize(db, curStart, new Date(now)),
      summarize(db, prevStart, curStart),
    ])

    // Shape expected by UmamiStats.vue: each metric is { value, prev }.
    const withPrev = (key: keyof Metrics) => ({
      value: current[key],
      prev: previous[key],
    })

    return {
      stats: {
        pageviews: withPrev('pageviews'),
        visitors: withPrev('visitors'),
        visits: withPrev('visits'),
        bounces: withPrev('bounces'),
        totaltime: withPrev('totaltime'),
      },
      websiteId: EJFOX_WEBSITE_ID,
      lastUpdated: new Date().toISOString(),
      shareUrl: SHARE_URL,
    }
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to fetch website stats'
    console.error('Website stats (umami db) error:', message)
    return { error: message, stats: null }
  }
})
