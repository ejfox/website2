#!/usr/bin/env node
/**
 * @file hydrate-cloudinary-cache.mjs
 * @description Fill data/cloudinary-image-cache.json with width, height and
 *   dominant colors for every Cloudinary URL found in content/blog/**.md.
 *   Run by hand: `node scripts/meta/hydrate-cloudinary-cache.mjs` (no yarn
 *   script). Network: one public `fl_getinfo` GET per uncached URL, no API key.
 *   Only fetches URLs with no meaningful entry yet, so re-runs are cheap.
 *   Writes the cache in place (checkpoints every 50 URLs); resolves paths from
 *   process.cwd(), so run it from the repo root.
 */

import { promises as fs } from 'node:fs'
import path from 'node:path'

const ROOT = process.cwd()
const BLOG_DIR = path.join(ROOT, 'content', 'blog')
const CACHE_PATH = path.join(ROOT, 'data', 'cloudinary-image-cache.json')

const CLOUDINARY_URL_RE =
  /https?:\/\/res\.cloudinary\.com\/[^/\s"'<>]+\/image\/upload\/[^\s"'<>]+/gi

// ── URL parsing ─────────────────────────────────────────────

// A leading path segment like `c_fill,w_800` or `f_auto` is a transformation,
// not part of the asset's public path.
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
  }
}

function buildGetInfoUrl(url) {
  const info = extractCloudinaryInfo(url)
  if (!info) return null
  return `https://res.cloudinary.com/${info.cloudName}/image/upload/fl_getinfo/${info.publicPath}`
}

// ── Cache + content scan ────────────────────────────────────

// colors is Cloudinary's [[hex, percent], ...]; take the two most common.
function pickPalette(colors) {
  if (!Array.isArray(colors) || colors.length === 0) return null
  const sorted = [...colors].sort((a, b) => (b[1] || 0) - (a[1] || 0))
  const primary = sorted[0]?.[0] || null
  const secondary = sorted[1]?.[0] || primary
  return { primary, secondary }
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

async function walk(dir, files = [], extension = '.md') {
  const entries = await fs.readdir(dir, { withFileTypes: true })
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      await walk(fullPath, files, extension)
    } else if (entry.isFile() && entry.name.endsWith(extension)) {
      files.push(fullPath)
    }
  }
  return files
}

async function collectUrls() {
  const files = await walk(BLOG_DIR, [], '.md')
  const urls = new Set()

  for (const filePath of files) {
    let raw
    try {
      raw = await fs.readFile(filePath, 'utf8')
    } catch {
      continue
    }

    const matches = raw.match(CLOUDINARY_URL_RE)
    if (!matches) continue
    for (const match of matches) {
      // The regex over-captures in markdown (`url](next-url)`, trailing `)`),
      // so trim back to the URL itself before using it as a cache key.
      const normalized = match
        .replace(/^http:\/\//i, 'https://')
        .split('](')[0]
        .replace(/[\\)\]>,"']+$/g, '')
      urls.add(normalized)
    }
  }

  return Array.from(urls)
}

// ── Fetching (rate-limited) ─────────────────────────────────

// At most 3 requests in flight and ≥150ms between starts, to stay polite to
// Cloudinary's public delivery endpoint.
const limiter = (() => {
  const queue = []
  let activeCount = 0
  let lastStart = 0
  const concurrency = 3
  const minTime = 150

  // Hoisted function declaration to avoid use-before-define
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

async function fetchMeta(url) {
  const infoUrl = buildGetInfoUrl(url)
  if (!infoUrl) return null
  const res = await limiter(() => fetchWithRetry(infoUrl))
  if (!res) return null
  const json = await res.json()
  const colors = json.colors || json.output?.colors || null
  const palette = pickPalette(colors)
  return {
    width: json.output?.width || json.input?.width || null,
    height: json.output?.height || json.input?.height || null,
    colors,
    avgColor: palette?.primary || null,
    secondaryColor: palette?.secondary || null,
  }
}

async function fetchWithRetry(url, attempts = 3) {
  let lastError
  for (let i = 0; i < attempts; i += 1) {
    try {
      const res = await fetch(url)
      if (res.ok) return res
      // Only rate limits and server errors are worth retrying; a 404 won't heal.
      if (![429, 500, 502, 503, 504].includes(res.status)) return null
    } catch (error) {
      lastError = error
    }
    const backoff = 300 * Math.pow(2, i)
    await new Promise((resolve) => setTimeout(resolve, backoff))
  }
  if (lastError) throw lastError
  return null
}

function isLikelyValidUrl(url) {
  if (!url.includes('/image/upload/')) return false
  const info = extractCloudinaryInfo(url)
  if (!info || !info.publicPath) return false
  // A trailing dash is a URL the regex cut short, not a real asset.
  if (info.publicPath.endsWith('-')) return false
  return true
}

// ── Main ────────────────────────────────────────────────────

async function main() {
  const cache = await loadCache()
  const urls = await collectUrls()

  const targets = urls.filter(
    (url) => isLikelyValidUrl(url) && !hasMeaningfulMeta(cache[url])
  )
  console.info(`Found ${urls.length} URLs, ${targets.length} missing metadata`)

  let index = 0
  let processed = 0
  let updated = 0

  const workers = Array.from({ length: 3 }, async () => {
    while (index < targets.length) {
      const current = targets[index++]
      try {
        const meta = await fetchMeta(current)
        if (hasMeaningfulMeta(meta)) {
          cache[current] = meta
          console.info(`✓ ${current}`)
          updated += 1
        } else {
          console.info(`- ${current}`)
        }
      } catch {
        console.info(`x ${current}`)
      }
      processed += 1
      if (processed % 50 === 0 && updated > 0) {
        await saveCache(cache)
      }
    }
  })

  await Promise.all(workers)
  await saveCache(cache)
  console.info(`Saved cache to ${CACHE_PATH}`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
