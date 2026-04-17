/**
 * @file plugins/remarkEnhanceImages.mjs
 * @description Adds lazy-loading, Cloudinary srcset/sizing, placeholder data,
 *   semantic figure/figcaption wrapping, and alt text fallback from Cloudinary
 *   context metadata.
 * @usage .use(remarkEnhanceImages)
 */

import { promises as fs } from 'node:fs'
import path from 'node:path'
import { visit } from 'unist-util-visit'

const CACHE_PATH = path.resolve(
  process.cwd(),
  'data',
  'cloudinary-image-cache.json'
)

// ---------------------------------------------------------------------------
// Junk alt text detection (same patterns as generate-alt-text.mjs)
// ---------------------------------------------------------------------------

const JUNK_ALT_PATTERNS = [
  /^Screenshot/i, /^Screen Shot/i, /^Pasted image/i, /^IMG_/i, /^DSC/,
  /^DJI_/, /^DSCF/, /^Photo /i, /^CleanShot/i, /^Untitled/i, /^image\d*/i,
  /^[A-Fa-f0-9]{8}-[A-Fa-f0-9]{4}/,
  /^[A-Za-z0-9_.-]+\.(png|jpe?g|gif|webp|svg|tiff?)$/i,
  /^\d{4}-\d{2}-\d{2}/,
  /^https?:\/\//,  // URL used as alt text
]

function isJunkAlt(alt) {
  if (!alt || alt.trim().length === 0) return true
  return JUNK_ALT_PATTERNS.some(p => p.test(alt.trim()))
}

// ---------------------------------------------------------------------------
// Deterministic "splayed on a table" transforms — rotation/scale derived from
// a stable hash of the image src so each image picks its own angle and stays
// put across reloads.
// ---------------------------------------------------------------------------

