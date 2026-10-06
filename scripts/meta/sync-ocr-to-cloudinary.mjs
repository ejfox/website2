#!/usr/bin/env node
/**
 * sync-ocr-to-cloudinary.mjs
 *
 * Pushes the OCR text that `yarn check:images` keeps locally
 * (data/_tool-cache/image-ocr.json) onto each Cloudinary asset as contextual
 * metadata, so the text travels WITH the image and anything else can use it
 * (search, alt text, the Cloudinary console).
 *
 * Context values cap at 1024 chars, so text is split across ocr_1…ocr_N
 * (plus ocr_parts and ocr_at). Keys are ADDED with the context API's `add`
 * command, so existing alt/caption context is left alone.
 *
 * NEVER pushes text for an image the screenshot guard flagged, or one in the
 * allowlist — for those the OCR text may be the secret itself. Text that is
 * just OCR noise from a photo is skipped too.
 *
 * Usage:
 *   node scripts/meta/sync-ocr-to-cloudinary.mjs           # dry run
 *   node scripts/meta/sync-ocr-to-cloudinary.mjs --write   # push
 *
 * Needs CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET.
 * Already-pushed text is remembered in data/_tool-cache/ocr-cloudinary-synced.json
 * (by content hash), so re-runs only push what's new or changed.
 */

import { promises as fs } from 'node:fs'
import path from 'node:path'
import { createHash } from 'node:crypto'

const ROOT = process.cwd()
const OCR_TEXT = path.join(ROOT, 'data/_tool-cache/image-ocr.json')
const SYNCED = path.join(ROOT, 'data/_tool-cache/ocr-cloudinary-synced.json')
const SCAN = path.join(ROOT, 'data/image-pii-scan.json')
const ALLOW = path.join(ROOT, 'data/image-pii-allow.json')

const WRITE = process.argv.includes('--write')
const CHUNK = 1000 // under Cloudinary's 1024-char value cap, after escaping
const MAX_PARTS = 20
const DELAY_MS = 150

const readJson = async (f, fallback) => {
  try {
    return JSON.parse(await fs.readFile(f, 'utf8'))
  } catch {
    return fallback
  }
}

/** https://res.cloudinary.com/ejf/image/upload/v123/folder/name.png → { cloud, publicId } */
export function parseCloudinary(url) {
  const m = url.split(/[?#]/)[0].match(/^https?:\/\/res\.cloudinary\.com\/([^/]+)\/image\/upload\/(.+)$/)
  if (!m) return null
  const parts = m[2].split('/')
  // Drop transformation segments and the version, keep the folder path.
  while (parts.length > 1 && (/^v\d+$/.test(parts[0]) || parts[0].includes(',') || /^[a-z]{1,3}_[^/]+$/.test(parts[0]))) {
    parts.shift()
  }
  return { cloud: m[1], publicId: decodeURIComponent(parts.join('/')).replace(/\.[a-z0-9]{2,5}$/i, '') }
}

/** OCR of a photo is noise like "Bs -_ ff ae". Require some actual words. */
export function isMeaningful(text) {
  return (text.match(/\b[A-Za-z]{3,}\b/g) || []).length >= 5
}

export function clean(text) {
  return text
    .replace(/[^\S\n]+/g, ' ')
    .replace(/\n{2,}/g, '\n')
    .trim()
}

/** Escape Cloudinary context delimiters (| and =) with backslashes. */
const esc = (s) => s.replace(/([\\|=])/g, '\\$1')

export function toContext(text, at) {
  const chunks = []
  for (let i = 0; i < text.length && chunks.length < MAX_PARTS; i += CHUNK) chunks.push(text.slice(i, i + CHUNK))
  const pairs = chunks.map((c, i) => `ocr_${i + 1}=${esc(c)}`)
  pairs.push(`ocr_parts=${chunks.length}`, `ocr_at=${at}`)
  return pairs.join('|')
}

async function addContext({ cloud, publicId }, context) {
  const { CLOUDINARY_API_KEY: key, CLOUDINARY_API_SECRET: secret } = process.env
  const ts = Math.floor(Date.now() / 1000)
  const params = { command: 'add', context, public_ids: publicId, timestamp: ts, type: 'upload' }
  // Signed upload-API call: sha1 of the sorted params + secret.
  const toSign = Object.keys(params)
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join('&')
  const signature = createHash('sha1').update(toSign + secret).digest('hex')
  const body = new URLSearchParams({ ...params, api_key: key, signature })
  body.delete('public_ids')
  body.append('public_ids[]', publicId)
  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloud}/image/context`, {
    method: 'POST',
    body,
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`)
}

