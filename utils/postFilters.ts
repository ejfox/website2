/**
 * Post filtering utilities for blog pages
 * Consolidates isWeekNote and isValidPost logic
 */

export interface Post {
  slug?: string
  type?: string
  hidden?: boolean
  draft?: boolean
  unlisted?: boolean
  password?: string
  date?: string
  publishAt?: string
  metadata?: {
    type?: string
    hidden?: boolean
    draft?: boolean
    unlisted?: boolean
    password?: string
    date?: string
    publishAt?: string
    // Callers pass several shapes at this boundary — manifest entries, full
    // processed JSON, route-local interfaces — all of which carry extra keys.
    // Without this the guards fail to typecheck at those call sites.
    [key: string]: unknown
  }
}

/**
 * When a post becomes public, as a timestamp. `publishAt` wins if set, so a
 * post can display one date and go live at another; otherwise the post's own
 * `date` is the publish time. Null when neither parses.
 */
export function publishTime(post: Post): number | null {
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
 * draft, which is never written), so the gate is evaluated per request and
 * flips on its own once the time passes — no rebuild needed.
 */
export function isScheduled(post: Post, now: number = Date.now()): boolean {
  const t = publishTime(post)
  return t !== null && t > now
}

/**
 * True if a post must never appear in a public listing, feed, sitemap or
 * search index — for any reason other than an embargo (use `isScheduled` for
 * that; it flips on its own with time, this doesn't).
 *
 * Every flag is read at BOTH the top level and inside `metadata`, and that is
 * the whole point of this function existing. `manifest-lite.json` hoists only
 * `slug, title, date, type, hidden, tags, toc, metadata` — so `unlisted`,
 * `password`, `passwordHash` and `sealed` live ONLY under `metadata`, and a
 * filter written as `!p.unlisted` against a manifest entry is a permanent
 * no-op on `undefined`. `/api/agent/timeline` shipped exactly that bug.
 */
export function isHiddenFromListings(post: Post): boolean {
  const both = (key: string) =>
    Boolean(
      (post as Record<string, unknown>)?.[key] ??
      (post?.metadata as Record<string, unknown> | undefined)?.[key]
    )
  return (
    both('draft') ||
    both('hidden') ||
    both('unlisted') ||
    both('password') ||
    both('passwordHash') ||
    both('sealed')
  )
}

/**
 * Check if a post is a week note
 * @param post - Post object to check
 * @returns true if post is a week note
 */
export function isWeekNote(post: Post): boolean {
  const slug = post?.slug || ''
  const type = post?.type || post?.metadata?.type
  const lastPart = slug.split('/').pop()
  return (
    type === 'weekNote' ||
    type === 'week-note' ||
    slug.startsWith('week-notes/') ||
    slug.includes('/week-notes/') ||
    /^\d{4}-\d{2}$/.test(lastPart || '')
  )
}

/**
 * Check if a post is valid for display
 * @param post - Post object to check
 * @param includeWeekNotes - Whether to include week notes (default: false)
 * @param currentDate - Current date for future post check (default: new Date())
 * @returns true if post should be displayed
 */
export function isValidPost(
  post: Post,
  includeWeekNotes = false,
  currentDate = new Date()
): boolean {
  // One predicate for every visibility flag, rather than five locals that have
  // to be kept in sync here and at a dozen other call sites — the `sealed` and
  // `passwordHash` flags were missing from this list, and the next flag added
  // would have been missing too.
  const excluded =
    isHiddenFromListings(post) || isScheduled(post, currentDate.getTime())
  const weekNote = isWeekNote(post)

  if (includeWeekNotes) return weekNote && !excluded

  const isRegularBlogPost = /^(?:blog\/)?\d{4}\/[^/]+$/.test(post?.slug || '')
  return !weekNote && isRegularBlogPost && !excluded
}

/**
 * Composable for post filtering
 * @param currentDate - Optional current date override
 * (default: reactive new Date())
 */
export function postFilters(currentDate?: Date) {
  const now = currentDate || new Date()

  return {
    isWeekNote,
    isValidPost: (post: Post, includeWeekNotes = false) =>
      isValidPost(post, includeWeekNotes, now),
  }
}
