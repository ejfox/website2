import { visit } from 'unist-util-visit'
import { createClient } from '@supabase/supabase-js'
import NodeCache from 'node-cache'
import fetch from 'node-fetch'

// Cache for fetched icons to avoid duplicate requests
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
  'arxiv.org': 'cib:arxiv'
}

// Function to fetch SVG from Iconify API
async function fetchIconSvg(iconName) {
  const cacheKey = `icon:${iconName}`
  if (iconCache.has(cacheKey)) {
    return iconCache.get(cacheKey)
  }

  try {
    const response = await fetch(`https://api.iconify.design/${iconName}.svg`)
    if (!response.ok) throw new Error(`Failed to fetch icon: ${iconName}`)
    const svg = await response.text()

    // Add classes for proper sizing and alignment
    const processedSvg = svg.replace(
      '<svg',
      '<svg class="inline-block w-4 h-4 ml-1 opacity-50 group-hover:opacity-100 transition-opacity"'
    )
    iconCache.set(cacheKey, processedSvg)
    return processedSvg
  } catch (error) {
    console.error(`Error fetching icon ${iconName}:`, error)
    return null
  }
}

export function remarkEnhanceLinks(options = {}) {
  const supabaseUrl = process.env.SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_KEY
  const supabase = createClient(supabaseUrl, supabaseKey)

  const scrapCache = new NodeCache({ stdTTL: 3600 })

  // Add Amazon affiliate handling
  function addAffiliateCode(url) {
    try {
      const urlObj = new URL(url)
      if (urlObj.hostname.includes('amazon.com')) {
        urlObj.searchParams.set('tag', 'ejfox0c-20')
        return urlObj.toString()
      }
    } catch (e) {
      console.error('Error processing Amazon URL:', e)
    }
    return url
  }

  async function loadScrapsIntoCache() {
    if (scrapCache.has('scrapMap')) {
      return scrapCache.get('scrapMap')
    }

    let { data: scraps, error } = await supabase
      .from('scraps')
      .select('scrap_id, metadata')

    if (error) {
      console.error('Error fetching scraps from Supabase:', error)
      return {}
    }

    const scrapMap = {}
    scraps.forEach((scrap) => {
      const href = scrap.metadata?.href
      if (href) {
        scrapMap[href] = scrap
      }
    })

    scrapCache.set('scrapMap', scrapMap)
    return scrapMap
  }

  return async (tree) => {
    const linkNodes = []
    const iconPromises = []

    // Collect link nodes
    visit(tree, 'link', (node) => {
      if (!node || typeof node !== 'object') return
      if (node.url === null || node.url === undefined) {
        node.url = ''
        return
      }
      // Add affiliate code to Amazon links
      node.url = addAffiliateCode(node.url)
      linkNodes.push(node)
    })

    // Load scraps into cache if needed
    if (!scrapCache.has('scrapMap')) {
      try {
        const scrapMap = await loadScrapsIntoCache()
        scrapCache.set('scrapMap', scrapMap)
      } catch (error) {
        console.error('Error loading scraps:', error)
        scrapCache.set('scrapMap', {})
      }
    }

    const scrapMap = scrapCache.get('scrapMap')

    // Process links
    for (const node of linkNodes) {
      try {
        if (!node.url) continue

        // Add scrap data if available
        const scrap = scrapMap[node.url]
        if (scrap) {
          node.data = node.data || {}
          node.data.hProperties = node.data.hProperties || {}
          node.data.hProperties['data-scrap-id'] = scrap.scrap_id
          if (scrap.metadata) {
            node.data.hProperties['data-scrap-metadata'] = JSON.stringify(
              scrap.metadata
            )
          }
        }

        // Add social platform icons
        try {
          const url = new URL(node.url)
          const domain = url.hostname

          for (const [platformDomain, icon] of Object.entries(
            socialPlatforms
          )) {
            if (domain.includes(platformDomain)) {
              // Add group class for hover effects
              node.data = node.data || {}
              node.data.hProperties = node.data.hProperties || {}
              node.data.hProperties.className =
                (node.data.hProperties.className || '') +
                ' group inline-flex items-center'

              // Create a promise to fetch and process the icon
              const iconPromise = (async () => {
                const svg = await fetchIconSvg(icon)
                if (svg) {
                  // Add the SVG as a child of the link
                  node.children.push({
                    type: 'html',
                    value: svg
                  })
                }
              })()
              iconPromises.push(iconPromise)
              break
            }
          }
        } catch (e) {
          // Not a valid URL, skip icon
        }
      } catch (error) {
        console.error(`Error enhancing link: ${error.message}`)
      }
    }

    // Wait for all icon fetching to complete
    await Promise.all(iconPromises)
  }
}
