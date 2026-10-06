#!/usr/bin/env node
/**
 * unify-cloudinary-text.mjs
 *
 * One description model for every Cloudinary image, and the repo's
 * data/cloudinary-image-cache.json kept in step with it.
 *
 *   alt          short description (one sentence) — THE description
 *   caption      mirrors alt (the old alt-sync convention; Media Library shows it)
 *   description  long-form write-up, when one exists
 *   ocr_*        text read out of the image (see sync-ocr-to-cloudinary.mjs)
 *
 * Before 2026-10 descriptions were split across alt+caption (blog pipeline),
 * ai_description (an `ai_processed` batch: long numbered analyses) and
 * description (a `processed_by_openai` batch), never more than one per image,
 * and the repo cache had drifted (times like 8:45 mangled to 8).
 *
 * Rules, in order — the first that applies sets `alt`:
 *   1. EJ'S OWN WORDS WIN. Alt he wrote on a project page (or, failing that,
 *      any post that isn't a week note) is the image's description, even over
 *      an existing Cloudinary alt.
 *   2. BROKEN alt (a URL, a /Users/ path, or `=` eaten by the old sync script)
 *      is replaced with the image's markdown alt.
 *   3. EMPTY alt is filled from the image's markdown alt (any post), else
 *      from the repo cache.
 *   4. EMPTY alt with only a long write-up gets a one-sentence summary of it
 *      (LLM via OpenRouter; results cached in data/_tool-cache/short-alts.json).
 * Then: caption := alt; description := ai_description when description is
 * empty (ai_description itself is left in place); and every repo-cache entry's
 * alt/caption := the image's final alt.
 *
 * Writes use the context API's `add` command, which MERGES keys — nothing
 * else on the asset (ocr_*, scrap_id, geo…) is touched. Any other existing
 * value is never overwritten.
 *
 * Usage:
 *   node scripts/meta/unify-cloudinary-text.mjs            # dry run + samples
 *   node scripts/meta/unify-cloudinary-text.mjs --write    # apply
 *   add --no-llm to skip rule 4; UNIFY_PLAN_OUT=plan.json dumps the plan to review
 * Needs CLOUDINARY_CLOUD_NAME/API_KEY/API_SECRET (+ OPENROUTER_API_KEY for rule 4).
 * Writes a before/after log to data/_tool-cache/unify-log-<date>.json.
 */

import { promises as fs } from 'node:fs'
import path from 'node:path'
import matter from 'gray-matter'
import { isJunkAlt } from '../plugins/remarkEnhanceImages.mjs'
import { addContext, esc, parseCloudinary } from './sync-ocr-to-cloudinary.mjs'

const ROOT = process.cwd()
const CACHE = path.join(ROOT, 'data/cloudinary-image-cache.json')
const SHORT_ALTS = path.join(ROOT, 'data/_tool-cache/short-alts.json')
const WRITE = process.argv.includes('--write')
const LLM = !process.argv.includes('--no-llm')
const MODEL = 'anthropic/claude-haiku-4.5'

const env = process.env
const auth = () =>
  'Basic ' + Buffer.from(`${env.CLOUDINARY_API_KEY}:${env.CLOUDINARY_API_SECRET}`).toString('base64')
const readJson = async (f, d) => {
  try {
    return JSON.parse(await fs.readFile(f, 'utf8'))
  } catch {
    return d
  }
}
const norm = (s) => (s || '').replace(/\s+/g, ' ').trim()

async function listAllImages() {
  const all = []
  let cursor = null
  do {
    const u = new URL(`https://api.cloudinary.com/v1_1/${env.CLOUDINARY_CLOUD_NAME}/resources/image/upload`)
    u.searchParams.set('max_results', '500')
    u.searchParams.set('context', 'true')
    if (cursor) u.searchParams.set('next_cursor', cursor)
    const res = await fetch(u, { headers: { Authorization: auth() } })
    const j = await res.json()
    if (!res.ok) throw new Error(`Cloudinary list: ${JSON.stringify(j).slice(0, 200)}`)
    all.push(...j.resources)
    cursor = j.next_cursor
  } while (cursor)
  return all
}

/**
 * public_id -> { own: [alt], any: [alt] } from every markdown image.
 * `own` is EJ's own words: project pages first, then any other post that
 * isn't a week note (week notes carry the 2025 AI alt-text batch). Drafts
 * count — this is asset metadata, not publishing — but sealed posts don't.
 */
