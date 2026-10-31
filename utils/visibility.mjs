/**
 * @file visibility.mjs
 * @description THE post-visibility rule. One function, five states, imported
 *   by everything: server routes and pages (`~/utils/visibility.mjs`), build
 *   and author scripts (relative path), nuxt.helpers.ts (relative path).
 *   Plain JS on purpose, like postSeal.mjs, so Nitro, Vue and bare `node`
 *   scripts all load the same file and there is no copy to drift.
 *   Tests: utils/__tests__/visibility.test.mjs.
 *
 *   sealed     in private/ (or a sealed envelope). Served only as ciphertext.
 *   draft      `draft: true`. 404, unlisted, no JSON written (except projects/,
 *              written so dev can preview them).
 *   scheduled  publishAt || date in the future. 404 in prod and not listed
 *              until that moment, then public with no rebuild.
 *   unlisted   `unlisted: true`. 200 at its URL (noindex), never in a listing,
 *              feed, sitemap, search, tag or on-this-day surface.
 *   public     everything else.
 *
 * Precedence is that order: sealed > draft > scheduled > unlisted > public.
 *
 * Every flag is read at BOTH the top level and inside `metadata`, because
 * callers pass three shapes: raw frontmatter (flat), manifest-lite entries
 * (a few keys hoisted, the rest under `metadata`) and processed JSON
 * (everything under `metadata`). `/api/agent/timeline` once shipped a
 * `!p.unlisted` filter that was a permanent no-op on a manifest entry.
 *
 * `hidden`, `password`, `passwordHash`, `inprogress`, `type: draft|private`
 * and `metadata.private` were removed 2026-10-31. A `hidden:` key fails the
 * build (assertNoRemovedVisibilityKeys); `password*` already fails the sealed
 * tripwire in processMarkdown. Nothing here reads them.
 */
import { isSealedSlug } from './postSeal.mjs'

/** @typedef {'sealed' | 'draft' | 'scheduled' | 'unlisted' | 'public'} Visibility */

const flag = (post, key) => Boolean(post?.[key] || post?.metadata?.[key])

/**
 * When a post becomes public, as a timestamp. `publishAt` wins if set, so a
 * post can display one date and go live at another; otherwise its own `date`.
 * Null when neither parses.
 */
export function publishTime(post) {
  // `||` not `??`: an empty-string or otherwise falsy `publishAt` must fall
  // through to `date` rather than short-circuiting to "not scheduled", which
  // would fail open and publish an embargoed post immediately.
  const when =
    post?.publishAt ||
    post?.metadata?.publishAt ||
    post?.date ||
    post?.metadata?.date
  if (!when) return null
  const t = new Date(when).getTime()
  return Number.isFinite(t) ? t : null
}

/**
 * True while a post is still embargoed. Its JSON ships in the build (unlike a
 * draft's), so this is evaluated per request and flips on its own.
 */
export function isScheduled(post, now = Date.now()) {
  const t = publishTime(post)
  return t !== null && t > now
}

/**
 * @param {object} post frontmatter, manifest entry or processed JSON
 * @param {number} [now]
 * @returns {Visibility} the post's state
 */
export function visibility(post, now = Date.now()) {
  if (flag(post, 'sealed') || isSealedSlug(post?.slug)) return 'sealed'
  if (flag(post, 'draft')) return 'draft'
  if (isScheduled(post, now)) return 'scheduled'
  if (flag(post, 'unlisted')) return 'unlisted'
  return 'public'
}

/** In listings, feeds, sitemap, search, tags, on-this-day: public only. */
export function isListed(post, now = Date.now()) {
  return visibility(post, now) === 'public'
}

/** A public post at /blog/<year>/<slug> — what /blog and /stats count. */
export function isListedBlogPost(post, now = Date.now()) {
  return (
    isListed(post, now) && /^(?:blog\/)?\d{4}\/[^/]+$/.test(post?.slug || '')
  )
}

/**
 * Answers 200 at its own URL. Production: public and unlisted. Dev previews
 * drafts and scheduled posts too. Sealed posts are never "served" in this
 * sense; their route returns the envelope by its own rule (isSealedPost).
 */
export function isServed(post, { dev = false, now = Date.now() } = {}) {
  const v = visibility(post, now)
  if (v === 'sealed') return false
  return dev || v === 'public' || v === 'unlisted'
}

/**
 * Frontmatter keys that used to mean something and now must not appear. A
 * leftover one would otherwise be silently ignored, and `hidden: true` being
 * ignored means a post that was 404 becomes public.
 * @returns {string | null} the problem, or null when the frontmatter is fine
 */
export function removedVisibilityKeyProblem(frontmatter) {
  if (frontmatter && Object.hasOwn(frontmatter, 'hidden')) {
    return 'hidden was removed 2026-10-31; use draft: true or unlisted: true'
  }
  return null
}
