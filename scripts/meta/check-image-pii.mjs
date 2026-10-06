#!/usr/bin/env node
/**
 * @file check-image-pii.mjs
 * @description Block a deploy when a published post shows an image of a
 *   credential or of financial details. Runs in deploy.yml before the build.
 * @usage yarn check:images             # scan every published post's images
 *        yarn check:images --local a.png b.png   # scan local files (testing)
 *
 * ## Why
 *
 * Week notes are bulk screenshot dumps from the vault. In 2026-10 three
 * published notes turned out to show a live database password, API keys, bank
 * statements and invoices. Every text-side check passed, because the secret
 * was only ever in the PIXELS — and the auto-generated alt text then turned
 * those pixels into searchable public prose.
 *
 * So this reads both: the alt text (markdown + data/cloudinary-image-cache.json)
 * and the image itself, via tesseract OCR.
 *
 * ## What it blocks
 *
 * High-precision patterns only — a guard that cries wolf gets bypassed. Key
 * formats (OpenAI/Anthropic/OpenRouter/ElevenLabs/GitHub/AWS/Google/Slack/
 * Stripe), PEM private keys, `password: <value>` assignments, credentials in a
 * connection string, Luhn-valid card numbers, and banking vocabulary
 * (routing/account numbers, statement balances, pay stubs). See RULES.
 *
 * A finding prints the rule and a REDACTED snippet. CI logs on a public repo
 * are public, so the matched text itself is never printed.
 *
 * ## Cache
 *
 * OCR is slow, so verdicts are cached in data/image-pii-scan.json, keyed by
 * image URL and invalidated by RULES_VERSION. It stores verdicts and rule ids
 * only — never OCR text, which would republish exactly what this guards. CI
 * also keeps its own copy in .cache/ (actions/cache) so images added since
 * the last local `yarn check:images` aren't re-OCR'd on every deploy. Bump
 * RULES_VERSION when you change RULES, then run `yarn check:images` locally
 * and commit the cache.
 *
 * Locally, the raw OCR text is also kept in data/_tool-cache/image-ocr.json
 * (gitignored, 0600) — reusable for search/alt text, and it means a rule
 * change re-scans in seconds without re-OCRing.
 *
 * ## False positives
 *
 * Add the image URL to data/image-pii-allow.json with a reason:
 *   { "https://res.cloudinary.com/...png": "fake key from the docs" }
 *
 * Drafts and sealed posts (content/blog/private/) are skipped: they aren't
 * published. Hidden/unlisted/password posts ARE scanned — they're reachable.
 */

import { promises as fs } from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import matter from 'gray-matter'
import chalk from 'chalk'

const run = promisify(execFile)

const ROOT = process.cwd()
const CONTENT_DIR = path.join(ROOT, 'content/blog')
const SKIP_DIRS = new Set(['private', 'drafts', 'backup'])
const IMAGE_CACHE = path.join(ROOT, 'data/cloudinary-image-cache.json')
const SCAN_CACHE = path.join(ROOT, 'data/image-pii-scan.json')
const CI_CACHE = path.join(ROOT, '.cache/image-pii-scan.json')
const ALLOW = path.join(ROOT, 'data/image-pii-allow.json')

export const RULES_VERSION = 2
const CONCURRENCY = Math.max(2, Math.min(6, os.cpus().length))
// Downscale before OCR: legible enough for screenshot text, and a 5K retina
// capture is ~10x slower at full size.
const OCR_WIDTH = 2400

// --- Rules ------------------------------------------------------------------

function luhn(digits) {
  let sum = 0
  for (let i = 0; i < digits.length; i++) {
    let d = Number(digits[digits.length - 1 - i])
    if (i % 2) {
      d *= 2
      if (d > 9) d -= 9
    }
    sum += d
  }
  return sum % 10 === 0
}