async function markdownAlts() {
  const out = new Map()
  async function walk(dir) {
    for (const e of await fs.readdir(dir, { withFileTypes: true })) {
      const f = path.join(dir, e.name)
      if (e.isDirectory()) {
        if (!['private', 'backup'].includes(e.name)) await walk(f)
        continue
      }
      if (!f.endsWith('.md')) continue
      const { data, content } = matter(await fs.readFile(f, 'utf8'))
      const isProject = f.includes(`${path.sep}projects${path.sep}`)
      const isWeekNote = f.includes(`${path.sep}week-notes${path.sep}`)
      for (const m of content.matchAll(/!\[([^\]]*)\]\(\s*<?([^)\s>]+)/g)) {
        const alt = norm(m[1])
        const target = parseCloudinary(m[2])
        if (!target || isJunkAlt(alt)) continue
        const entry = out.get(target.publicId) || { project: [], essay: [], any: [] }
        const tier = isProject ? entry.project : isWeekNote ? null : entry.essay
        if (tier && !tier.includes(alt)) tier.push(alt)
        if (!entry.any.includes(alt)) entry.any.push(alt)
        out.set(target.publicId, entry)
      }
    }
  }
  await walk(path.join(ROOT, 'content/blog'))
  return out
}

function isBroken(alt, md) {
  if (!alt) return false
  if (/^https?:\/\//.test(alt) || /\/Users\/[a-z]/.test(alt)) return true
  // The old sync script turned `=` into a space.
  return (md?.any || []).some((a) => a.includes('=') && norm(a.replace(/=/g, ' ')) === norm(alt))
}

async function summarize(long) {
  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.OPENROUTER_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 120,
      temperature: 0.2,
      messages: [
        {
          role: 'user',
          content:
            'Write alt text for an image, from this longer description of it. One plain sentence, ' +
            'under 140 characters. Say what is shown, most important thing first. No "image of", ' +
            'no "screenshot showing" preamble unless it being a screenshot matters, no quotes ' +
            'around the answer. Never include passwords, keys, tokens, email addresses or account ' +
            'numbers even if the description mentions them.\n\nDescription:\n' +
            long.slice(0, 4000),
        },
      ],
    }),
    signal: AbortSignal.timeout(60_000),
  })
  const j = await res.json()
  if (!res.ok) throw new Error(`OpenRouter ${res.status}: ${JSON.stringify(j).slice(0, 200)}`)
  return norm(j.choices?.[0]?.message?.content).replace(/^["'“]|["'”]$/g, '')
}

async function pool(items, n, fn) {
  let i = 0
  await Promise.all(Array.from({ length: n }, async () => { while (i < items.length) await fn(items[i++]) }))
}

async function main() {
  for (const k of ['CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET']) {
    if (!env[k]) throw new Error(`${k} not set`)
  }
  const [images, md, cache, shortAlts] = await Promise.all([
    listAllImages(),
    markdownAlts(),
    readJson(CACHE, {}),
    readJson(SHORT_ALTS, {}),
  ])
  console.log(`${images.length} Cloudinary images · ${md.size} with markdown alt`)
  // Repo-cache alts, last-resort source (e.g. a post removed since).
  const cacheAlt = new Map()
  for (const [url, v] of Object.entries(cache)) {
    const t = parseCloudinary(url)
    if (t && v.alt && !isJunkAlt(v.alt) && !cacheAlt.has(t.publicId)) cacheAlt.set(t.publicId, norm(v.alt))
  }

  // --- Decide -----------------------------------------------------------
  const plan = new Map() // publicId -> { before, set:{}, rule }
  const finalAlt = new Map()
  const needLlm = []
  for (const r of images) {
    const cu = r.context?.custom || {}
    const m = md.get(r.public_id)
    const set = {}
    let rule = null
    const alt = norm(cu.alt)
    const long = cu.description || cu.ai_description

    const own = m?.project[0] || m?.essay[0]
    const cached = cacheAlt.get(r.public_id)
    if (own && alt !== own) {
      set.alt = own
      rule = 'own-words'
    } else if (isBroken(alt, m) && m?.any.length) {
      set.alt = m.any[0]
      rule = 'broken'
    } else if (!alt && m?.any.length) {
      set.alt = m.any[0]
      rule = 'fill-from-markdown'
    } else if (!alt && cached) {
      set.alt = cached
      rule = 'fill-from-repo-cache'
    } else if (!alt && long) {
      if (shortAlts[r.public_id]) set.alt = shortAlts[r.public_id]
      else needLlm.push(r.public_id)
      rule = 'summarize'
    }
    const newAlt = set.alt ?? alt
    if (newAlt && norm(cu.caption) !== newAlt) set.caption = newAlt
    if (!cu.description && cu.ai_description) set.description = cu.ai_description
    if (newAlt) finalAlt.set(r.public_id, newAlt)
    if (Object.keys(set).length || rule === 'summarize') plan.set(r.public_id, { before: cu, set, rule })
  }

  // --- Summaries (rule 4) ----------------------------------------------
  if (needLlm.length) {
    if (!LLM || !env.OPENROUTER_API_KEY) {
      console.log(`rule 4 skipped for ${needLlm.length} (${LLM ? 'no OPENROUTER_API_KEY' : '--no-llm'})`)
      for (const id of needLlm) if (!Object.keys(plan.get(id).set).length) plan.delete(id)
    } else {
      console.log(`summarizing ${needLlm.length} long descriptions with ${MODEL}…`)
      const byId = new Map(images.map((r) => [r.public_id, r]))
      let done = 0
      await pool(needLlm, 6, async (id) => {
        const cu = byId.get(id).context.custom
        try {
          shortAlts[id] = await summarize(cu.description || cu.ai_description)
        } catch (e) {
          console.log(`  ✗ ${id}: ${e.message}`)
          return
        }
        const p = plan.get(id)
        p.set.alt = p.set.caption = shortAlts[id]
        finalAlt.set(id, shortAlts[id])
        if (++done % 50 === 0) {
          console.log(`  ${done}/${needLlm.length}`)
          await fs.writeFile(SHORT_ALTS, JSON.stringify(shortAlts, null, 1) + '\n')
        }
      })
      await fs.mkdir(path.dirname(SHORT_ALTS), { recursive: true })
      await fs.writeFile(SHORT_ALTS, JSON.stringify(shortAlts, null, 1) + '\n')
    }
  }

  // --- Repo cache --------------------------------------------------------
  let cacheChanged = 0
  for (const [url, v] of Object.entries(cache)) {
    const t = parseCloudinary(url)
    const a = t && finalAlt.get(t.publicId)
    if (a && (v.alt !== a || v.caption !== a)) {
      v.alt = v.caption = a
      cacheChanged++
    }
  }

  // --- Report ------------------------------------------------------------
  const byRule = {}
  for (const p of plan.values()) byRule[p.rule || 'caption/description only'] = (byRule[p.rule || 'caption/description only'] || 0) + 1
  console.log(`\n${WRITE ? '✏️  WRITE' : '👀 DRY RUN'} — ${plan.size} Cloudinary image(s) to update`, byRule)
  console.log(`repo cache: ${cacheChanged} entr${cacheChanged === 1 ? 'y' : 'ies'} to update`)
  for (const rule of ['own-words', 'broken', 'fill-from-markdown', 'fill-from-repo-cache', 'summarize']) {
    const ex = [...plan.entries()].filter(([, p]) => p.rule === rule && p.set.alt).slice(0, 3)
    for (const [id, p] of ex) console.log(`  [${rule}] ${id}\n     was: ${norm(p.before.alt).slice(0, 90) || '∅'}\n     now: ${p.set.alt.slice(0, 90)}`)
  }
  if (process.env.UNIFY_PLAN_OUT) {
    await fs.writeFile(process.env.UNIFY_PLAN_OUT, JSON.stringify([...plan.entries()].map(([id, p]) => ({ id, rule: p.rule, before: { alt: p.before.alt, caption: p.before.caption }, set: p.set })), null, 1))
  }
  if (!WRITE) return console.log('\nRun with --write to apply.')

  // --- Apply -------------------------------------------------------------
  const log = []
  const failed = []
  let ok = 0
  await pool([...plan.entries()], 4, async ([publicId, p]) => {
    const pairs = Object.entries(p.set).map(([k, v]) => `${k}=${esc(v)}`)
    if (!pairs.length) return
    try {
      await addContext({ cloud: env.CLOUDINARY_CLOUD_NAME, publicId }, pairs.join('|'))
      log.push({ publicId, rule: p.rule, before: p.before, set: p.set })
      if (++ok % 100 === 0) console.log(`  ${ok}/${plan.size}`)
    } catch (e) {
      failed.push(`${publicId}: ${e.message}`)
    }
  })
  const day = new Date().toISOString().slice(0, 10)
  await fs.writeFile(path.join(ROOT, `data/_tool-cache/unify-log-${day}.json`), JSON.stringify(log, null, 1))
  if (cacheChanged) await fs.writeFile(CACHE, JSON.stringify(cache, null, 2) + '\n')
  console.log(`\n✓ updated ${ok} Cloudinary image(s), ${cacheChanged} repo-cache entries`)
  if (failed.length) {
    console.log(`✗ ${failed.length} failed:\n  ` + failed.slice(0, 20).join('\n  '))
    process.exit(1)
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
