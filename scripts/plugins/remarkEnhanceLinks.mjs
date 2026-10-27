/**
 * @file plugins/remarkEnhanceLinks.mjs
 * @description Remark plugin that adds social platform icons to external links.
 *   Icons come from data/link-icons.json, raw Iconify SVGs vendored by
 *   `yarn icons:vendor`, so processing needs no network. A live fetch was
 *   fragile: a 404 or 429 baked a post's JSON without its icons, and the
 *   cache never retried. Also sets target=_blank, rel and the
 *   `external-link` class on every http(s) link.
 *   Used by scripts/build/processMarkdown.mjs; scripts/build/vendor-link-icons.mjs
 *   imports socialPlatforms / iconUrl / isSafeSvg from here.
 * Gotchas: an icon missing from data/link-icons.json falls back to a live
 *   Iconify fetch (with a warning); vendor it instead. The SVG is baked into
 *   cached post JSON, so a changed icon only shows after that post reprocesses.
 * @usage .use(remarkEnhanceLinks)
 */

import { readFileSync } from 'node:fs'
import { visit } from 'unist-util-visit'
import NodeCache from 'node-cache'

// ── Icon sources ────────────────────────────────────────────────────────────

// Cache for fetched icons (per process; one blog:process run)
const iconCache = new NodeCache({ stdTTL: 3600 })

const VENDORED_ICONS = (() => {
  try {
    return JSON.parse(
      readFileSync(new URL('../../data/link-icons.json', import.meta.url))
    )
  } catch {
    return {}
  }
})()

// Social platform icons mapping. Adding a domain? Run `yarn icons:vendor`.
export const socialPlatforms = {
  'wikipedia.org': 'simple-icons:wikipedia',
  'github.com': 'simple-icons:github',
  'github.blog': 'simple-icons:github',
  'github.io': 'typcn:social-github',
  'youtube.com': 'simple-icons:youtube',
  'twitter.com': 'simple-icons:twitter',
  'apple.com': 'simple-icons:apple',
  'itunes.apple.com': 'simple-icons:apple',
  'observablehq.com': 'simple-icons:observable',
  'pinboard.in': 'simple-icons:pinboard',
  'goodreads.com': 'simple-icons:goodreads',
  'glitch.com': 'simple-icons:glitch',
  'stackoverflow.com': 'simple-icons:stackoverflow',
  'mailto:': 'ic:baseline-email',
  'nytimes.com': 'tabler:brand-nytimes',
  'washingtonpost.com': 'simple-icons:thewashingtonpost',
  'nbcnews.com': 'simple-icons:nbc',
  'cnn.com': 'simple-icons:cnn',
  'bbc.com': 'simple-icons:bbc',
  'reuters.com': 'arcticons:reuters',
  'archive.org': 'academicons:archive',
  'web.archive.org': 'academicons:archive',
  'buzzfeed.com': 'simple-icons:buzzfeed',
  'vox.com': 'simple-icons:vox',
  'medium.com': 'simple-icons:medium',
  'scribd.com': 'simple-icons:scribd',
  'patreon.com': 'simple-icons:patreon',
  'soundcloud.com': 'simple-icons:soundcloud',
  'bandcamp.com': 'simple-icons:bandcamp',
  'npmjs.com': 'simple-icons:npm',
  'hackernews.com': 'fa6-brands:square-hacker-news',
  'instagram.com': 'simple-icons:instagram',
  'facebook.com': 'simple-icons:facebook',
  'discord.com': 'simple-icons:discord',
  'reddit.com': 'fa6-brands:reddit',
  'tiktok.com': 'simple-icons:tiktok',
  'twitch.tv': 'simple-icons:twitch',
  'linkedin.com': 'simple-icons:linkedin',
  'pinterest.com': 'simple-icons:pinterest',
  'snapchat.com': 'simple-icons:snapchat',
  'tumblr.com': 'simple-icons:tumblr',
  'whatsapp.com': 'simple-icons:whatsapp',
  'telegram.com': 'simple-icons:telegram',
  'signal.com': 'simple-icons:signal',
  'slack.com': 'simple-icons:slack',
  'zoom.us': 'simple-icons:zoom',
  'meet.google.com': 'simple-icons:googlemeet',
  'discord.gg': 'simple-icons:discord',
  '.gov': 'game-icons:usa-flag',
  'vuejs.org': 'mdi:vuejs',
  'reactjs.org': 'mdi:react',
  'netlify.com': 'file-icons:netlify',
  'nuxtjs.org': 'mdi:nuxt',
  'cloudinary.com': 'simple-icons:cloudinary',
  'cloudflare.com': 'simple-icons:cloudflare',
  'aws.amazon.com': 'simple-icons:amazonaws',
  'gcp.google.com': 'simple-icons:googlecloud',
  'firebase.google.com': 'simple-icons:firebase',
  'microsoft.com': 'simple-icons:microsoft',
  'arxiv.org': 'cib:arxiv',
}

