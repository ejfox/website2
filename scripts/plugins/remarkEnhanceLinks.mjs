/**
 * @file plugins/remarkEnhanceLinks.mjs
 * @description Remark plugin that adds social platform icons to external links using Iconify API with caching
 * @usage .use(remarkEnhanceLinks)
 */

import { visit } from 'unist-util-visit'
import fetch from 'node-fetch'
import NodeCache from 'node-cache'

// Cache for fetched icons
const iconCache = new NodeCache({ stdTTL: 3600 })

// Social platform icons mapping
const socialPlatforms = {
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

const fetchIcon = async (name) => {
  const cached = iconCache.get(name)
  if (cached) return cached

  try {
    const res = await fetch(`https://api.iconify.design/${name}.svg`)
    const svg = await res.text()
    const processed = svg.replace(
      '<svg',
      '<svg class="inline-block w-4 h-4 ml-1 opacity-50 ' +
        'dark:opacity-75 group-hover:opacity-100 ' +
        'transition-opacity align-text-bottom"'
    )
    iconCache.set(name, processed)
    return processed
  } catch {
    return null
  }
}

export function remarkEnhanceLinks() {
  return async (tree) => {
    const iconPromises = []

    visit(tree, 'link', (node) => {
      // ONLY handle external http(s) links
      if (!node?.url?.startsWith('http')) return

      // Add target="_blank" and class
      node.data = node.data || {}
      node.data.hProperties = node.data.hProperties || {}
      node.data.hProperties.target = '_blank'
      node.data.hProperties.rel = 'noopener noreferrer'
      node.data.hProperties.class =
        'external-link group inline-flex items-center'

      // Try to add social icon
      try {
        const url = new URL(node.url)
        const domain = url.hostname.toLowerCase()

        for (const [key, icon] of Object.entries(socialPlatforms)) {
          if (domain === key || domain.endsWith(`.${key}`)) {
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
