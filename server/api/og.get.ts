/**
 * @file og.get.ts
 * @description GET /api/og?url=https://... Open Graph metadata for link previews
 *   (ReplyContextItem.vue, plugins/link-previews.client.ts): { url, title,
 *   description, image, siteName, favicon, author, published, type }.
 *   Fetches the page server-side via server/utils/publicFetch.ts (http(s)
 *   on public hosts only, 3 redirects, 10s) and regex-scrapes meta tags.
 *   image/favicon come back as absolute http(s) URLs or not at all.
 *   In-process Map cache: 5 min per url, failures 1 min, at most 500 entries.
 *   Throws 400 on a missing/invalid/non-public url; a failed fetch returns a
 *   minimal { url, siteName, favicon }.
 */
import { decodeEntities } from '~/server/utils/decodeEntities'
import { assertFetchableUrl, fetchPublicText } from '~/server/utils/publicFetch'

interface OGData {
  url: string
  title?: string
  description?: string
  image?: string
  siteName?: string
  favicon?: string
  author?: string
  published?: string
  type?: string
}

// Simple in-memory cache (5 minute TTL). A Map iterates in insertion order,
// so the first key is the oldest; drop it once the cap is reached.
const cache = new Map<string, { data: OGData; expires: number }>()
const CACHE_TTL = 5 * 60 * 1000
const CACHE_MAX = 500

function cacheSet(key: string, data: OGData, ttl: number) {
  cache.delete(key)
  cache.set(key, { data, expires: Date.now() + ttl })
  while (cache.size > CACHE_MAX) {
    const oldest = cache.keys().next().value
    if (oldest === undefined) break
    cache.delete(oldest)
  }
}

/** `value` resolved against `base`, kept only if it is http(s). */
function httpUrl(value: string | undefined, base: URL): string | undefined {
  if (!value) return undefined
  try {
    const u = new URL(value, base)
    return u.protocol === 'http:' || u.protocol === 'https:'
      ? u.href
      : undefined
  } catch {
    return undefined
  }
}

/**
 * The linked site's OWN favicon, never a third party's.
 *
 * This used to return `https://www.google.com/s2/favicons?domain=…`, which the
 * reader's browser then loaded — handing Google the domain of every link
 * previewed on the site, plus the reader's IP and UA, on a page that has no
 * other reason to talk to Google. The server has already fetched this HTML to
 * scrape OG tags, so the real icon is right there.
 *
 * Resolves relative hrefs against the page URL; falls back to the site's
 * conventional /favicon.ico. Either way the request goes to the domain the
 * reader is already being shown a link to, not to an aggregator.
 */
