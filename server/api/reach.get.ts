/**
 * @file reach.get.ts
 * @description GET /api/reach. Site-wide reach for ejfox.com, read straight from
 *   the co-located Umami Postgres (env UMAMI_DATABASE_URL; the HTTP API creds
 *   were stale): { week: { pageviews, visitors }, month: {...}, topPosts (5
 *   paths, 30 days), lastUpdated }. Imported by stats.get.ts. No cache; a
 *   2-connection pool per process. Returns null without the env or on any DB
 *   error. Queries are parameterized.
 */
import { Pool } from 'pg'
import { warnNotConfigured } from '~/server/utils/notConfigured'

const EJFOX_WEBSITE_ID = '165590cb-c361-4ad8-9459-6c6390744c64' // ejfox.com

let pool: Pool | null = null
function getPool(): Pool | null {
  if (pool) return pool
  const connectionString = process.env.UMAMI_DATABASE_URL
  if (!connectionString) return null
  pool = new Pool({ connectionString, max: 2, idleTimeoutMillis: 30_000 })
  // pg-pool re-emits an idle client's error (DB restart, network blip) on the
  // pool. With no listener that's an uncaught error: the process dies and pm2
  // respawns it with every in-memory cache empty. pg-pool already drops the
  // bad client, so logging is all that's needed.
  pool.on('error', (err) => {
    console.error('[reach] idle pg client error:', err.message)
  })
  return pool
}

export default defineEventHandler(async () => {
  const db = getPool()
  if (!db) {
    warnNotConfigured('Umami', 'UMAMI_DATABASE_URL')
    return null
  }

  try {
    // event_type = 1 is a pageview in Umami v2 (2 is a custom event).
    // Umami v2 has no separate pageview table: filter website_event by type.
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
