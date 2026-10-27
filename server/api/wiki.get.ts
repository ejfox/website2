/**
 * @file wiki.get.ts
 * @description GET /api/wiki. Stats for the personal MediaWiki at
 *   archive.ejfox.com: site totals plus edits/new pages in the last 30 days
 *   ({ pages, articles, editsAllTime, images, edits30d, newPages30d, capped,
 *   lastUpdated }). Two public MediaWiki API calls, no key. Imported by stats.get.ts,
 *   fetched by now.get.ts. No cache in this file. Returns null on any error.
 */
const API = 'https://archive.ejfox.com/api.php'

export default defineEventHandler(async () => {
  try {
    const site: any = await $fetch(API, {
      query: {
        action: 'query',
        meta: 'siteinfo',
        siprop: 'statistics',
        format: 'json',
      },
    })
    const s = site?.query?.statistics ?? {}

    // Changes in the last 30 days (rclimit caps at 500; flag if we hit it).
    const rcend = new Date(Date.now() - 30 * 864e5).toISOString()
    const rc: any = await $fetch(API, {
      query: {
        action: 'query',
        list: 'recentchanges',
        rcend,
        rclimit: 500,
        rcprop: 'timestamp|type',
        rctype: 'edit|new',
        format: 'json',
      },
    })
    const changes: any[] = rc?.query?.recentchanges ?? []

    return {
      pages: s.pages ?? null,
      articles: s.articles ?? null,
      editsAllTime: s.edits ?? null,
      images: s.images ?? null,
      edits30d: changes.length,
      newPages30d: changes.filter((c) => c.type === 'new').length,
      capped: changes.length >= 500,
      lastUpdated: new Date().toISOString(),
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('Wiki stats error:', message)
    return null
  }
})
