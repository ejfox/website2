#!/usr/bin/env node
/**
 * mirror-to-atproto.mjs
 *
 * One-way, fire-and-forget mirror of published blog posts into an AT-Proto
 * repo as standard.site records — a `site.standard.publication` for the blog
 * itself, and one `site.standard.document` per post. Purely additive: reads
 * the JSON the pipeline already produces and writes a *copy* to a second
 * place. Touches none of the HTML, microformats, RSS, or webmentions.
 *
 * Dry run (default, needs no credentials) — prints what it WOULD write:
 *   yarn blog:mirror-atproto
 *
 * Live (writes to your repo) — needs an AT-Proto identity + app password:
 *   ATPROTO_HANDLE=ejfox.com ATPROTO_APP_PASSWORD=xxxx-xxxx-xxxx-xxxx \
 *     yarn blog:mirror-atproto --live
 *
 * Note on the `content` field: standard.site's content union is still open
 * and undefined (no block format published yet), so we send plain
 * `textContent` + `description`. When they ship a content lexicon, add a
 * mapper here — nothing else changes.
 */

import { readFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'
import striptags from 'striptags'
import {
  isMirrorEligible,
  publishedAtFor,
  rkeyFor,
} from '../../utils/atprotoRkey.mjs'

const SITE_URL = 'https://ejfox.com'
const SITE_NAME = 'EJ Fox'
const SITE_DESCRIPTION =
  "Things I'm thinking about — data, code, journalism, the web"
const PDS = 'https://bsky.social'
// One stable publication record for the whole blog. This MUST be a literal
// constant and MUST NEVER change: every site.standard.document we write points
// at `at://<did>/site.standard.publication/<PUB_RKEY>`, so editing it orphans
// the publication and silently re-parents all of them on the next run.
//
// It is a TID, not 'self'. site.standard.publication declares a `tid` record
// key, and bsky.social enforces it:
//   putRecord site.standard.publication/self: 400 InvalidRequest
//   Invalid record key for site.standard.publication:
//   Invalid TID string (got "self")
// The publication is written before any document, so 'self' failed the whole
// mirror on its first write — nothing was mirrored between 2026-09-10 and the
// fix. Generating a fresh TID per run would instead create a new publication
// every time, so this one is frozen: it decodes to 2026-09-22T00:00:00Z.
const PUB_RKEY = '3mw2wa5qk2222'
const LIVE = process.argv.includes('--live')
const PROCESSED = path.join(process.cwd(), 'content/processed')

const stripTags = (s) =>
  striptags(s || '')
    .replace(/\s+/g, ' ')
    .trim()

// First sentence-ish, cut on a whole word, no trailing period. This mirrors
// utils/ogDescription.ts — when that helper is available as plain JS (or this
// becomes a Nuxt task), import it instead of keeping this in sync by hand.
const summarize = (text, max = 280) => {
  if (!text) return undefined
  if (text.length <= max) return text.replace(/\.$/, '')
  const cut = text.slice(0, max)
  const end = Math.max(cut.lastIndexOf('. '), cut.lastIndexOf(' '))
  return cut.slice(0, end > 40 ? end : max).replace(/[\s,;:.—–-]+$/, '') + '…'
}

// pull the full processed JSON for a post (body text + dek live here, not in the lite manifest)
async function loadFull(slug) {
  const file = path.join(PROCESSED, `${slug}.json`)
  if (!existsSync(file)) return null
  try {
    return JSON.parse(await readFile(file, 'utf-8'))
  } catch {
    return null
  }
}

async function toDocument(post, siteRef) {
  const lite = post.metadata || {}
  const full = (await loadFull(post.slug)) || {}
  const meta = { ...lite, ...(full.metadata || {}) }
  const slug = post.slug
  const title = post.title || full.title || meta.title || slug
  const text = stripTags(full.html)
  const description = meta.dek || post.dek || summarize(text)

  // No Date.now() fallback here: the record key is derived from publishedAt,
  // so a dateless post would get a brand-new key on every run — a duplicate
  // record each time, forever. Skip it instead.
  const publishedAt = publishedAtFor({ ...post, metadata: meta })
  if (!publishedAt) {
    console.error(`  ✗ ${slug}: no usable date, skipping`)
    return null
  }

  const doc = {
    $type: 'site.standard.document',
    site: siteRef,
    path: `/blog/${slug}`,
    title: String(title).slice(0, 5000),
    publishedAt,
  }
  if (meta.modified) doc.updatedAt = new Date(meta.modified).toISOString()
  if (description) doc.description = String(description).slice(0, 30000)
  if (Array.isArray(meta.tags) && meta.tags.length)
    doc.tags = meta.tags.map(String).slice(0, 50)
  if (text) doc.textContent = text

  return { rkey: rkeyFor(slug, doc.publishedAt), record: doc }
}

async function loadPublishedPosts() {
  const manifest = JSON.parse(
    await readFile(path.join(PROCESSED, 'manifest-lite.json'), 'utf-8')
  )
  return manifest.filter(isMirrorEligible)
}

const publicationRecord = () => ({
  $type: 'site.standard.publication',
  url: SITE_URL,
  name: SITE_NAME,
  description: SITE_DESCRIPTION,
})

// ---- AT-Proto wire calls (raw XRPC, no SDK) ----

async function createSession() {
  const identifier = process.env.ATPROTO_HANDLE
  const password = process.env.ATPROTO_APP_PASSWORD
  if (!identifier || !password) {
    throw new Error(
      'Set ATPROTO_HANDLE and ATPROTO_APP_PASSWORD (an app password — Settings → App Passwords — not your login).'
    )
  }
  const res = await fetch(`${PDS}/xrpc/com.atproto.server.createSession`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ identifier, password }),
  })
  if (!res.ok)
    throw new Error(`createSession failed: ${res.status} ${await res.text()}`)
  return res.json()
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function putRecord(session, collection, rkey, record, tries = 4) {
  for (let attempt = 1; attempt <= tries; attempt++) {
    const res = await fetch(`${PDS}/xrpc/com.atproto.repo.putRecord`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${session.accessJwt}`,
      },
      body: JSON.stringify({ repo: session.did, collection, rkey, record }),
    })
    if (res.ok) return res.json()
    // retry transient upstream/rate-limit blips with backoff; fail fast otherwise
    const transient =
      res.status === 502 || res.status === 503 || res.status === 429
    if (!transient || attempt === tries)
      throw new Error(
        `putRecord ${collection}/${rkey}: ${res.status} ${await res.text()}`
      )
    await sleep(attempt * 1000)
  }
}

async function main() {
  const posts = await loadPublishedPosts()

  if (!LIVE) {
    // dry run: reference the eventual publication AT-URI symbolically
    const siteRef = `at://<your-did>/site.standard.publication/${PUB_RKEY}`
    const docs = (
      await Promise.all(posts.map((p) => toDocument(p, siteRef)))
    ).filter(Boolean)
    console.log(
      `📦 ${docs.length} published posts → site.standard.document records`
    )
    console.log('   + 1 site.standard.publication record\n')
    console.log('— DRY RUN (no credentials needed). Publication: —\n')
    console.log(JSON.stringify(publicationRecord(), null, 2))
    console.log('\n— Sample document: —\n')
    console.log(JSON.stringify(docs[0]?.record, null, 2))
    console.log(
      `\nRun with --live (ATPROTO_HANDLE / ATPROTO_APP_PASSWORD set) to write all ${docs.length} + the publication.`
    )
    return
  }

  const session = await createSession()
  console.log(`🔑 authed as ${session.handle || session.did}`)

  // 1. the publication the documents belong to
  await putRecord(
    session,
    'site.standard.publication',
    PUB_RKEY,
    publicationRecord()
  )
  const siteRef = `at://${session.did}/site.standard.publication/${PUB_RKEY}`
  console.log(`📖 publication → ${siteRef}`)

  // 2. one document per post
  const docs = (
    await Promise.all(posts.map((p) => toDocument(p, siteRef)))
  ).filter(Boolean)
  let ok = 0
  for (const { rkey, record } of docs) {
    try {
      await putRecord(session, 'site.standard.document', rkey, record)
      ok++
      if (ok % 25 === 0) console.log(`  …${ok}/${docs.length}`)
    } catch (err) {
      console.error(`  ✗ ${rkey}: ${err.message}`)
    }
  }
  const failed = docs.length - ok
  if (failed) {
    // Don't exit 0 on a pile of caught write errors. The per-document catch
    // above used to swallow every failure, so a run that mirrored 0/44 still
    // went green in CI — a silent break is worse than a loud one.
    throw new Error(
      `${failed}/${docs.length} documents failed to write (see ✗ lines above)`
    )
  }
  console.log(`✅ mirrored ${ok}/${docs.length} posts into your AT-Proto repo`)
}

main().catch((err) => {
  console.error('mirror failed:', err.message)
  process.exit(1)
})
