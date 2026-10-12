/**
 * @file scraps-rss.xml.ts
 * @description RSS feed of the public link log at /scraps-rss.xml (named like
 * the other secondary feeds: dispatch-rss.xml, gists-rss.xml).
 *
 * Reads /api/scraps rather than querying Supabase itself, so the feed exposes
 * exactly what /scraps already shows (the `shared === true` filter lives in one
 * place) and rides that handler's 1h cache — a feed poller can't add Supabase
 * egress on top of the page's.
 */
import RSS from 'rss'
import { defineEventHandler, setHeader } from 'h3'
import { stripInvalidXmlChars } from '~/server/utils/xml'

interface ScrapItem {
  id: string
  title: string | null
  summary: string | null
  url: string | null
  created_at: string
  tags: string[] | null
}

const MAX_ITEMS = 100

// Shopping saves stay on /scraps but out of the feed (EJ, 2026-10-12): a
// subscriber wants the reading, not the cart. Airbnb is here too: a saved
// listing says where EJ might be staying. Any `shop.` subdomain counts.
const FEED_SKIP_HOSTS = new Set([
  'aescripts.com',
  'airbnb.com',
  'amazon.com',
  'bhphotovideo.com',
  'bladehq.com',
  'franklinartglass.com',
  'mosaicartsupply.com',
  'revzilla.com',
  'theceramicshop.com',
  'woolichracing.com',
])

function isFeedSkipped(url: string | null): boolean {
  try {
    const host = new URL(url || '').hostname.replace(/^www\./, '')
    return host.startsWith('shop.') || FEED_SKIP_HOSTS.has(host)
  } catch {
    return false
  }
}

// Pinboard stores untitled bookmarks as the literal "[no title]".
function itemTitle(scrap: ScrapItem): string {
  const title = scrap.title?.trim()
  if (title && title !== '[no title]') return title
  try {
    return new URL(scrap.url || '').hostname.replace(/^www\./, '')
  } catch {
    return 'Untitled scrap'
  }
}

export default defineEventHandler(async (event) => {
  const siteUrl = 'https://ejfox.com'

  const feed = new RSS({
    title: 'EJ Fox · Scraps',
    description: 'Bookmarks, links, and scraps from around the web',
    feed_url: `${siteUrl}/scraps-rss.xml`,
    site_url: `${siteUrl}/scraps`,
    image_url: `${siteUrl}/icon.png`,
    language: 'en',
    pubDate: new Date().toUTCString(),
    copyright: `${new Date().getFullYear()} EJ Fox`,
    managingEditor: 'ej@ejfox.com (EJ Fox)',
    webMaster: 'ej@ejfox.com (EJ Fox)',
    ttl: 60,
  })

  // Already shared-only and newest first.
  const scraps = await $fetch<ScrapItem[]>('/api/scraps')

  for (const scrap of scraps
    .filter((s) => !isFeedSkipped(s.url))
    .slice(0, MAX_ITEMS)) {
    feed.item({
      title: stripInvalidXmlChars(itemTitle(scrap)),
      description: stripInvalidXmlChars(scrap.summary || ''),
      url: scrap.url || `${siteUrl}/scraps`,
      // Not a URL: the same link can be bookmarked twice, the id can't.
      guid: `ejfox-scrap-${scrap.id}`,
      categories: scrap.tags || [],
      date: new Date(scrap.created_at),
    })
  }

  setHeader(event, 'Content-Type', 'application/xml')
  setHeader(
    event,
    'Cache-Control',
    import.meta.dev ? 'no-cache' : 'public, max-age=3600, s-maxage=7200'
  )
  return feed.xml({ indent: true })
})
