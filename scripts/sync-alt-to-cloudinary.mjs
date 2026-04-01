#!/usr/bin/env node
/**
 * sync-alt-to-cloudinary.mjs
 *
 * Reads all blog markdown, extracts image alt text, and upserts it
 * into Cloudinary's context metadata (alt + caption fields).
 * This ensures alt text is stored WITH the asset, not just in markdown.
 *
 * Usage:
 *   node scripts/sync-alt-to-cloudinary.mjs             # dry-run
 *   node scripts/sync-alt-to-cloudinary.mjs --write      # push to Cloudinary
 */

import { promises as fs } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const CONTENT_DIR = path.resolve(__dirname, '..', 'content', 'blog')

const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME
const API_KEY = process.env.CLOUDINARY_API_KEY
const API_SECRET = process.env.CLOUDINARY_API_SECRET

if (!CLOUD_NAME || !API_KEY || !API_SECRET) {
  console.error('Error: CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET required')
  console.error('Set them in your environment or .env file')
  process.exit(1)
}

const args = process.argv.slice(2)
const WRITE_MODE = args.includes('--write')

const ALL_IMAGES_RE = /!\[([^\]]*)\]\(([^)]+)\)/g
const DELAY_MS = 200

function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

function isCloudinaryUrl(url) { return url.includes('res.cloudinary.com/') }
function isVideoUrl(url) {
  return /\.(mp4|webm|mov|gif)(\?|$)/i.test(url) || url.includes('/video/upload/')
}

/**
 * Extract the public_id from a Cloudinary URL.
 * e.g. https://res.cloudinary.com/ejf/image/upload/v1742920150/IMG_3168.jpg -> IMG_3168
 */
function extractPublicId(url) {
  const clean = url.replace(/^http:\/\//i, 'https://').split(/[?#]/)[0]
  const match = clean.match(/\/upload\/(.+)$/)
  if (!match) return null

  const parts = match[1].split('/')
  // Skip transform segments and version
  const filtered = parts.filter(p => {
    if (/^v\d+$/.test(p)) return false
    if (p.includes(',') || /^[cwhfqget]_/.test(p)) return false
    return true
  })

  const joined = filtered.join('/')
  // Remove file extension
  return joined.replace(/\.(jpg|jpeg|png|gif|webp|svg|tiff?|bmp|mp4|webm|mov)$/i, '')
}

/**
 * Push alt text to Cloudinary's context metadata via the explicit API.
 */
async function updateCloudinaryContext(publicId, altText, resourceType = 'image') {
  const url = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/${resourceType}/explicit`
  const auth = Buffer.from(`${API_KEY}:${API_SECRET}`).toString('base64')

  // Escape pipe and equals (Cloudinary context delimiters)
  const safeAlt = altText.replace(/\|/g, ' ').replace(/=/g, ' ')

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Basic ${auth}`,
    },
    body: JSON.stringify({
      public_id: publicId,
      type: 'upload',
      context: `alt=${safeAlt}|caption=${safeAlt}`,
    }),
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Cloudinary ${response.status}: ${text}`)
  }

  return response.json()
}

async function findMarkdownFiles(dir) {
  const files = []
  const entries = await fs.readdir(dir, { withFileTypes: true })
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) files.push(...(await findMarkdownFiles(fullPath)))
    else if (entry.name.endsWith('.md')) files.push(fullPath)
  }
  return files
}

async function main() {
  console.log(`\n☁️  Sync Alt Text to Cloudinary`)
  console.log(`Mode: ${WRITE_MODE ? '✏️  WRITE' : '👀 DRY RUN'}\n`)

  const files = await findMarkdownFiles(CONTENT_DIR)

  // Collect all image -> alt text mappings (dedupe by public_id, last write wins)
  const altMap = new Map()

  for (const filePath of files) {
    const content = await fs.readFile(filePath, 'utf8')
    for (const match of content.matchAll(ALL_IMAGES_RE)) {
      const alt = match[1].trim()
      const url = match[2]

      if (!alt || !isCloudinaryUrl(url) || isVideoUrl(url)) continue

      const publicId = extractPublicId(url)
      if (!publicId) continue

      // Skip junk alt text
      if (/^(Screenshot|Screen Shot|IMG_|DSC|Pasted image)/i.test(alt)) continue
      if (/^[A-Za-z0-9_.-]+\.(png|jpe?g|gif)$/i.test(alt)) continue
      if (/^\d{4}-\d{2}-\d{2}/.test(alt)) continue

      altMap.set(publicId, { alt, url })
    }
  }

  console.log(`Found ${altMap.size} Cloudinary images with good alt text\n`)

  let synced = 0
  let failed = 0

  for (const [publicId, { alt }] of altMap) {
    if (WRITE_MODE) {
      try {
        await updateCloudinaryContext(publicId, alt)
        synced++
        if (synced % 50 === 0) console.log(`  ... ${synced}/${altMap.size}`)
        await sleep(DELAY_MS)
      } catch (err) {
        console.error(`  ❌ ${publicId}: ${err.message}`)
        failed++
      }
    } else {
      synced++
    }
  }

  console.log(`\n📊 Summary:`)
  console.log(`   Images with alt text: ${altMap.size}`)
  console.log(`   Synced to Cloudinary: ${synced}`)
  if (failed > 0) console.log(`   Failed: ${failed}`)

  if (!WRITE_MODE) {
    console.log(`\n💡 Run with --write to push to Cloudinary`)
  }
}

main().catch(err => { console.error('Fatal error:', err); process.exit(1) })
