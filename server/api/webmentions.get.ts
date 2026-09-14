/**
 * @file webmentions.get.ts
 * @description Fetches and filters webmentions from webmention.io with spam/abuse moderation using blocklists
 * @endpoint GET /api/webmentions
 * @params target: string - Target URL to fetch webmentions for
 * @returns Filtered array of webmention objects excluding blocked domains, authors, and spam content
 */

import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import sanitizeHtml from 'sanitize-html'

// Webmention content is arbitrary HTML from any site on the internet that sends
// us a webmention — fully untrusted. The client renders content.html via
// v-html, so we sanitize HERE, at the boundary, to a tiny allowlist. Strips
// scripts, on* handlers, iframes, styles — everything but basic inline markup.
/**
 * Only http(s) URLs survive. These fields land in `:href` / `:src` bindings,
 * which sanitize-html's allowedSchemes does NOT cover — that governs links
 * inside content.html only. A `javascript:` author URL would otherwise be
 * clickable XSS.
 */
function safeUrl(url: string | undefined): string | undefined {
  if (!url) return undefined
  try {
    const { protocol } = new URL(url)
    return protocol === 'http:' || protocol === 'https:' ? url : undefined
  } catch {
    return undefined
  }
}

function sanitizeMention(m: Webmention): Webmention {
  // Plain-text mentions carry `content.text` and no `html`, and the component
  // falls back to it through v-html — so it is parsed as HTML and an
  // `<img src=x onerror=...>` executes. Sanitize it with the same allowlist.
  if (m.content?.text) {
    m.content.text = sanitizeHtml(m.content.text, { allowedTags: [] })
  }
  if (m.author) {
    m.author.url = safeUrl(m.author.url)
    m.author.photo = safeUrl(m.author.photo)
  }
  m.url = safeUrl(m.url)
  if (m.content?.html) {
    m.content.html = sanitizeHtml(m.content.html, {
      allowedTags: [
        'a',
        'b',
        'strong',
        'i',
        'em',
        'code',
        'p',
        'br',
        'span',
        'blockquote',
      ],
      allowedAttributes: { a: ['href', 'title'] },
      allowedSchemes: ['http', 'https', 'mailto'],
      transformTags: {
        a: sanitizeHtml.simpleTransform('a', {
          rel: 'noopener nofollow ugc',
          target: '_blank',
        }),
      },
    })
  }
  return m
}

interface Webmention {
  url?: string
  'wm-source'?: string
  author?: {
    url?: string
    name?: string
    photo?: string
  }
  content?: {
    text?: string
    html?: string
  }
}

interface WebmentionResponse {
  children?: Webmention[]
}

interface ModerationConfig {
  blockedDomains: string[]
  blockedUrls: string[]
  blockedAuthors: string[]
  spamKeywords: string[]
  trustedDomains: string[]
}

function loadModeration(): ModerationConfig {
  try {
    const configPath = join(process.cwd(), 'data/webmention-moderation.json')
    return JSON.parse(readFileSync(configPath, 'utf-8'))
  } catch {
    return {
      blockedDomains: [],
      blockedUrls: [],
      blockedAuthors: [],
      spamKeywords: [],
      trustedDomains: [],
    }
  }
}

/** True when `url`'s host is exactly `domain` or a subdomain of it. */
function hostMatches(url: string, domain: string): boolean {
  try {
    const host = new URL(url).hostname.toLowerCase()
    const d = domain.toLowerCase()
    return host === d || host.endsWith(`.${d}`)
  } catch {
    return false
  }
}

function isBlocked(mention: Webmention, config: ModerationConfig): boolean {
  const sourceUrl = mention.url || mention['wm-source'] || ''
  const authorUrl = mention.author?.url || ''
  const authorName = mention.author?.name || ''
  const content = mention.content?.text || mention.content?.html || ''

  // Check blocked domains
  for (const domain of config.blockedDomains) {
    if (sourceUrl.includes(domain) || authorUrl.includes(domain)) {
      return true
    }
  }

  // Check blocked URLs
  if (config.blockedUrls.includes(sourceUrl)) {
    return true
  }

  // Check blocked authors
  if (
    config.blockedAuthors?.includes(authorName) ||
    config.blockedAuthors?.includes(authorUrl)
  ) {
    return true
  }

  // Trusted sources skip the keyword filter. The keywords are deliberately
  // blunt ("crypto giveaway", "casino"), so someone on mastodon writing *about*
  // a scam would otherwise be dropped as spam. Blocklists still apply above —
  // trust only buys an exemption from the fuzzy check, never from an explicit
  // block. (This list was loaded but never read before.)
  // Match on hostname, not substring: `includes('github.com')` also matched
  // `https://github.com.attacker.net/` and `https://evil.com/?u=github.com`.
  // And only the SOURCE url counts — author.url is supplied by the sender, so
  // trusting it would let anyone opt themselves out of the keyword filter.
  const isTrusted = (config.trustedDomains ?? []).some((domain) =>
    hostMatches(sourceUrl, domain)
  )
  if (isTrusted) return false

  // Check spam keywords
  const lowerContent = content.toLowerCase()
  for (const keyword of config.spamKeywords) {
    if (lowerContent.includes(keyword.toLowerCase())) {
      return true
    }
  }

  return false
}

// Cached: this proxies webmention.io, and now that the component renders on
// every post, an uncached handler meant one upstream call per post view — a new
// rate-limit and latency surface on a third party. Keyed by target so each post
// caches separately.
export default defineCachedEventHandler(
  async (event) => {
    const query = getQuery(event)
    const target = query.target as string
    // Token comes from env only — never hardcode (this repo is public).
    const runtimeConfig = useRuntimeConfig()
    const token =
      runtimeConfig.WEBMENTION_IO_TOKEN || process.env.WEBMENTION_IO_TOKEN

    if (!target) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Missing target URL parameter',
      })
    }

    if (!token) {
      // No token configured → no webmentions rather than a 500.
      return []
    }

    try {
      const url = `https://webmention.io/api/mentions.jf2?token=${token}&target=${encodeURIComponent(target)}&per-page=100`
      const response = await $fetch<WebmentionResponse>(url)
      const mentions = response.children || []

      // Load moderation config and filter
      const config = loadModeration()
      const filtered = mentions
        .filter((m: Webmention) => !isBlocked(m, config))
        .map(sanitizeMention)

      return filtered
    } catch (error) {
      const err = error as Error
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to fetch webmentions',
        message: err.message,
      })
    }
  },
  {
    maxAge: 5 * 60,
    name: 'webmentions',
    getKey: (event) => (getQuery(event).target as string) || 'none',
  }
)
