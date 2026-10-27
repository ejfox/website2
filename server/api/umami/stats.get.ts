/**
 * @file umami/stats.get.ts
 * @description GET /api/umami/stats?url=/path. Last-30-day Umami pageviews for one
 *   site path plus site-wide stats: { url, days, pageViews, overallStats,
 *   lastUpdated }. Logs in per call with env UMAMI_USERNAME / UMAMI_PASSWORD
 *   against umami.tools.ejfox.com (the HTTP-API path; reach.get.ts and
 *   website-stats.get.ts read the same data from Postgres).
 *   Cached 5 min per url. Throws 400 without url, 500 without creds, 502 if Umami
 *   fails. overallStats is null if only that half fails.
 */

const UMAMI = 'https://umami.tools.ejfox.com'
const WEBSITE_ID = '165590cb-c361-4ad8-9459-6c6390744c64'
const DAYS = 30

export default defineCachedEventHandler(
  async (event) => {
    const { url } = getQuery(event)

    if (!url || typeof url !== 'string') {
      throw createError({
        statusCode: 400,
        statusMessage: 'URL parameter is required',
      })
    }

    const username = serverEnv('UMAMI_USERNAME')
    const password = serverEnv('UMAMI_PASSWORD')
    if (!username || !password) {
      throw createError({
        statusCode: 500,
        statusMessage:
          'UMAMI_USERNAME and UMAMI_PASSWORD environment variables required',
      })
    }

    try {
      const { token } = await $fetch<{ token: string }>(
        `${UMAMI}/api/auth/login`,
        { method: 'POST', body: { username, password } }
      )
      const headers = { Authorization: `Bearer ${token}` }

      // Umami 3 requires a range, and filters by `path` (`url` is ignored and
      // silently returns the whole site).
      const endAt = Date.now()
      const range = { startAt: endAt - DAYS * 86_400_000, endAt }
      const site = `${UMAMI}/api/websites/${WEBSITE_ID}`

      const [pageViews, overallStats] = await Promise.all([
        $fetch(`${site}/pageviews`, {
          headers,
          query: {
            ...range,
            unit: 'day',
            timezone: 'America/New_York',
            path: url,
          },
        }),
        // Site-wide stats are garnish: don't fail the per-path answer over them.
        $fetch(`${site}/stats`, { headers, query: range }).catch(() => null),
      ])

      return {
        url,
        days: DAYS,
        pageViews,
        overallStats,
        lastUpdated: new Date().toISOString(),
      }
    } catch (error) {
      console.error('Umami stats error:', error)
      throw createError({
        statusCode: 502,
        statusMessage: 'Failed to fetch Umami stats',
      })
    }
  },
  {
    maxAge: 300,
    name: 'umami-stats',
    getKey: (event) => String(getQuery(event).url || ''),
  }
)
