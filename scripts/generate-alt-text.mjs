#!/usr/bin/env node
/**
 * generate-alt-text.mjs
 *
 * Scans blog markdown for images with bad alt text (empty, filenames, timestamps)
 * and uses multimodal AI to generate real, content-focused descriptions.
 *
 * Usage:
 *   node scripts/generate-alt-text.mjs                    # dry-run (default)
 *   node scripts/generate-alt-text.mjs --write             # modify files
 *   node scripts/generate-alt-text.mjs --file path         # single file
 *   node scripts/generate-alt-text.mjs --empty-only        # only empty alt text
 *   node scripts/generate-alt-text.mjs --apply-review      # apply edited review file
 *   node scripts/generate-alt-text.mjs --provider openai   # use OpenAI (default: anthropic)
 */

import { promises as fs } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const CONTENT_DIR = path.resolve(__dirname, '..', 'content', 'blog')

// ---------------------------------------------------------------------------
// Provider config
// ---------------------------------------------------------------------------

const args = process.argv.slice(2)
const providerIdx = args.indexOf('--provider')
const PROVIDER = providerIdx !== -1 ? args[providerIdx + 1] : (process.env.ALT_TEXT_PROVIDER || 'anthropic')

const PROVIDERS = {
  anthropic: {
    envKey: 'ANTHROPIC_API_KEY',
    model: 'claude-haiku-4-5-20251001',
  },
  openai: {
    envKey: 'OPENAI_API_KEY',
    model: 'gpt-4o-mini',
  },
}

const providerConfig = PROVIDERS[PROVIDER]
if (!providerConfig) {
  console.error(`Unknown provider "${PROVIDER}". Use: anthropic, openai`)
  process.exit(1)
}

const API_KEY = process.env[providerConfig.envKey]
if (!API_KEY) {
  console.error(`Error: ${providerConfig.envKey} environment variable is required`)
  process.exit(1)
}

// ---------------------------------------------------------------------------
// Shared prompt
// ---------------------------------------------------------------------------

const ALT_TEXT_PROMPT = `Write alt text for this image. Return JSON only:
{"alt": "...", "confidence": 0.95}

Your job is to describe the CONTENT — what is this about, what does it show, what does it mean to a reader who can't see it.

- One sentence, max 25 words. Shorter is better.
- Go DEEP, not wide. Don't describe the medium — describe the subject.
  Bad: "Three film contact sheets with black and white photographs"
  Good: "Contact sheets of street portraits and candid city scenes shot on black and white film"
  Bad: "Hand-drawn notes with sections and bullet points"
  Good: "Project planning sketch outlining milestones, weekly goals, and design method priorities"
  Bad: "Code editor with JavaScript source code"
  Good: "JavaScript CSV parser that groups rows by date and calculates running totals"
- If there's readable text, tell me what it SAYS, not that text exists.
- If it's a collection (contact sheet, grid, collage), describe what the individual items are OF.
- No editorializing or interpreting. No "represents" or "symbolizes."
- Never start with "Image of", "Photo of", "Screenshot of"
- Never hedge: no "appears", "seems", "looks like"
- confidence: 0-1. Low if blurry or too small to read the actual content.`

// ---------------------------------------------------------------------------
// Provider-specific API calls
// ---------------------------------------------------------------------------

async function callAnthropic(imageUrl) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: providerConfig.model,
      max_tokens: 200,
      messages: [{
        role: 'user',
        content: [
          { type: 'image', source: { type: 'url', url: imageUrl } },
          { type: 'text', text: ALT_TEXT_PROMPT },
        ],
      }],
    }),
  })
  if (!response.ok) throw new Error(`Anthropic ${response.status}: ${await response.text()}`)
  const data = await response.json()
  return data.content[0].text.trim()
}

async function callOpenAI(imageUrl) {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      model: providerConfig.model,
      max_tokens: 200,
      messages: [{
        role: 'user',
        content: [
          { type: 'image_url', image_url: { url: imageUrl, detail: 'low' } },
          { type: 'text', text: ALT_TEXT_PROMPT },
        ],
      }],
    }),
  })
  if (!response.ok) throw new Error(`OpenAI ${response.status}: ${await response.text()}`)
  const data = await response.json()
  return data.choices[0].message.content.trim()
}

const callProvider = PROVIDER === 'openai' ? callOpenAI : callAnthropic

// ---------------------------------------------------------------------------
// Image handling
// ---------------------------------------------------------------------------

const WRITE_MODE = args.includes('--write')
const EMPTY_ONLY = args.includes('--empty-only')
const singleFileIdx = args.indexOf('--file')
const SINGLE_FILE = singleFileIdx !== -1 ? args[singleFileIdx + 1] : null

