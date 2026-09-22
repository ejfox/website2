#!/usr/bin/env node
/**
 * prune-atproto-orphans.mjs
 *
 * One-off cleanup after the 2026-09-22 rkey migration.
 *
 * site.standard.{publication,document} began enforcing `tid` record keys, so
 * the records written under the old scheme — `self` for the publication, the
 * post slug for each document — can no longer be updated. The mirror rewrote
 * everything under TID keys, which left the old set behind as unreachable
 * duplicates: 88 documents where there should be 44.
 *
 * Two reasons to delete them rather than shrug:
 *   1. They point at the orphaned `self` publication, so anything reading the
 *      repo sees each post twice, under two different parents.
 *   2. The mirror is additive and has never deleted anything, so a post that
 *      was published once and later set `draft: true` is still sitting in the
 *      old set, publicly readable. (2023-camera-setup is exactly this.)
 *      Pruning the old set is what actually retracts it.
 *
 * SAFETY: this only ever deletes keys that are NOT valid TIDs. Every record
 * the current mirror writes uses a TID, so the live set cannot be touched even
 * if this is run twice, or run before a mirror instead of after.
 *
 *   ATPROTO_HANDLE=… ATPROTO_APP_PASSWORD=… node scripts/author/prune-atproto-orphans.mjs
 *
 * Dry run by default; pass --live to actually delete.
 */

const PDS = 'https://bsky.social'
const LIVE = process.argv.includes('--live')
const COLLECTIONS = ['site.standard.document', 'site.standard.publication']

// The syntax the PDS enforces. Anything failing this was written under the old
// scheme and is, by definition, no longer writable.
const TID = /^[2-7a-j][2-7a-z]{12}$/

async function createSession() {
  const identifier = process.env.ATPROTO_HANDLE
  const password = process.env.ATPROTO_APP_PASSWORD
  if (!identifier || !password) {
    throw new Error('Set ATPROTO_HANDLE and ATPROTO_APP_PASSWORD.')
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

async function listAll(session, collection) {
  const out = []
  let cursor
  do {
    const url = new URL(`${PDS}/xrpc/com.atproto.repo.listRecords`)
    url.searchParams.set('repo', session.did)
    url.searchParams.set('collection', collection)
    url.searchParams.set('limit', '100')
    if (cursor) url.searchParams.set('cursor', cursor)
    const res = await fetch(url, {
      headers: { authorization: `Bearer ${session.accessJwt}` },
    })
    if (!res.ok) throw new Error(`listRecords ${collection}: ${res.status}`)
    const body = await res.json()
    out.push(...(body.records || []))
    cursor = body.records?.length ? body.cursor : null
  } while (cursor)
  return out
}

async function deleteRecord(session, collection, rkey) {
  const res = await fetch(`${PDS}/xrpc/com.atproto.repo.deleteRecord`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${session.accessJwt}`,
    },
    body: JSON.stringify({ repo: session.did, collection, rkey }),
  })
  if (!res.ok)
    throw new Error(
      `delete ${collection}/${rkey}: ${res.status} ${await res.text()}`
    )
}

async function main() {
  const session = await createSession()
  console.log(`🔑 authed as ${session.handle}`)

  let deleted = 0
  let failed = 0

  for (const collection of COLLECTIONS) {
    const records = await listAll(session, collection)
    const orphans = records.filter((r) => !TID.test(r.uri.split('/').pop()))
    const keep = records.length - orphans.length
    console.log(
      `\n${collection}: ${records.length} records — ${keep} live, ${orphans.length} orphaned`
    )

    for (const r of orphans) {
      const rkey = r.uri.split('/').pop()
      const label = r.value?.title || r.value?.name || ''
      if (!LIVE) {
        console.log(`  would delete ${rkey} ${label && `— ${label}`}`)
        continue
      }
      try {
        await deleteRecord(session, collection, rkey)
        deleted++
        console.log(`  ✓ deleted ${rkey} ${label && `— ${label}`}`)
      } catch (err) {
        failed++
        console.error(`  ✗ ${err.message}`)
      }
    }
  }

  if (!LIVE) {
    console.log('\nDRY RUN — nothing deleted. Re-run with --live.')
    return
  }
  console.log(`\n🧹 deleted ${deleted} orphaned records`)
  if (failed) throw new Error(`${failed} deletions failed`)
}

main().catch((err) => {
  console.error('prune failed:', err.message)
  process.exit(1)
})
