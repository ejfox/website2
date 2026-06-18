/**
 * @file reach.get.ts
 * @description Site-wide reach for ejfox.com from self-hosted Umami — visitors,
 * pageviews, and the posts people actually read. A mirror of who's listening.
 * @endpoint GET /api/reach
 */
const BASE = 'https://umami.tools.ejfox.com'
const EJFOX_WEBSITE_ID = '165590cb-c361-4ad8-9459-6c6390744c64' // ejfox.com

export default defineEventHandler(async () => {
  const config = useRuntimeConfig()
  const username = config.UMAMI_USERNAME || process.env.UMAMI_USERNAME
  const password = config.UMAMI_PASSWORD || process.env.UMAMI_PASSWORD
  if (!username || !password) {
    console.error('Reach: UMAMI creds missing')
    return null
  }

  try {
    const auth: any = await $fetch(`${BASE}/api/auth/login`, {
      method: 'POST',
      body: { username, password },
    })
    const headers = { Authorization: `Bearer ${auth.token}` }
    const endAt = Date.now()
    const window = (days: number) => ({ startAt: endAt - days * 864e5, endAt })

    const summarize = async (days: number) => {
      const stats: any = await $fetch(
        `${BASE}/api/websites/${EJFOX_WEBSITE_ID}/stats`,
        { headers, query: window(days) }
      )
      return {
        visitors: stats?.visitors?.value ?? null,
        pageviews: stats?.pageviews?.value ?? null,
      }
    }

    const top: any = await $fetch(
      `${BASE}/api/websites/${EJFOX_WEBSITE_ID}/metrics`,
      { headers, query: { type: 'url', ...window(7), limit: 5 } }
    )
    const topPosts = (Array.isArray(top) ? top : [])
      .slice(0, 5)
      .map((r: any) => ({ path: r.x, views: r.y }))

    return {
      week: await summarize(7),
      month: await summarize(30),
      topPosts,
      lastUpdated: new Date().toISOString(),
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('Reach (umami) error:', message)
    return null
  }
})