/** The Iconify URL for an icon. `prefix/icon.svg`, not `prefix:icon.svg`:
 * by 2026-10 the API 404'd the colon form for some icons (mdi:youtube,
 * simple-icons:wikipedia, …) while still serving them by path. */
export const iconUrl = (name) => {
  const [prefix, icon] = name.split(':')
  return `https://api.iconify.design/${prefix}/${icon}.svg`
}

/** Sanity-gate third-party markup before it's baked verbatim into cached
 * post JSON (rendered with allowDangerousHtml): a bare <svg> document with
 * no scripts or inline event handlers. */
export const isSafeSvg = (svg) => {
  const trimmed = String(svg || '').trim()
  return (
    trimmed.startsWith('<svg') &&
    trimmed.endsWith('</svg>') &&
    !/<script|\son\w+\s*=/i.test(trimmed)
  )
}

const decorate = (svg) =>
  svg.replace(
    '<svg',
    '<svg class="inline-block w-4 h-4 ml-1 opacity-50 ' +
      'dark:opacity-75 group-hover:opacity-100 ' +
      'transition-opacity align-text-bottom"'
  )

// ── Icon loading ────────────────────────────────────────────────────────────

// Vendored SVG first; live Iconify fetch with backoff only as a fallback.
const fetchIcon = async (name, retries = 2) => {
  const cached = iconCache.get(name)
  if (cached) return cached

  const vendored = VENDORED_ICONS[name]
  if (vendored && isSafeSvg(vendored)) {
    const processed = decorate(vendored)
    iconCache.set(name, processed)
    return processed
  }
  console.warn(
    `[remarkEnhanceLinks] ${name} is not vendored, fetching live. Run \`yarn icons:vendor\`.`
  )

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(iconUrl(name))
      if (!res.ok) {
        if (attempt < retries) {
          await new Promise((r) => setTimeout(r, 500 * (attempt + 1)))
          continue
        }
        console.warn(
          `[remarkEnhanceLinks] Failed to fetch icon ${name}: HTTP ${res.status}`
        )
        return null
      }
      const svg = await res.text()
      if (!isSafeSvg(svg)) {
        console.warn(
          `[remarkEnhanceLinks] Rejected non-SVG/unsafe response for ${name}`
        )
        return null
      }
      const processed = decorate(svg)
      iconCache.set(name, processed)
      return processed
    } catch (err) {
      if (attempt < retries) {
        await new Promise((r) => setTimeout(r, 500 * (attempt + 1)))
        continue
      }
      console.warn(
        `[remarkEnhanceLinks] Error fetching icon ${name}: ${err.message}`
      )
      return null
    }
  }
  return null
}

// ── The remark plugin ───────────────────────────────────────────────────────

export function remarkEnhanceLinks() {
  return async (tree) => {
    const iconPromises = []

    visit(tree, 'link', (node) => {
      // ONLY handle external http(s) links
      if (!node?.url?.startsWith('http')) return

      // Idempotency: if this link was already enhanced (re-run on already-
      // processed content), don't re-add target/class or push a second icon.
      if (node.data?.hProperties?.class?.includes?.('external-link')) return

      // Add target="_blank" and class
      node.data = node.data || {}
      node.data.hProperties = node.data.hProperties || {}
      node.data.hProperties.target = '_blank'
      node.data.hProperties.rel = 'noopener noreferrer'
      node.data.hProperties.class =
        'external-link group inline-flex items-center'
      node.data.hProperties['data-preview-url'] = node.url

      // Try to add social icon
      try {
        const url = new URL(node.url)
        const domain = url.hostname.toLowerCase()

        for (const [key, icon] of Object.entries(socialPlatforms)) {
          // TLD-style keys (".gov") match as a suffix; domain keys match
          // exactly or as a subdomain. The old code did `endsWith('.'+key)`
          // for every key, so ".gov" became `endsWith('..gov')` — dead.
          const matched = key.startsWith('.')
            ? domain.endsWith(key)
            : domain === key || domain.endsWith(`.${key}`)
          if (matched) {
            // Store the current node for later icon insertion
            const iconPromise = fetchIcon(icon).then((svg) => {
              if (svg) {
                // Instead of adding as separate node, we'll embed
                // the icon inside the link node
                // Create a span wrapper to hold the icon
                const iconSpan = {
                  type: 'html',
                  value: svg,
                }

                // Make sure this node has children, and add the
                // icon as the last child
                node.children = node.children || []
                node.children.push(iconSpan)
              }
            })

            iconPromises.push(iconPromise)
            break
          }
        }
      } catch {
        // Ignore URL parsing errors
      }
    })

    await Promise.all(iconPromises)
    return tree
  }
}
