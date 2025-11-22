/**
 * Post filtering utilities for blog pages
 * Consolidates isWeekNote and isValidPost logic
 */

export interface Post {
  slug?: string
  type?: string
  hidden?: boolean
  draft?: boolean
  date?: string
  metadata?: {
    type?: string
    hidden?: boolean
    draft?: boolean
    date?: string
  }
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
    slug.startsWith('week-notes/') ||
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
  const postDate = post?.date || post?.metadata?.date
  const isFuturePost = postDate && new Date(postDate) > currentDate
  const weekNote = isWeekNote(post)

  if (includeWeekNotes)
    return weekNote && !isHidden && !isDraft && !isFuturePost

  const isRegularBlogPost = /^(?:blog\/)?\d{4}\/[^/]+$/.test(post?.slug || '')
  return (
    !weekNote && isRegularBlogPost && !isHidden && !isDraft && !isFuturePost
  )
}

/**
 * Composable for post filtering
 * @param currentDate - Optional current date override
 * (default: reactive new Date())
 */
export function usePostFilters(currentDate?: Date) {
  const now = currentDate || new Date()

  return {
    isWeekNote,
    isValidPost: (post: Post, includeWeekNotes = false) =>
      isValidPost(post, includeWeekNotes, now)
  }
}
