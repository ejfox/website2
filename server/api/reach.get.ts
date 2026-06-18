/**
 * @file reach.get.ts
 * @description Site-wide reach for ejfox.com, read straight from the co-located
 * Umami postgres (the HTTP API creds were stale). Visitors, pageviews, and the
 * posts people actually read — a mirror of who's listening.
 * @endpoint GET /api/reach
 */
import { Pool } from 'pg'

const EJFOX_WEBSITE_ID = '165590cb-c361-4ad8-9459-6c6390744c64' // ejfox.com

let pool: Pool | null = null
function getPool(): Pool | null {
  if (pool) return pool
  const connectionString = process.env.UMAMI_DATABASE_URL
  if (!connectionString) return null
  pool = new Pool({ connectionString, max: 2, idleTimeoutMillis: 30_000 })
  return pool
}

export default defineEventHandler(async () => {
  const db = getPool()
  if (!db) {
    console.error('Reach: UMAMI_DATABASE_URL not set')
    return null
  }

  try {
    // event_type = 1 is a pageview in Umami v2 (2 is a custom event).
    const summarize = async (days: number) => {
      const { rows } = await db.query(
        `SELECT COUNT(*)::int AS pageviews,
                COUNT(DISTINCT session_id)::int AS visitors
           FROM website_event
          WHERE website_id = $1 AND event_type = 1
            AND created_at > now() - make_interval(days => $2)`,
        [EJFOX_WEBSITE_ID, days]
      )
      return {
        pageviews: rows[0]?.pageviews ?? null,
        visitors: rows[0]?.visitors ?? null,
      }
    }

    const { rows: top } = await db.query(
      `SELECT url_path AS path, COUNT(*)::int AS views
         FROM website_event
        WHERE website_id = $1 AND event_type = 1
          AND created_at > now() - make_interval(days => $2)
          AND url_path <> '/'
        GROUP BY url_path ORDER BY views DESC LIMIT 5`,
      [EJFOX_WEBSITE_ID, 30]
    )

    return {
      week: await summarize(7),
      month: await summarize(30),
      topPosts: top.map((r: { path: string; views: number }) => ({
        path: r.path,
        views: r.views,
      })),
      lastUpdated: new Date().toISOString(),
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('Reach (umami db) error:', message)
    return null
  }
})
