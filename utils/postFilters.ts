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
  }
}

/**
 * When a post becomes public, as a timestamp. `publishAt` wins if set, so a
 * post can display one date and go live at another; otherwise the post's own
 * `date` is the publish time. Null when neither parses.
 */
export function publishTime(post: Post): number | null {
  const when =
    post?.publishAt ??
    post?.metadata?.publishAt ??
    post?.date ??
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
  const isHidden = post?.hidden === true || post?.metadata?.hidden === true
  const isDraft = post?.draft === true || post?.metadata?.draft === true
  const isUnlisted =
    post?.unlisted === true || post?.metadata?.unlisted === true
  const hasPassword = !!(post?.password || post?.metadata?.password)
  const isFuturePost = isScheduled(post, currentDate.getTime())
  const weekNote = isWeekNote(post)

  // Unlisted and password-protected posts should not appear in listings
  // (password implies unlisted)
  if (includeWeekNotes)
    return (
      weekNote &&
      !isHidden &&
      !isDraft &&
      !isUnlisted &&
      !hasPassword &&
      !isFuturePost
    )

  const isRegularBlogPost = /^(?:blog\/)?\d{4}\/[^/]+$/.test(post?.slug || '')
  return (
    !weekNote &&
    isRegularBlogPost &&
    !isHidden &&
    !isDraft &&
    !isUnlisted &&
    !hasPassword &&
    !isFuturePost
  )
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
