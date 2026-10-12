/**
 * atprotoRkey.mjs
 *
 * The one place that knows how a post maps to its AT-Proto record.
 *
 * Both sides import this: `scripts/author/mirror-to-atproto.mjs` uses it to
 * decide what to write and under what key, and the blog post page uses it to
 * link to what was written. They MUST agree — if the derivation drifts, the
 * mirror mints duplicate records and every post page links to a 404.
 *
 * Deliberately plain .mjs with no dependencies and no `~/` aliases: the author
 * script is plain node and imports it by relative path, so it can't reach for
 * `utils/postFilters.ts` or anything Nuxt-flavoured.
 */

// The repo the mirror writes to. Must match whatever account the
// ATPROTO_HANDLE GitHub secret authenticates as — currently
// mrejfox.bsky.social. If that account ever changes, change this too.
export const ATPROTO_DID = 'did:plc:5qysguz3v267ggtfitebl5nc'

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
export const PUB_RKEY = '3mw2wa5qk2222'

// What /.well-known/site.standard.publication serves, so Standard.site readers
// can verify ejfox.com owns the publication. The mirror writes it under the
// authenticated session's DID, which is why ATPROTO_DID must match that account.
export const PUBLICATION_URI = `at://${ATPROTO_DID}/site.standard.publication/${PUB_RKEY}`

const TID_ALPHABET = '234567abcdefghijklmnopqrstuvwxyz'

/** FNV-1a, folded to the 10 bits a TID reserves for a clock id. */
const hash10 = (s) => {
  let h = 0x811c9dc5
  for (let i = 0; i < s.length; i++) {
    h = ((h ^ s.charCodeAt(i)) * 0x01000193) >>> 0
  }
  return h & 0x3ff
}

const encodeTid = (micros, clockId) => {
  const n = (BigInt(micros) << 10n) | BigInt(clockId) // bit 63 stays 0
  let out = ''
  for (let i = 0; i < 13; i++) {
    out += TID_ALPHABET[Number((n >> BigInt(60 - 5 * i)) & 31n)]
  }
  return out
}

/**
 * The timestamp the record carries, and the one its key encodes.
 * Returns null when a post has no usable date — callers must treat that as
 * "not mirrorable" rather than substituting `Date.now()`, which would mint a
 * fresh key (and therefore a duplicate record) on every single run.
 */
export function publishedAtFor(post) {
  const raw = post?.date || post?.metadata?.date
  if (!raw) return null
  const t = Date.parse(raw)
  return Number.isFinite(t) ? new Date(t).toISOString() : null
}

/**
 * site.standard.document declares a `tid` record key, so a slug can't be used
 * directly — the PDS rejects it. But the key still has to be STABLE per post,
 * or every run writes a duplicate instead of upserting. So it's derived, not
 * generated: publish time fills the microsecond field (what a TID is meant to
 * encode anyway) and a hash of the slug fills the clock id, so two posts
 * sharing a date still land on different keys.
 *
 * Changing a post's date changes its key and orphans the old record.
 */
export function rkeyFor(slug, publishedAtISO) {
  const ms = Date.parse(publishedAtISO)
  if (!Number.isFinite(ms)) return null
  return encodeTid(ms * 1000, hash10(slug))
}

/**
 * True while a post is still embargoed by `publishAt` (or a future `date`).
 *
 * Mirrors isScheduled() in utils/postFilters.ts — duplicated because this is
 * plain JS that can't import the TS helper.
 *
 * The mirror runs `--live` on every push to main, so without this a scheduled
 * post's title and date would hit a PUBLIC network the moment it was
 * committed, months before its embargo lifts.
 */
export function isEmbargoed(post) {
  const m = post?.metadata || {}
  const when = m.publishAt || post?.publishAt || m.date || post?.date
  if (!when) return false
  const t = new Date(when).getTime()
  return Number.isFinite(t) && t > Date.now()
}

/**
 * Does a record exist for this post? This is the mirror's own predicate — the
 * post page gates its link on exactly this, so a post that was never mirrored
 * (draft, hidden, unlisted, password-protected, scheduled) never renders a
 * link to a record that isn't there.
 */
export function isMirrorEligible(post) {
  if (!post?.slug) return false
  const m = post.metadata || {}
  const blocked =
    post.draft ||
    m.draft ||
    post.hidden ||
    m.hidden ||
    post.unlisted ||
    m.unlisted ||
    post.password ||
    m.password ||
    post.passwordHash ||
    m.passwordHash ||
    isEmbargoed(post)
  // blog posts live under year dirs (YYYY/…); skips system + section files
  return !blocked && /^\d{4}\//.test(post.slug)
}

/**
 * The post's record as an at:// URI, or null if it has none. The post page
 * puts this in `<link rel="site.standard.document">`, which is how
 * Standard.site verifies that the page and the record belong together.
 */
export function atprotoDocUri(post) {
  if (!isMirrorEligible(post)) return null
  const publishedAt = publishedAtFor(post)
  if (!publishedAt) return null
  const rkey = rkeyFor(post.slug, publishedAt)
  if (!rkey) return null
  return `at://${ATPROTO_DID}/site.standard.document/${rkey}`
}

/**
 * A browsable link to the post's record, or null if it has none. pdsls.dev
 * resolves the DID to whatever PDS currently hosts it, so this keeps working
 * if the account migrates — don't substitute a bare PDS hostname here.
 */
export function atprotoDocUrl(post) {
  const uri = atprotoDocUri(post)
  return uri ? `https://pdsls.dev/${uri}` : null
}