/** `test` returns the matched substring (for a redacted snippet), or null. */
export const RULES = [
  // Credentials — key formats
  { id: 'openai-anthropic-key', re: /\bsk-(?:ant-|proj-|or-v1-)?[A-Za-z0-9_-]{20,}/ },
  { id: 'elevenlabs-key', re: /\bsk_[a-f0-9]{32,}/ },
  { id: 'stripe-key', re: /\b[rs]k_live_[A-Za-z0-9]{16,}/ },
  { id: 'github-token', re: /\b(?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9]{30,}|\bgithub_pat_[A-Za-z0-9_]{40,}/ },
  { id: 'aws-access-key', re: /\bAKIA[0-9A-Z]{16}\b/ },
  { id: 'google-api-key', re: /\bAIza[0-9A-Za-z_-]{35}\b/ },
  { id: 'slack-token', re: /\bxox[abprs]-[A-Za-z0-9-]{10,}/ },
  { id: 'private-key', re: /BEGIN (?:RSA |EC |OPENSSH |DSA |PGP )?PRIVATE KEY/ },
  // Credentials — assignments. The value must look like a secret (6+ chars,
  // not a placeholder), so prose like "password manager" doesn't trip it.
  // `password=` / `password:` followed by a value. Prefix may be an env-var
  // name (`DB_PASSWORD=`, `_password=`). 4+ chars, because OCR often clips
  // the end of a value; prose ("password manager") has no `=`/`:` after it.
  {
    id: 'password-assignment',
    re: /(?:^|[^A-Za-z])(?:[A-Za-z0-9]+_)*(?:password|passwd|pwd)["']?\s*[:=]\s*["']?(?!\*{3}|•|x{4}|<|\$\{|process\.env|your|example|changeme|null|undefined|true|false)[^\s"'`,;)]{4,}/i,
  },
  // Uppercase env assignment of anything secret-named, with ANY value.
  // OCR mangles values (`0 . J9BO…`), but the variable name survives.
  {
    id: 'env-secret',
    re: /\b[A-Z0-9_]*(?:PASSWORD|SECRET|TOKEN|API_KEY|APIKEY|PRIVATE_KEY)[A-Z0-9_]*[ \t]*=[ \t]*["'`]?(?![Yy]our|YOUR|[Ee]xample|EXAMPLE|process\b|import\b|os\.|getenv|xxx|XXX|changeme|null|undefined|""|'')[^\s"'`$<{][^\n]{2,}/,
  },
  {
    id: 'secret-assignment',
    re: /\b(?:api[_-]?key|secret(?:[_-]?key)?|access[_-]?token|auth[_-]?token|client[_-]?secret)\b["']?\s*[:=]\s*["']?(?!<|\$\{|process\.env|your|example)[A-Za-z0-9_\-+/]{20,}/i,
  },
  // A hardcoded secret string: words joined around "secret"/"password", e.g.
  // `acme-billing-secret-v2`. Lowercase only, so env-var NAMES like
  // JWT_SECRET_KEY (no value) don't count, and two words must come before it so
  // gpg's `--list-secret-keys` doesn't either. OCR often reads - as —.
  { id: 'hardcoded-secret', re: /\b[a-z0-9]+(?:[-_—][a-z0-9]+)+[-_—](?:secret|password|passwd)(?:[-_—][a-z0-9]+)+\b/ },
  { id: 'url-credentials', re: /\b[a-z][a-z0-9+.-]*:\/\/[^\s:@/]{2,}:[^\s:@/]{6,}@[^\s/]+/i },
  // Financial
  {
    id: 'card-number',
    test: (t) => {
      for (const m of t.matchAll(/(?<![\d.,-])\d{4}([ -]?)\d{4}\1\d{4}\1\d{4}(?![\d.,])/g)) {
        const digits = m[0].replace(/\D/g, '')
        if (/^[3-6]/.test(digits) && luhn(digits) && !/^(\d)\1+$/.test(digits)) return m[0]
      }
      return null
    },
  },
  { id: 'bank-account-number', re: /\b(?:routing|account|acct)\s*(?:number|no\.?|#)\s*:?\s*[\dX*•.]{4,}/i },
  { id: 'iban', re: /\b[A-Z]{2}\d{2}(?: ?[A-Z0-9]{4}){3,7}\b/ },
  {
    id: 'bank-balance',
    // Needs an amount with cents after it — a game's "CURRENT BALANCE $1.1b" is fine.
    re: /\b(?:available|current|ending|statement|beginning)\s+balance\b[^\n$]{0,40}\$\s?\d[\d,]*\.\d{2}\b/i,
  },
  { id: 'pay-stub', re: /\b(?:net pay|gross pay|pay stub|paystub|direct deposit|YTD gross|earnings statement)\b/i },
  // Payment-processor object ids (Stripe pi_/ch_/in_/cus_…) — a dashboard.
  { id: 'payment-id', re: /\b(?:pi|ch|in|cus|py|po)_[A-Za-z0-9]{20,}\b/ },
  // An invoice/payment ledger: many dollar amounts with cents in one image.
  // One price in a screenshot is fine; a column of them is somebody's books.
  {
    id: 'money-ledger',
    test: (t) => {
      const amounts = t.match(/\$\s?\d{1,3}(?:,\d{3})*\.\d{2}\b/g) || []
      const big = amounts.filter((a) => Number(a.replace(/[$,\s]/g, '')) >= 1000)
      return amounts.length >= 6 && big.length >= 3 ? `${amounts.length} amounts` : null
    },
  },
  // An inbox or contact list: several distinct email addresses.
  {
    id: 'email-addresses',
    test: (t) => {
      const emails = new Set((t.match(/\b[A-Za-z][\w.+-]*@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}\b/g) || []).map((e) => e.toLowerCase()))
      return emails.size >= 3 ? `${emails.size} addresses` : null
    },
  },
  { id: 'personal-docs', re: /\b(?:co-?signer|lease application|rental application|credit check)\b/i },
  { id: 'ssn', re: /\b(?:SSN|social security)\b[^\n]{0,20}\b\d{3}-\d{2}-\d{4}\b/i },
]

/** Alt text is prose a model wrote ABOUT the image, so match the vocabulary,
 *  not the format: "screenshot of a bank statement showing…" */
export const ALT_RULES = [
  {
    id: 'alt-financial',
    re: /\b(?:bank statement|bank account|account balance|checking account|savings account|pay ?stub|payroll|invoice|credit card statement|card ending|transaction history|tax return|W-?2|1099)\b/i,
  },
  // Only when the alt says a secret is actually SHOWN — settings screens and
  // docs mention "API key" all the time.
  {
    id: 'alt-credential',
    re: /\b(?:full|actual|plain ?text|unredacted|exposed|visible|leaked)\s+(?:api keys?|passwords?|secret keys?|access tokens?|credentials)\b/i,
  },
  { id: 'alt-personal', re: /\b(?:(?:my|browser|google|search engine) search history|co-?signer|social security number|home address|medical records?)\b/i },
]

export function scanText(text, rules = RULES) {
  const hits = []
  for (const rule of rules) {
    const found = rule.test ? rule.test(text) : text.match(rule.re)?.[0]
    if (found) hits.push({ rule: rule.id, snippet: redact(found) })
  }
  return hits
}

/** Enough to find it on the screenshot, not enough to use it. */
export function redact(s) {
  const t = s.replace(/\s+/g, ' ').trim()
  if (t.length <= 8) return t.slice(0, 2) + '…'
  return t.slice(0, Math.min(6, Math.floor(t.length / 4))) + '…' + `(${t.length} chars)`
}

// --- Collect published images -----------------------------------------------

async function* walk(dir) {
  for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.')) continue
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      if (dir === CONTENT_DIR && SKIP_DIRS.has(entry.name)) continue
      yield* walk(full)
    } else if (entry.name.endsWith('.md')) {
      yield full
    }
  }
}

const MD_IMAGE = /!\[([^\]]*)\]\(\s*<?([^)\s>]+)>?(?:\s+"[^"]*")?\s*\)/g
const HTML_IMAGE = /<img\b[^>]*\bsrc=["']([^"']+)["'][^>]*>/gi
const HTML_ALT = /\balt=["']([^"']*)["']/i
const OBSIDIAN_IMAGE = /!\[\[([^\]|]+\.(?:png|jpe?g|gif|webp))(?:\|[^\]]*)?\]\]/gi