function hashString(str) {
  let h = 2166136261
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

function splayTransform(src) {
  const h = hashString(src)
  // Rotation: ±3°, biased away from zero so nothing sits perfectly square
  const rotRaw = ((h & 0xffff) / 0xffff) * 6 - 3
  const rotation = (rotRaw >= 0 ? Math.max(rotRaw, 0.6) : Math.min(rotRaw, -0.6))
  return {
    rotation: Number(rotation.toFixed(2)),
  }
}

// ---------------------------------------------------------------------------
// Cloudinary URL helpers
// ---------------------------------------------------------------------------

const enhanceImageUrl = (url) => {
  if (!url.includes('res.cloudinary.com/')) return url
  url = url.replace(/^http:\/\//i, 'https://')
  const base = url.split('/upload/')[0] + '/upload/'
  const pathPart = url.split('/upload/')[1]

  const widthMatch = url.match(/w_(\d+)/)
  const heightMatch = url.match(/h_(\d+)/)
  const width = widthMatch ? Number.parseInt(widthMatch[1]) : null
  const height = heightMatch ? Number.parseInt(heightMatch[1]) : null

  const srcset = [
    `${base}c_scale,f_auto,q_auto:good,w_640/${pathPart} 640w`,
    `${base}c_scale,f_auto,q_auto:good,w_960/${pathPart} 960w`,
    `${base}c_scale,f_auto,q_auto:good,w_1280/${pathPart} 1280w`,
    `${base}c_scale,f_auto,q_auto:good,w_1920/${pathPart} 1920w`,
  ].join(', ')

  return {
    src: `${base}c_scale,f_auto,q_auto:good,w_1280/${pathPart}`,
    srcset,
    sizes: '(max-width: 430px) 92vw, (max-width: 768px) 85vw, 900px',
    width,
    height,
  }
}

// ---------------------------------------------------------------------------
// Cache
// ---------------------------------------------------------------------------

async function loadCache() {
  try {
    const raw = await fs.readFile(CACHE_PATH, 'utf8')
    return JSON.parse(raw)
  } catch {
    return {}
  }
}

async function saveCache(cache) {
  await fs.mkdir(path.dirname(CACHE_PATH), { recursive: true })
  await fs.writeFile(CACHE_PATH, JSON.stringify(cache, null, 2))
}

// ---------------------------------------------------------------------------
// Cloudinary metadata extraction
// ---------------------------------------------------------------------------

function isTransformSegment(segment) {
  return segment.includes(',') || /^[cwhfqget]_[^/]+/.test(segment)
}

function extractCloudinaryInfo(url) {
  const cleanUrl = url.split(/[?#]/)[0]
  const match = cleanUrl.match(
    /https?:\/\/res\.cloudinary\.com\/([^/]+)\/image\/upload\/(.+)$/i
  )
  if (!match) return null

  const [, cloudName, tail] = match
  const parts = tail.split('/')
  while (parts.length > 0 && isTransformSegment(parts[0])) {
    parts.shift()
  }

  return {
    cloudName,
    publicPath: parts.join('/'),
    // public_id without extension for admin API lookups
    publicId: parts.join('/').replace(/\.(jpg|jpeg|png|gif|webp|svg|tiff?|bmp)$/i, ''),
  }
}

function buildGetInfoUrl(url) {
  const info = extractCloudinaryInfo(url)
  if (!info) return null
  return `https://res.cloudinary.com/${info.cloudName}/image/upload/fl_getinfo/${info.publicPath}`
}

// ---------------------------------------------------------------------------
// Palette + placeholder
// ---------------------------------------------------------------------------

function pickPalette(colors) {
  if (!Array.isArray(colors) || colors.length === 0) return null
  const sorted = [...colors].sort((a, b) => (b[1] || 0) - (a[1] || 0))
  const primary = sorted[0]?.[0] || null
  const secondary = sorted[1]?.[0] || primary
  return { primary, secondary }
}

function buildSvgPlaceholder(width, height, primary, secondary) {
  const safeWidth = Number.isFinite(width) ? width : 1200
  const safeHeight = Number.isFinite(height) ? height : 800
  const p1 = primary || '#222222'
  const p2 = secondary || primary || '#333333'
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${safeWidth}" height="${safeHeight}" viewBox="0 0 ${safeWidth} ${safeHeight}" preserveAspectRatio="none"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="${p1}"/><stop offset="100%" stop-color="${p2}"/></linearGradient></defs><rect width="100%" height="100%" fill="url(#g)"/></svg>`
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
}

// ---------------------------------------------------------------------------
// LQIP — fetch a 20px blurred JPEG from Cloudinary, inline as base64 so it
// paints instantly before the real image loads. Cached per-URL.
// ---------------------------------------------------------------------------

function buildLqipUrl(url) {
  if (!url.includes('res.cloudinary.com/')) return null
  const base = url.split('/upload/')[0] + '/upload/'
  const pathPart = url.split('/upload/')[1]
  if (!pathPart) return null
  return `${base}c_scale,e_blur:1000,f_jpg,q_20,w_20/${pathPart}`
}

async function fetchLqip(url) {
  const lqipUrl = buildLqipUrl(url)
  if (!lqipUrl) return null
  try {
    const res = await limiter(() => fetch(lqipUrl))
    if (!res.ok) return null
    const buf = Buffer.from(await res.arrayBuffer())
    // Sanity cap: something went wrong if a tiny blur is >8KB
    if (buf.length > 8 * 1024) return null
    return `data:image/jpeg;base64,${buf.toString('base64')}`
  } catch {
    return null
  }
}

function hasMeaningfulMeta(meta) {
  if (!meta || typeof meta !== 'object') return false
  return Boolean(
    meta.width ||
    meta.height ||
    (Array.isArray(meta.colors) && meta.colors.length > 0) ||
    meta.avgColor ||
    meta.secondaryColor
  )
}

// ---------------------------------------------------------------------------
// Rate limiter
// ---------------------------------------------------------------------------

const limiter = (() => {
  const queue = []
  let activeCount = 0
  let lastStart = 0
  const concurrency = 3
  const minTime = 150

  function runNext() {
    if (activeCount >= concurrency || queue.length === 0) return
    const now = Date.now()
    const wait = Math.max(0, minTime - (now - lastStart))

    const { task, resolve, reject } = queue.shift()
    activeCount += 1
    lastStart = now + wait

    setTimeout(async () => {
      try {
        const result = await task()
        resolve(result)
      } catch (error) {
        reject(error)
      } finally {
        activeCount -= 1
        runNext()
      }
    }, wait)
  }

  const schedule = (task) =>
    new Promise((resolve, reject) => {
      queue.push({ task, resolve, reject })
      runNext()
    })

  return schedule
})()

// ---------------------------------------------------------------------------
// Cloudinary metadata fetch (dimensions, colors, AND context alt/caption)
// ---------------------------------------------------------------------------

async function fetchCloudinaryMeta(url, cache) {
  const cached = cache[url]
  const needsMeta = !hasMeaningfulMeta(cached)
  const needsLqip = !cached?.lqip

  if (!needsMeta && !needsLqip) return cached

  const infoUrl = buildGetInfoUrl(url)
  if (!infoUrl) return cached || null

  try {
    let meta = cached || null
    if (needsMeta) {
      const res = await limiter(() => fetch(infoUrl))
      if (res.ok) {
        const json = await res.json()
        const colors = json.colors || json.output?.colors || null
        const palette = pickPalette(colors)
        meta = {
          width: json.output?.width || json.input?.width || null,
          height: json.output?.height || json.input?.height || null,
          colors,
          avgColor: palette?.primary || null,
          secondaryColor: palette?.secondary || null,
          alt: cached?.alt || null,
          caption: cached?.caption || null,
          lqip: cached?.lqip || null,
        }
      }
    }

    if (meta && needsLqip) {
      meta.lqip = await fetchLqip(url)
    }

    if (!meta || (!hasMeaningfulMeta(meta) && !meta.lqip)) return cached || null
    cache[url] = meta
    await saveCache(cache)
    return meta
  } catch {
    return cached || null
  }
}

// ---------------------------------------------------------------------------
// The remark plugin
// ---------------------------------------------------------------------------

export function remarkEnhanceImages() {
  return async (tree) => {
    const cache = await loadCache()
    const nodes = []

    visit(tree, 'image', (node, index, parent) => {
      if (node.url) {
        nodes.push({ node, index, parent })
      }
    })

    await Promise.all(
      nodes.map(async ({ node, index, parent }) => {
        // Always add loading/decoding to ALL images
        node.data = node.data || {}
        node.data.hProperties = node.data.hProperties || {}
        node.data.hProperties.loading = 'lazy'
        node.data.hProperties.decoding = 'async'

        const enhanced = enhanceImageUrl(node.url)
        const originalUrl = node.url
        if (enhanced !== node.url) {
          node.data.hProperties.srcset = enhanced.srcset
          node.data.hProperties.sizes = enhanced.sizes
          node.url = enhanced.src
        }

        const cloudMeta = await fetchCloudinaryMeta(originalUrl, cache)

        // -----------------------------------------------------------------
        // Alt text resolution: markdown > cloudinary cache > empty
        // -----------------------------------------------------------------
        let resolvedAlt = node.alt || ''

        if (isJunkAlt(resolvedAlt) && cloudMeta?.alt) {
          // Markdown alt is junk but Cloudinary has a real description
          resolvedAlt = cloudMeta.alt
          node.alt = resolvedAlt
        }

        // If markdown has good alt but Cloudinary doesn't, stash it for sync
        if (!isJunkAlt(resolvedAlt) && cloudMeta && !cloudMeta.alt) {
          cloudMeta.alt = resolvedAlt
          cloudMeta.caption = resolvedAlt
          cache[originalUrl] = cloudMeta
        }

        // Set title attribute (shows on hover) if we have meaningful alt
        if (!isJunkAlt(resolvedAlt)) {
          node.data.hProperties.title = resolvedAlt
        }

        // -----------------------------------------------------------------
        // Cloudinary visual metadata (dimensions, placeholders)
        // -----------------------------------------------------------------
        if (cloudMeta) {
          // Prefer Cloudinary LQIP (actual blurred thumbnail); fall back to
          // a 2-color SVG gradient if LQIP fetch failed.
          const placeholder = cloudMeta.lqip || buildSvgPlaceholder(
            cloudMeta.width,
            cloudMeta.height,
            cloudMeta.avgColor,
            cloudMeta.secondaryColor
          )
          const style = `background-color:${cloudMeta.avgColor || '#222222'};background-image:url("${placeholder}");background-size:cover;background-position:center;`

          const existingStyle = node.data.hProperties.style || ''
          const prefix =
            existingStyle && !existingStyle.trim().endsWith(';')
              ? `${existingStyle};`
              : existingStyle
          node.data.hProperties.style = `${prefix}${style}`
          if (cloudMeta.width) node.data.hProperties.width = cloudMeta.width
          if (cloudMeta.height) node.data.hProperties.height = cloudMeta.height
        }

        if (enhanced !== originalUrl) {
          const classes = ['img-full', 'my-8', 'rounded-sm', 'img-splay']

          const { rotation } = splayTransform(originalUrl)
          const splayStyle = `--splay-rot:${rotation}deg;`
          const currentStyle = node.data.hProperties.style || ''
          const joiner = currentStyle && !currentStyle.trim().endsWith(';') ? ';' : ''
          node.data.hProperties.style = `${currentStyle}${joiner}${splayStyle}`

          const width = cloudMeta?.width || enhanced.width
          const height = cloudMeta?.height || enhanced.height
          if (width && height) {
            const ratio = width / height
            node.data.hProperties['data-dimensions'] = `${width}×${height}`

            if (Math.abs(ratio - 1) < 0.1) {
              classes.push('aspect-square')
            } else if (Math.abs(ratio - 16 / 9) < 0.1) {
              classes.push('aspect-video')
            } else if (Math.abs(ratio - 3 / 4) < 0.1) {
              classes.push('aspect-[3/4]')
            }
          }

          node.data.hProperties.className = classes.join(' ')
          node.data.hProperties.crossorigin = 'anonymous'
        }

        // -----------------------------------------------------------------
        // Wrap in <figure> + <figcaption> for semantic HTML
        // Only when we have meaningful alt text on a Cloudinary image
        // -----------------------------------------------------------------
        if (!isJunkAlt(resolvedAlt) && enhanced !== originalUrl && parent && index !== undefined) {
          // Create a figcaption node
          const figcaption = {
            type: 'html',
            value: `<figcaption>${resolvedAlt}</figcaption>`,
          }

          // Wrap the image node in a figure
          const figure = {
            type: 'html',
            value: `<figure role="figure" aria-label="${resolvedAlt.replace(/"/g, '&quot;')}">`,
          }
          const figureClose = {
            type: 'html',
            value: '</figure>',
          }

          // Replace the image node with figure > img + figcaption
          parent.children.splice(index, 1, figure, node, figcaption, figureClose)
        }
      })
    )

    // Save cache with any alt text updates
    await saveCache(cache)
  }
}
