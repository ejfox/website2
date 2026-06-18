#!/usr/bin/env node
/**
 * mirror-to-atproto.mjs — SPIKE / proof-of-concept
 *
 * One-way, fire-and-forget mirror of published blog posts into an AT-Proto
 * repo as `site.standard.document` records (the standard.site long-form
 * lexicon). Purely additive: reads the JSON the pipeline already produces and
 * writes a *copy* to a second place. Touches none of the HTML, microformats,
 * RSS, or webmentions.
 *
 * Dry run (default, needs no credentials) — prints what it WOULD write:
 *   node scripts/mirror-to-atproto.mjs
 *
 * Live (writes to your repo) — needs an AT-Proto identity + app password:
 *   ATPROTO_HANDLE=ejfox.com ATPROTO_APP_PASSWORD=xxxx-xxxx-xxxx-xxxx \
 *     node scripts/mirror-to-atproto.mjs --live
 *
 * Status: required fields map cleanly from the manifest. Known gaps (v2):
 *   - `content` union wants standard.site's richtext blocks; we send plain
 *     `textContent` + `description` for now.
 *   - `site` should be the AT-URI of a `site.standard.publication` record;
 *     we use the site URL until that record exists.
 *   - rkeys: the lexicon prefers TID keys; we derive a stable rkey from the
 *     slug so re-runs are idempotent (putRecord upserts).
 */

import { readFile } from 'node:fs/promises'
import path from 'node:path'

const SITE_URL = 'https://ejfox.com'
const COLLECTION = 'site.standard.document'
const LIVE = process.argv.includes('--live')

const stripTags = (s) => (s || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()

// slug -> a valid, stable record key (rkeys can't contain '/')
const rkeyFor = (slug) =>
  slug.replace(/[^a-zA-Z0-9._~-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 512)

function toDocument(post) {
  const meta = post.metadata || {}
  const slug = post.slug
  const title = post.title || meta.title || slug
  const publishedAt = new Date(post.date || meta.date || Date.now()).toISOString()
  const description = meta.dek || post.dek || undefined

  const doc = {
    $type: COLLECTION,
    site: SITE_URL,
    path: `/blog/${slug}`,
    title: String(title).slice(0, 5000),
    publishedAt,
  }
  if (meta.modified || post.modified)
    doc.updatedAt = new Date(meta.modified || post.modified).toISOString()
  if (description) doc.description = String(description).slice(0, 30000)
  if (Array.isArray(meta.tags) && meta.tags.length)
    doc.tags = meta.tags.map(String).slice(0, 50)
  // plain-text body stand-in until the richtext `content` union is wired
  const text = stripTags(post.html)
  if (text) doc.textContent = text

  return { rkey: rkeyFor(slug), record: doc }
}

async function loadPublishedPosts() {
  const manifestPath = path.join(
    process.cwd(),
    'content/processed/manifest-lite.json'
  )
  const manifest = JSON.parse(await readFile(manifestPath, 'utf-8'))
  return manifest.filter((p) => {
    const m = p.metadata || {}
    const blocked =
      p.draft || m.draft || p.hidden || m.hidden || p.unlisted ||
      m.unlisted || p.password || m.password || p.passwordHash || m.passwordHash
    // blog posts live under year dirs (YYYY/…); skips system + section files
    return p.slug && !blocked && /^\d{4}\//.test(p.slug)
  })
}

async function createSession() {
  const handle = process.env.ATPROTO_HANDLE
  const password = process.env.ATPROTO_APP_PASSWORD
  if (!handle || !password) {
    throw new Error(
      'Set ATPROTO_HANDLE and ATPROTO_APP_PASSWORD (an app password, not your login) for --live'
    )
  }
  // resolve handle -> DID -> PDS, then create a session on that PDS
  const res = await fetch(
    'https://bsky.social/xrpc/com.atproto.server.createSession',
    {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ identifier: handle, password }),
    }
  )
  if (!res.ok) throw new Error(`createSession failed: ${res.status} ${await res.text()}`)
  return res.json() // { accessJwt, did, ... }
}

async function putRecord(session, rkey, record) {
  const res = await fetch(
    'https://bsky.social/xrpc/com.atproto.repo.putRecord',
    {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${session.accessJwt}`,
      },
      body: JSON.stringify({
        repo: session.did,
        collection: COLLECTION,
        rkey,
        record,
      }),
    }
  )
  if (!res.ok) throw new Error(`putRecord ${rkey} failed: ${res.status} ${await res.text()}`)
  return res.json()
}

async function main() {
  const posts = await loadPublishedPosts()
  const docs = posts.map(toDocument)
  console.log(`📦 ${docs.length} published posts → ${COLLECTION} records`)

  if (!LIVE) {
    const sample = docs[0]
    console.log('\n— DRY RUN (no credentials needed). Sample record: —\n')
    console.log(JSON.stringify(sample?.record, null, 2))
    console.log(
      `\nRun with --live (and ATPROTO_HANDLE / ATPROTO_APP_PASSWORD) to write all ${docs.length}.`
    )
    return
  }

  const session = await createSession()
  console.log(`🔑 authed as ${session.handle || session.did}`)
  let ok = 0
  for (const { rkey, record } of docs) {
    try {
      await putRecord(session, rkey, record)
      ok++
      if (ok % 25 === 0) console.log(`  …${ok}/${docs.length}`)
    } catch (err) {
      console.error(`  ✗ ${rkey}: ${err.message}`)
    }
  }
  console.log(`✅ mirrored ${ok}/${docs.length} posts into your AT-Proto repo`)
}

main().catch((err) => {
  console.error('mirror failed:', err.message)
  process.exit(1)
})