async function main() {
  const texts = await readJson(OCR_TEXT, null)
  if (!texts) {
    console.error(`No OCR text at ${path.relative(ROOT, OCR_TEXT)} — run \`yarn check:images\` first.`)
    process.exit(1)
  }
  const scan = (await readJson(SCAN, {})).images || {}
  const allow = await readJson(ALLOW, {})
  const synced = await readJson(SYNCED, {})
  const at = new Date().toISOString().slice(0, 10)

  const plan = []
  const skipped = { flagged: 0, allowlisted: 0, noise: 0, notCloudinary: 0, unscanned: 0, unchanged: 0 }
  for (const [url, raw] of Object.entries(texts)) {
    const target = parseCloudinary(url)
    if (!target) { skipped.notCloudinary++; continue }
    // Only push text the guard has looked at and passed under current rules.
    const verdict = scan[url]
    if (!verdict) { skipped.unscanned++; continue }
    if (verdict.hits?.length) { skipped.flagged++; continue }
    if (allow[url]) { skipped.allowlisted++; continue }
    const text = clean(raw)
    if (!isMeaningful(text)) { skipped.noise++; continue }
    const hash = createHash('sha1').update(text).digest('hex').slice(0, 16)
    if (synced[url] === hash) { skipped.unchanged++; continue }
    plan.push({ url, target, text, hash })
  }

  console.log(`${WRITE ? '✏️  WRITE' : '👀 DRY RUN'} — ${plan.length} image(s) to push`)
  console.log(`skipped: ${Object.entries(skipped).map(([k, v]) => `${k} ${v}`).join(', ')}`)
  const chars = plan.reduce((n, p) => n + p.text.length, 0)
  console.log(`${chars.toLocaleString()} chars of text, ${plan.filter((p) => p.text.length > CHUNK).length} split across several keys`)
  if (!WRITE) {
    for (const p of plan.slice(0, 5)) console.log(`  ${p.target.publicId}: ${JSON.stringify(p.text.slice(0, 80))}…`)
    console.log('\nRun with --write to push.')
    return
  }
  for (const k of ['CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET']) {
    if (!process.env[k]) {
      console.error(`${k} is not set`)
      process.exit(1)
    }
  }

  let ok = 0
  const failed = []
  for (const p of plan) {
    try {
      await addContext(p.target, toContext(p.text, at))
      synced[p.url] = p.hash
      if (++ok % 50 === 0) {
        console.log(`  ${ok}/${plan.length}`)
        await fs.writeFile(SYNCED, JSON.stringify(synced, null, 1) + '\n')
      }
    } catch (e) {
      failed.push(`${p.target.publicId}: ${e.message}`)
    }
    await new Promise((r) => setTimeout(r, DELAY_MS))
  }
  await fs.writeFile(SYNCED, JSON.stringify(synced, null, 1) + '\n')
  console.log(`\n✓ pushed ${ok}/${plan.length}`)
  if (failed.length) {
    console.log(`✗ ${failed.length} failed:`)
    for (const f of failed.slice(0, 20)) console.log('  ' + f)
    process.exit(1)
  }
}

if (import.meta.url === `file://${process.argv[1]}`) main()