const ALL_IMAGES_RE = /!\[([^\]]*)\]\(([^)]+)\)/g
const CONFIDENCE_THRESHOLD = 0.8
const DELAY_MS = 600

const JUNK_ALT_PATTERNS = [
  /^Screenshot/i, /^Screen Shot/i, /^Pasted image/i, /^IMG_/, /^DSC/, /^DJI_/,
  /^DSCF/, /^Photo /i, /^CleanShot/i, /^Untitled/i, /^image\d*/i,
  /^[A-Fa-f0-9]{8}-[A-Fa-f0-9]{4}/,
  /^[A-Za-z0-9_.-]+\.(png|jpe?g|gif|webp|svg|tiff?)$/i,
  /^\d{4}-\d{2}-\d{2}/,
]

function isJunkAlt(alt) {
  if (!alt || alt.trim().length === 0) return true
  return JUNK_ALT_PATTERNS.some(p => p.test(alt.trim()))
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }
function isCloudinaryUrl(url) { return url.includes('res.cloudinary.com/') }
function isVideoUrl(url) {
  return /\.(mp4|webm|mov|gif)(\?|$)/i.test(url) || url.includes('/video/upload/')
}

function getImageUrl(url) {
  if (!isCloudinaryUrl(url)) return url
  url = url.replace(/^http:\/\//i, 'https://')
  const parts = url.split('/upload/')
  if (parts.length !== 2) return url
  return `${parts[0]}/upload/c_scale,w_1280,f_jpg,q_auto/${parts[1]}`
}

function parseAltResponse(raw) {
  try {
    const cleaned = raw.replace(/^```json?\n?/, '').replace(/\n?```$/, '').trim()
    const parsed = JSON.parse(cleaned)
    const altText = parsed.alt.trim().replace(/\[/g, '(').replace(/\]/g, ')')
    const confidence = typeof parsed.confidence === 'number' ? parsed.confidence : 0.5
    return { altText, confidence }
  } catch {
    return { altText: raw.replace(/\[/g, '(').replace(/\]/g, ')'), confidence: 0.5 }
  }
}

async function generateAltText(imageUrl) {
  const url = getImageUrl(imageUrl)
  const raw = await callProvider(url)
  return parseAltResponse(raw)
}

// ---------------------------------------------------------------------------
// File processing
// ---------------------------------------------------------------------------

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

async function processFile(filePath) {
  const content = await fs.readFile(filePath, 'utf8')
  const matches = [...content.matchAll(ALL_IMAGES_RE)]
  if (matches.length === 0) return { file: filePath, changes: 0, skipped: 0, total: 0, needsReview: [] }

  const needsFix = matches.filter(m => {
    const alt = m[1]
    if (EMPTY_ONLY) return !alt || alt.trim().length === 0
    return isJunkAlt(alt)
  })
  if (needsFix.length === 0) return { file: filePath, changes: 0, skipped: 0, total: matches.length, needsReview: [] }

  const relPath = path.relative(path.resolve(__dirname, '..'), filePath)
  console.log(`\n📄 ${relPath} — ${needsFix.length}/${matches.length} image(s) need alt text`)

  let newContent = content
  let changes = 0
  let skipped = 0
  const needsReview = []

  for (const match of needsFix) {
    const fullMatch = match[0]
    const oldAlt = match[1]
    const imageUrl = match[2]

    if (isVideoUrl(imageUrl)) { skipped++; continue }
    if (!isCloudinaryUrl(imageUrl)) { skipped++; continue }

    try {
      const label = oldAlt ? `(was: "${oldAlt.slice(0, 40)}...")` : '(empty)'
      process.stdout.write(`  🔍 ${label} `)
      const { altText, confidence } = await generateAltText(imageUrl)
      const conf = (confidence * 100).toFixed(0)

      if (confidence >= CONFIDENCE_THRESHOLD) {
        console.log(`✅ [${conf}%] "${altText.slice(0, 80)}${altText.length > 80 ? '...' : ''}"`)
        const replacement = `![${altText}](${imageUrl})`
        const idx = newContent.indexOf(fullMatch)
        if (idx !== -1) {
          newContent = newContent.slice(0, idx) + replacement + newContent.slice(idx + fullMatch.length)
        }
        changes++
      } else {
        console.log(`⚠️  [${conf}%] "${altText.slice(0, 80)}${altText.length > 80 ? '...' : ''}"`)
        const lines = content.slice(0, content.indexOf(fullMatch)).split('\n')
        needsReview.push({ file: relPath, line: lines.length, url: imageUrl.slice(0, 100), suggested: altText, confidence })
      }
      await sleep(DELAY_MS)
    } catch (err) {
      console.error(`  ❌ Failed: ${err.message}`)
      skipped++
    }
  }

  if (changes > 0 && WRITE_MODE) {
    await fs.writeFile(filePath, newContent, 'utf8')
    console.log(`  💾 Wrote ${changes} change(s)`)
  } else if (changes > 0) {
    console.log(`  🏜  Dry run — ${changes} change(s) would be written (use --write to apply)`)
  }
  if (needsReview.length > 0) {
    console.log(`  👁  ${needsReview.length} need manual review (confidence < ${CONFIDENCE_THRESHOLD * 100}%)`)
  }
  return { file: filePath, changes, skipped, total: matches.length, needsReview }
}

// ---------------------------------------------------------------------------
// Main + review apply
// ---------------------------------------------------------------------------

async function main() {
  console.log(`\n🖼  Alt Text Generator`)
  console.log(`Provider: ${PROVIDER} (${providerConfig.model})`)
  console.log(`Mode: ${WRITE_MODE ? '✏️  WRITE' : '👀 DRY RUN'}`)
  console.log(`Scope: ${EMPTY_ONLY ? 'Empty alt text only' : 'Empty + junk (filenames, timestamps, UUIDs)'}`)
  console.log(`Source: ${SINGLE_FILE || CONTENT_DIR}\n`)

  const files = SINGLE_FILE ? [path.resolve(SINGLE_FILE)] : await findMarkdownFiles(CONTENT_DIR)

  let totalImages = 0, totalChanges = 0, totalSkipped = 0, filesModified = 0
  const allNeedsReview = []

  for (const file of files) {
    const result = await processFile(file)
    totalImages += result.total
    totalChanges += result.changes
    totalSkipped += result.skipped
    if (result.changes > 0) filesModified++
    allNeedsReview.push(...result.needsReview)
  }

  console.log(`\n📊 Summary:`)
  console.log(`   Provider: ${PROVIDER} (${providerConfig.model})`)
  console.log(`   Files scanned: ${files.length}`)
  console.log(`   Total images found: ${totalImages}`)
  console.log(`   Auto-applied (≥${CONFIDENCE_THRESHOLD * 100}%): ${totalChanges} across ${filesModified} files`)
  console.log(`   Needs manual review (<${CONFIDENCE_THRESHOLD * 100}%): ${allNeedsReview.length}`)
  console.log(`   Skipped (video/local/error): ${totalSkipped}`)

  if (allNeedsReview.length > 0) {
    const reviewPath = path.resolve(__dirname, '..', 'data', 'alt-text-review.json')
    await fs.mkdir(path.dirname(reviewPath), { recursive: true })
    await fs.writeFile(reviewPath, JSON.stringify(allNeedsReview, null, 2))
    console.log(`\n👁  Review file written: ${path.relative(path.resolve(__dirname, '..'), reviewPath)}`)
    console.log(`   Open it, fix the "suggested" fields, then run:`)
    console.log(`   node scripts/generate-alt-text.mjs --apply-review`)
  }
  if (!WRITE_MODE && totalChanges > 0) {
    console.log(`\n💡 Run with --write to apply changes`)
  }
}

async function applyReview() {
  const reviewPath = path.resolve(__dirname, '..', 'data', 'alt-text-review.json')
  let items
  try { items = JSON.parse(await fs.readFile(reviewPath, 'utf8')) }
  catch { console.error('No review file found at data/alt-text-review.json'); process.exit(1) }

  console.log(`\n📝 Applying ${items.length} reviewed alt text entries...\n`)

  const byFile = {}
  for (const item of items) {
    const absPath = path.resolve(__dirname, '..', item.file)
    if (!byFile[absPath]) byFile[absPath] = []
    byFile[absPath].push(item)
  }

  let applied = 0
  for (const [filePath, fileItems] of Object.entries(byFile)) {
    let content = await fs.readFile(filePath, 'utf8')
    for (const item of fileItems) {
      if (!item.suggested || item.suggested.startsWith('SKIP')) continue
      const escapedUrl = item.url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      const re = new RegExp(`!\\[[^\\]]*\\]\\(${escapedUrl}[^)]*\\)`)
      const match = content.match(re)
      if (match) {
        const fullUrl = match[0].match(/\]\(([^)]+)\)/)[1]
        content = content.replace(match[0], `![${item.suggested}](${fullUrl})`)
        applied++
      }
    }
    await fs.writeFile(filePath, content, 'utf8')
    console.log(`  💾 ${path.relative(path.resolve(__dirname, '..'), filePath)} — ${fileItems.length} entries`)
  }
  console.log(`\n✅ Applied ${applied} alt text entries`)
  await fs.unlink(reviewPath)
  console.log(`🗑  Removed review file`)
}

if (args.includes('--apply-review')) {
  applyReview().catch(err => { console.error('Fatal error:', err); process.exit(1) })
} else {
  main().catch(err => { console.error('Fatal error:', err); process.exit(1) })
}