export function extractImages(body, frontmatter = {}) {
  const out = []
  for (const m of body.matchAll(MD_IMAGE)) out.push({ url: m[2], alt: m[1] })
  for (const m of body.matchAll(HTML_IMAGE)) out.push({ url: m[1], alt: m[0].match(HTML_ALT)?.[1] || '' })
  for (const m of body.matchAll(OBSIDIAN_IMAGE)) out.push({ url: m[1], alt: '' })
  for (const key of ['image', 'cover', 'thumbnail', 'ogImage']) {
    if (typeof frontmatter[key] === 'string') out.push({ url: frontmatter[key], alt: '' })
  }
  return out.filter((i) => /^https?:\/\//.test(i.url) && !/\.(?:mp4|mov|webm|svg)(?:$|\?)/i.test(i.url))
}

async function collectPublishedImages() {
  const images = new Map() // url -> { alts:Set, posts:Set }
  for await (const file of walk(CONTENT_DIR)) {
    const { data, content } = matter(await fs.readFile(file, 'utf8'))
    if (data.draft === true || data.draft === 'true') continue
    const rel = path.relative(ROOT, file)
    for (const { url, alt } of extractImages(content, data)) {
      const entry = images.get(url) || { alts: new Set(), posts: new Set() }
      if (alt) entry.alts.add(alt)
      entry.posts.add(rel)
      images.set(url, entry)
    }
  }
  return images
}

// --- OCR --------------------------------------------------------------------

/** Ask Cloudinary for a width-capped PNG: smaller download, faster OCR. */
function ocrFetchUrl(url) {
  url = url.replace(/^http:\/\//, 'https://')
  // Animated GIFs/screen recordings live under /video/upload/ and tesseract
  // can't read an animation: ask for the middle frame as a PNG instead.
  const v = url.match(/^(https:\/\/res\.cloudinary\.com\/[^/]+\/video\/upload\/)(?:[^/]*[_,][^/]*\/)*((?:v\d+\/)?.+?)\.\w+$/)
  if (v) return `${v[1]}so_50p,c_limit,w_${OCR_WIDTH},f_png/${v[2]}.png`
  const m = url.match(/^(https:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload\/)(.*)$/)
  if (!m) return url
  return `${m[1]}c_limit,w_${OCR_WIDTH},f_png,pg_1/${m[2]}`
}

async function ocrFile(file) {
  const { stdout } = await run('tesseract', [file, 'stdout', '--psm', '3'], {
    maxBuffer: 32 * 1024 * 1024,
  })
  return stdout
}

// Raw OCR text, kept LOCALLY (data/_tool-cache/ is gitignored) — useful in
// its own right (search, alt text), and it makes rule changes a seconds-long
// re-scan instead of a 30-minute re-OCR. Never committed and never kept in
// CI: for a flagged image this text IS the leaked secret.
const OCR_TEXT = path.join(ROOT, 'data/_tool-cache/image-ocr.json')
const KEEP_TEXT = !process.env.CI

async function saveOcrText(texts) {
  await fs.mkdir(path.dirname(OCR_TEXT), { recursive: true, mode: 0o700 })
  await fs.writeFile(OCR_TEXT, JSON.stringify(sortKeys(texts), null, 1) + '\n', { mode: 0o600 })
}

const ocrUrl = ocrUrlUncached

async function ocrUrlUncached(url, tmpDir) {
  // Retry transient failures (timeouts, 5xx, 429) so a Cloudinary blip
  // doesn't block a deploy. 404/410 is an answer, not a failure.
  let res
  for (let attempt = 1; ; attempt++) {
    try {
      res = await fetch(ocrFetchUrl(url), { signal: AbortSignal.timeout(30_000) })
      if (res.ok || res.status === 404 || res.status === 410 || attempt === 3) break
    } catch (e) {
      if (attempt === 3) throw new Error(e.name === 'TimeoutError' ? 'timed out after 30s (3 tries)' : `${e.message} (3 tries)`)
    }
    await new Promise((r) => setTimeout(r, attempt * 2000))
  }
  if (res.status === 404 || res.status === 410) return { gone: true }
  if (!res.ok) throw new Error(`HTTP ${res.status} (3 tries)`)
  const type = res.headers.get('content-type') || ''
  if (!type.startsWith('image/') || type.includes('svg')) return { skipped: type }
  const file = path.join(tmpDir, `${Math.random().toString(36).slice(2)}.img`)
  await fs.writeFile(file, Buffer.from(await res.arrayBuffer()))
  try {
    return { text: await ocrFile(file) }
  } finally {
    await fs.rm(file, { force: true })
  }
}

async function pool(items, n, fn) {
  let i = 0
  await Promise.all(
    Array.from({ length: Math.min(n, items.length) }, async () => {
      while (i < items.length) await fn(items[i++])
    })
  )
}

async function readJson(file, fallback) {
  try {
    return JSON.parse(await fs.readFile(file, 'utf8'))
  } catch {
    return fallback
  }
}

async function hasTesseract() {
  try {
    await run('tesseract', ['--version'])
    return true
  } catch {
    return false
  }
}

// --- Failing loudly ---------------------------------------------------------
//
// A guard that blocks deploys will, one day, block one for a dumb reason.
// When it does, the failure has to say — in the log, as a red annotation on
// the run, in the run summary, and in Discord — WHAT stopped the deploy, WHY,
// and the exact steps to get unstuck. Never just "exit 1".

const OVERRIDE_HELP = `Override (only if you're SURE the guard is wrong, e.g. it's broken):
  GitHub → Actions → "Deploy to VPS" → Run workflow → tick "skip_image_guard"
  or:  gh workflow run deploy.yml -f skip_image_guard=true`

const ALERT_FILE = path.join(ROOT, '.cache/image-guard-alert.txt')

async function fail({ title, why, items, fix }) {
  const bar = '━'.repeat(72)
  console.log('\n' + chalk.red.bold(bar))
  console.log(chalk.red.bold(`  🛑 DEPLOY BLOCKED BY THE SCREENSHOT GUARD — ${title}`))
  console.log(chalk.red.bold(bar))
  console.log(`\nWHY:\n${why}\n`)
  console.log('WHAT:')
  for (const line of items) console.log('  ' + line)
  console.log(`\nHOW TO FIX:\n${fix}\n\n${OVERRIDE_HELP}\n`)
  console.log(chalk.dim(`(scripts/meta/check-image-pii.mjs — run it locally with: yarn check:images)`))
  console.log(chalk.red.bold(bar) + '\n')

  if (process.env.GITHUB_ACTIONS) {
    // Annotation: shows on the run page and the commit, no log-digging.
    const esc = (t) => t.replace(/%/g, '%25').replace(/\r/g, '%0D').replace(/\n/g, '%0A')
    console.log(`::error title=Deploy blocked: ${title}::${esc(`${why}\n\n${items.slice(0, 10).join('\n')}\n\n${fix}`)}`)
    if (process.env.GITHUB_STEP_SUMMARY) {
      await fs.appendFile(
        process.env.GITHUB_STEP_SUMMARY,
        `## 🛑 Deploy blocked by the screenshot guard — ${title}\n\n${why}\n\n` +
          items.map((l) => `- \`${l.trim()}\``).join('\n') +
          `\n\n### How to fix\n\n${fix}\n\n\`\`\`\n${OVERRIDE_HELP}\n\`\`\`\n`
      )
    }
    // One line for the Discord alert step (redacted — no snippets).
    await fs.mkdir(path.dirname(ALERT_FILE), { recursive: true })
    await fs.writeFile(ALERT_FILE, `${title}. ${items.length} item(s). Fix: see the run summary.`)
  }
  process.exit(1)
}

// --- Main -------------------------------------------------------------------

async function scanLocal(files) {
  let bad = 0
  for (const file of files) {
    const hits = scanText(await ocrFile(file))
    if (hits.length) bad++
    console.log(
      hits.length ? chalk.red('✗') : chalk.green('✓'),
      path.basename(file),
      hits.map((h) => `${h.rule} ${chalk.dim(h.snippet)}`).join(', ')
    )
  }
  console.log(`\n${bad}/${files.length} flagged`)
}

async function main() {
  const args = process.argv.slice(2)
  if (process.env.SKIP_IMAGE_GUARD === 'true') {
    const msg = 'SCREENSHOT GUARD SKIPPED by manual override (skip_image_guard). Images in this deploy were NOT checked for secrets.'
    console.log(chalk.yellow.bold(`\n⚠ ${msg}\n`))
    if (process.env.GITHUB_ACTIONS) console.log(`::warning title=Screenshot guard skipped::${msg}`)
    return
  }
  if (!(await hasTesseract())) {
    await fail({
      title: 'tesseract is not installed',
      why: 'The guard reads text out of images with tesseract OCR, and it is missing — so NOTHING was checked. This is a problem with the guard, not with your post.',
      items: ['tesseract: command not found'],
      fix: 'Locally: brew install tesseract\nIn CI: the "Install tesseract" step in .github/workflows/deploy.yml failed or was removed — check that step\'s log above.',
    })
  }
  if (args[0] === '--local') return scanLocal(args.slice(1))

  const images = await collectPublishedImages()
  const altCache = await readJson(IMAGE_CACHE, {})
  const allow = await readJson(ALLOW, {})
  const committed = await readJson(SCAN_CACHE, {})
  const ci = await readJson(CI_CACHE, {})
  const fresh = (c) => (c?.rulesVersion === RULES_VERSION ? c.images || {} : {})
  const verdicts = { ...fresh(committed), ...fresh(ci) }
  const texts = KEEP_TEXT ? await readJson(OCR_TEXT, {}) : {}
  // Kept text always wins: re-apply the CURRENT rules to it, so a rule
  // change takes effect without re-OCRing.
  for (const url of images.keys()) {
    if (typeof texts[url] !== 'string') continue
    const hits = scanText(texts[url])
    verdicts[url] = { hits: hits.map((h) => h.rule) }
    if (hits.length) verdicts[url].snippets = hits.map((h) => h.snippet)
  }

  const findings = [] // { url, posts, hits }
  const report = (url, hits) => {
    if (hits.length && !allow[url]) findings.push({ url, posts: [...images.get(url).posts], hits })
  }

  // 1. Alt text — instant, no network.
  for (const [url, { alts }] of images) {
    const cached = altCache[url]
    const text = [...alts, cached?.alt, cached?.caption].filter(Boolean).join('\n')
    report(url, scanText(text, ALT_RULES))
  }

  // 2. OCR — only images with no verdict under the current rules.
  const todo = [...images.keys()].filter((u) => !verdicts[u])
  console.log(
    chalk.dim(`${images.size} published images · ${images.size - todo.length} cached · ${todo.length} to OCR`)
  )
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'image-pii-'))
  const errors = []
  let done = 0
  await pool(todo, CONCURRENCY, async (url) => {
    try {
      const r = await ocrUrl(url, tmpDir)
      if (KEEP_TEXT && r.text != null) texts[url] = r.text
      // Gone/non-image: nothing to read, and nothing to leak.
      const hits = r.text == null ? [] : scanText(r.text)
      verdicts[url] = { hits: hits.map((h) => h.rule) }
      if (hits.length) verdicts[url].snippets = hits.map((h) => h.snippet)
    } catch (e) {
      errors.push({ url, error: e.message })
    }
    if (++done % 50 === 0) {
      console.log(chalk.dim(`  OCR ${done}/${todo.length}`))
      if (KEEP_TEXT) await saveOcrText(texts) // a crash shouldn't cost the OCR done so far
    }
  })
  await fs.rm(tmpDir, { recursive: true, force: true })
  if (KEEP_TEXT) await saveOcrText(texts)

  for (const [url] of images) {
    const v = verdicts[url]
    if (v?.hits?.length) report(url, v.hits.map((rule, i) => ({ rule, snippet: v.snippets?.[i] || '' })))
  }

  // Persist verdicts (rule ids + redacted snippets, never OCR text). Prune
  // images no longer published so the file doesn't grow forever.
  const keep = Object.fromEntries(Object.entries(verdicts).filter(([u]) => images.has(u)))
  const out = JSON.stringify({ rulesVersion: RULES_VERSION, images: sortKeys(keep) }, null, 1) + '\n'
  await fs.writeFile(SCAN_CACHE, out)
  if (process.env.CI) {
    await fs.mkdir(path.dirname(CI_CACHE), { recursive: true })
    await fs.writeFile(CI_CACHE, out)
  }

  // Merge findings per URL.
  const byUrl = new Map()
  for (const f of findings) {
    const prev = byUrl.get(f.url)
    if (prev) prev.hits.push(...f.hits)
    else byUrl.set(f.url, f)
  }

  if (byUrl.size) {
    const items = []
    for (const { url, posts, hits } of byUrl.values()) {
      items.push(`${posts.join(', ')}`)
      items.push(`  ↳ ${url}`)
      items.push(`  ↳ matched: ${hits.map((h) => h.rule + (h.snippet ? ` (${h.snippet})` : '')).join(', ')}`)
    }
    await fail({
      title: `${byUrl.size} image(s) may show secrets or financial details`,
      why:
        'A published post contains an image whose text (read by OCR) or alt text looks like a credential\n' +
        '(API key, password, token) or private financial info (bank statement, invoice, pay stub, card).\n' +
        'Week-note screenshots leaked exactly this in 2026-10, so deploys stop until a human looks.',
      items,
      fix:
        '1. Open the image URL and look at it.\n' +
        '2. If it IS sensitive: remove it from the post, delete it from Cloudinary, and rotate any key it shows.\n' +
        `3. If it's a FALSE POSITIVE: add it to ${path.relative(ROOT, ALLOW)} with a reason, e.g.\n` +
        '     { "<image url>": "fake key from the docs" }\n' +
        '   then commit and push — the deploy reruns on its own.',
    })
  }

  if (errors.length) {
    // An image we couldn't download is an image we didn't check. Fail closed
    // in CI; locally, just warn.
    const items = errors.slice(0, 25).map((e) => `${e.url}  →  ${e.error}`)
    if (errors.length > 25) items.push(`…and ${errors.length - 25} more`)
    if (!process.env.CI) {
      console.log(chalk.yellow(`\n⚠ ${errors.length} image(s) couldn't be downloaded, so weren't checked:`))
      for (const l of items) console.log(chalk.yellow('  ' + l))
      return
    }
    await fail({
      title: `couldn't download ${errors.length} image(s) to check them`,
      why:
        "No secrets were found — but these images couldn't be downloaded, so they WEREN'T checked, and the\n" +
        "guard won't vouch for what it didn't see. Usually this is Cloudinary or the network having a blip,\n" +
        'not anything wrong with your post. (Each download was already retried 3 times.)',
      items,
      fix:
        '• Most likely: just re-run the job (Actions → this run → "Re-run failed jobs").\n' +
        '• If an image URL is broken/typo\'d: fix the link in the post and push.\n' +
        '• If it keeps failing and you need to ship now: use the override below.',
    })
  }

  console.log(chalk.green(`✓ No credentials or financial details found in ${images.size} published images`))
}

function sortKeys(o) {
  return Object.fromEntries(Object.keys(o).sort().map((k) => [k, o[k]]))
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((e) =>
    fail({
      title: 'the guard itself crashed',
      why: 'check-image-pii.mjs threw an unexpected error, so nothing was checked. This is a bug in the guard, not a problem with your post.',
      items: String(e?.stack || e).split('\n').slice(0, 8),
      fix: 'Fix the guard (scripts/meta/check-image-pii.mjs), or use the override below to ship meanwhile.',
    })
  )
}
