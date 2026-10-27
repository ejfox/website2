/**
 * @file text-processing.ts
 * @description Text processing utilities for search and content analysis.
 *   Shared by server/api/search.get.ts, suggest.get.ts and mastodon.get.ts
 *   (stripHtml only).
 *
 * stripHtml is for indexing, not sanitising: it leaves entities encoded and
 *   is no defence against hostile HTML.
 */

/**
 * Strip HTML tags and normalize whitespace
 * @param html - HTML string to clean
 * @returns Clean text without HTML tags
 */
export function stripHtml(html: string): string {
  if (!html) return ''
  return html
    .replace(/<[^>]*>/g, ' ') // Remove HTML tags
    .replace(/\s+/g, ' ') // Collapse whitespace
    .trim()
}

/**
 * Tokenize text for search and similarity scoring
 * @param text - Text to tokenize
 * @returns Array of lowercase tokens (words > 2 chars)
 */
export function tokenize(text: string): string[] {
  if (!text) return []
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ') // Replace punctuation with spaces
    .split(/\s+/)
    .filter((word) => word.length > 2) // Filter out short words
}