function extractFavicon(html: string, parsedUrl: URL): string {
  const patterns = [
    /<link[^>]+rel="(?:shortcut )?icon"[^>]+href="([^"]+)"/i,
    /<link[^>]+href="([^"]+)"[^>]+rel="(?:shortcut )?icon"/i,
    /<link[^>]+rel="apple-touch-icon"[^>]+href="([^"]+)"/i,
  ]
  for (const re of patterns) {
    const href = html.match(re)?.[1]
    if (!href) continue
    try {
      return new URL(href, parsedUrl.href).href
    } catch {
      // Malformed href — keep looking rather than emitting a broken URL.
    }
  }
  return `${parsedUrl.origin}/favicon.ico`
}

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const url = query.url as string

  if (!url) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing url parameter',
    })
  }

  // Validate URL
  let parsedUrl: URL
  try {
    parsedUrl = new URL(url)
    assertFetchableUrl(parsedUrl)
  } catch {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid URL',
    })
  }

  // ── Fetch + scrape ───────────────────────────────────────
  // Check cache
  const cached = cache.get(url)
  if (cached && cached.expires > Date.now()) {
    return cached.data
  }

  try {
    // Fetch the page (public hosts only, every redirect hop re-checked)
    const response = await fetchPublicText(parsedUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (compatible; IndieWeb/1.0; +https://ejfox.com)',
        Accept: 'text/html,application/xhtml+xml',
      },
      timeoutMs: 10000,
    })

    if (response.status < 200 || response.status >= 300) {
      throw new Error(`HTTP ${response.status}`)
    }

    const html = response.body

    // Parse OG data from HTML
    const ogData: OGData = {
      url,
      favicon: extractFavicon(html, parsedUrl),
    }

    // Extract meta tags
    const metaPatterns = [
      {
        key: 'title',
        patterns: [
          /property="og:title"\s+content="([^"]+)"/i,
          /name="og:title"\s+content="([^"]+)"/i,
          /content="([^"]+)"\s+property="og:title"/i,
          /<title[^>]*>([^<]+)<\/title>/i,
        ],
      },
      {
        key: 'description',
        patterns: [
          /property="og:description"\s+content="([^"]+)"/i,
          /name="description"\s+content="([^"]+)"/i,
          /content="([^"]+)"\s+property="og:description"/i,
          /content="([^"]+)"\s+name="description"/i,
        ],
      },
      {
        key: 'image',
        patterns: [
          /property="og:image"\s+content="([^"]+)"/i,
          /content="([^"]+)"\s+property="og:image"/i,
          /name="twitter:image"\s+content="([^"]+)"/i,
        ],
      },
      {
        key: 'siteName',
        patterns: [
          /property="og:site_name"\s+content="([^"]+)"/i,
          /content="([^"]+)"\s+property="og:site_name"/i,
        ],
      },
      {
        key: 'author',
        patterns: [
          /name="author"\s+content="([^"]+)"/i,
          /content="([^"]+)"\s+name="author"/i,
          /class="p-author[^"]*"[^>]*>([^<]+)</i,
          /rel="author"[^>]*>([^<]+)</i,
        ],
      },
      {
        key: 'published',
        patterns: [
          /property="article:published_time"\s+content="([^"]+)"/i,
          /content="([^"]+)"\s+property="article:published_time"/i,
          /class="dt-published"[^>]*datetime="([^"]+)"/i,
          /datetime="([^"]+)"[^>]*class="dt-published"/i,
        ],
      },
      {
        key: 'type',
        patterns: [
          /property="og:type"\s+content="([^"]+)"/i,
          /content="([^"]+)"\s+property="og:type"/i,
        ],
      },
    ]

    for (const { key, patterns } of metaPatterns) {
      for (const pattern of patterns) {
        const match = html.match(pattern)
        if (match) {
          ogData[key as keyof OGData] = decodeEntities(match[1]).trim()
          break
        }
      }
    }

    // Try to find a better favicon
    // Second favicon pass: overrides extractFavicon() above whenever it matches,
    // and its relative-URL handling is cruder (protocol-relative //host breaks).
    const faviconPatterns = [
      /rel="icon"[^>]*href="([^"]+)"/i,
      /rel="shortcut icon"[^>]*href="([^"]+)"/i,
      /href="([^"]+)"[^>]*rel="icon"/i,
      /rel="apple-touch-icon"[^>]*href="([^"]+)"/i,
    ]

    for (const pattern of faviconPatterns) {
      const match = html.match(pattern)
      if (match) {
        let faviconUrl = match[1]
        // Handle relative URLs
        if (faviconUrl.startsWith('/')) {
          faviconUrl = `${parsedUrl.origin}${faviconUrl}`
        } else if (!faviconUrl.startsWith('http')) {
          faviconUrl = `${parsedUrl.origin}/${faviconUrl}`
        }
        ogData.favicon = faviconUrl
        break
      }
    }

    // Fallback siteName to hostname
    if (!ogData.siteName) {
      ogData.siteName = parsedUrl.hostname.replace('www.', '')
    }

    // The client puts these in src attributes: absolute http(s) only.
    ogData.image = httpUrl(ogData.image, response.url)
    ogData.favicon = httpUrl(ogData.favicon, response.url)

    cacheSet(url, ogData, CACHE_TTL)

    return ogData
  } catch (error) {
    // From the up-front check or from the socket's DNS lookup on any hop.
    if ((error as { code?: string })?.code === 'ENOTPUBLIC') {
      throw createError({ statusCode: 400, statusMessage: 'Invalid URL' })
    }
    console.error(
      'OG fetch failed:',
      error instanceof Error ? error.message : error
    )
    // Return minimal data on error
    const fallback: OGData = {
      url,
      siteName: parsedUrl.hostname.replace('www.', ''),
      // No HTML to scrape on this path — the conventional location is the only
      // guess available, and it is still the linked site rather than Google.
      favicon: `${parsedUrl.origin}/favicon.ico`,
    }

    // Cache even failures briefly (1 minute)
    cacheSet(url, fallback, 60000)

    return fallback
  }
})
