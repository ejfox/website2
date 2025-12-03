/**
 * /api/og - Fetch Open Graph data from URLs
 *
 * Used by ReplyContext component to show rich previews
 * of URLs being replied to (IndieWeb reply posts)
 */

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

// Simple in-memory cache (5 minute TTL)
const cache = new Map<string, { data: OGData; expires: number }>()
const CACHE_TTL = 5 * 60 * 1000

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
  } catch {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid URL',
    })
  }

  // Check cache
  const cached = cache.get(url)
  if (cached && cached.expires > Date.now()) {
    return cached.data
  }

  try {
    // Fetch the page
    const response = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (compatible; IndieWeb/1.0; +https://ejfox.com)',
        Accept: 'text/html,application/xhtml+xml',
      },
      signal: AbortSignal.timeout(10000),
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    const html = await response.text()

    // Parse OG data from HTML
    const ogData: OGData = {
      url,
      favicon: `https://www.google.com/s2/favicons?domain=${parsedUrl.hostname}&sz=64`,
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
          // Decode HTML entities
          ogData[key as keyof OGData] = match[1]
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'")
          break
        }
      }
    }

    // Try to find a better favicon
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

    // Cache the result
    cache.set(url, {
      data: ogData,
      expires: Date.now() + CACHE_TTL,
    })

    return ogData
  } catch (error: any) {
    // Return minimal data on error
    const fallback: OGData = {
      url,
      siteName: parsedUrl.hostname.replace('www.', ''),
      favicon: `https://www.google.com/s2/favicons?domain=${parsedUrl.hostname}&sz=64`,
    }

    // Cache even failures briefly (1 minute)
    cache.set(url, {
      data: fallback,
      expires: Date.now() + 60000,
    })

    return fallback
  }
})
