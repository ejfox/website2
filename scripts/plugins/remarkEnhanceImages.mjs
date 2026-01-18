/**
 * @file plugins/remarkEnhanceImages.mjs
 * @description Adds lazy-loading and Cloudinary srcset/sizing + placeholder data
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

const enhanceImageUrl = (url) => {
  if (!url.includes('res.cloudinary.com/')) return url
  url = url.replace(/^http:\/\//i, 'https://')
  const base = url.split('/upload/')[0] + '/upload/'
  const pathPart = url.split('/upload/')[1]

  // Extract dimensions from URL if present (e.g., w_1920,h_1080)
  const widthMatch = url.match(/w_(\d+)/)
  const heightMatch = url.match(/h_(\d+)/)
  const width = widthMatch ? Number.parseInt(widthMatch[1]) : null
  const height = heightMatch ? Number.parseInt(heightMatch[1]) : null

  const srcset = [
    `${base}c_scale,dpr_auto,f_auto,q_auto:good,w_400/${pathPart} 400w`,
    `${base}c_scale,dpr_auto,f_auto,q_auto:good,w_800/${pathPart} 800w`,
    `${base}c_scale,dpr_auto,f_auto,q_auto:good,w_1200/${pathPart} 1200w`,
  ].join(', ')

  return {
    src: `${base}c_scale,dpr_auto,f_auto,q_auto:good,w_800/${pathPart}`,
    srcset,
    sizes: '(max-width: 430px) 92vw, (max-width: 768px) 85vw, 900px',
    // Removed blur placeholder - user doesn't want blurred images
    // placeholder: `${base}c_scale,f_auto,q_1,w_20,e_blur:1000/${path}`,
    width,
    height,
  }
}

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

function isTransformSegment(segment) {
  return (
    segment.includes(',') ||
    /^(c|w|h|f|q|g|e|t)_[^/]+/.test(segment)
  )
}

function extractCloudinaryInfo(url) {
  const cleanUrl = url.split(/[?#]/)[0]
  const match = cleanUrl.match(
    /https?:\/\/res\\.cloudinary\\.com\\/([^/]+)\\/image\\/upload\\/(.+)$/i
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
  }
}

function buildGetInfoUrl(url) {
  const info = extractCloudinaryInfo(url)
  if (!info) return null
  return `https://res.cloudinary.com/${info.cloudName}/image/upload/fl_getinfo/${info.publicPath}`
}

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
  const svg = `<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"${safeWidth}\" height=\"${safeHeight}\" viewBox=\"0 0 ${safeWidth} ${safeHeight}\" preserveAspectRatio=\"none\"><defs><linearGradient id=\"g\" x1=\"0\" y1=\"0\" x2=\"1\" y2=\"1\"><stop offset=\"0%\" stop-color=\"${p1}\"/><stop offset=\"100%\" stop-color=\"${p2}\"/></linearGradient></defs><rect width=\"100%\" height=\"100%\" fill=\"url(#g)\"/></svg>`
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
}

async function fetchCloudinaryMeta(url, cache) {
  if (cache[url]) return cache[url]
  const infoUrl = buildGetInfoUrl(url)
  if (!infoUrl) return null

  try {
    const res = await fetch(infoUrl)
    if (!res.ok) return null
    const json = await res.json()
    const palette = pickPalette(json.colors)
    const meta = {
      width: json.width || null,
      height: json.height || null,
      colors: json.colors || null,
      avgColor: palette?.primary || null,
      secondaryColor: palette?.secondary || null,
    }
    cache[url] = meta
    await saveCache(cache)
    return meta
  } catch {
    return null
  }
}

export function remarkEnhanceImages() {
  return async (tree) => {
    const cache = await loadCache()
    const nodes = []

    visit(tree, 'image', (node) => {
      if (node.url) {
        nodes.push(node)
      }
    })

    await Promise.all(
      nodes.map(async (node) => {
        // Always add loading/decoding to ALL images (performance optimization)
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
        if (cloudMeta) {
          const placeholder = buildSvgPlaceholder(
            cloudMeta.width,
            cloudMeta.height,
            cloudMeta.avgColor,
            cloudMeta.secondaryColor
          )
          const style = `background-color:${cloudMeta.avgColor || '#222222'};background-image:url(\"${placeholder}\");background-size:cover;background-position:center;`

          const existingStyle = node.data.hProperties.style || ''
          const prefix =
            existingStyle && !existingStyle.trim().endsWith(';')
              ? `${existingStyle};`
              : existingStyle
          node.data.hProperties.style = `${prefix}${style}`
          node.data.hProperties['data-placeholder'] = placeholder
          node.data.hProperties['data-average-color'] = cloudMeta.avgColor
          if (cloudMeta.width) node.data.hProperties.width = cloudMeta.width
          if (cloudMeta.height) node.data.hProperties.height = cloudMeta.height
        }

        if (enhanced !== originalUrl) {
          // Grid-based image classes
          const classes = ['img-full', 'my-8', 'rounded-sm']

          // Detect aspect ratio from dimensions
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
      })
    )
  }
}
