/**
 * @file readingKindle.ts
 * @description withKindleSync(): merge data/reading-kindle.json into a reading
 *   note's metadata. Used by server/api/reading.get.ts, reading/[slug].get.ts,
 *   agent/timeline.get.ts and temporal-context.get.ts.
 *   Tests: server/utils/__tests__/readingKindle.test.ts.
 *
 * Kindle metadata for reading notes (cover, title, author, asin, highlight
 * count, last-annotated date), keyed by reading slug (the note's filename).
 *
 * It used to live in each note's `kindle-sync:` frontmatter block. Those
 * blocks were stripped on 2026-07-05 (33b0879a) as "dead", which silently
 * blanked every cover and broke /reading's sort, stats, /now and the agent
 * timeline. The notes are mirrored from the Obsidian vault, so the data lives
 * here instead of back in 97 frontmatters, and is merged in at request time
 * under the same `metadata['kindle-sync']` key every consumer already reads.
 */
import kindleBooks from '~/data/reading-kindle.json'

type KindleSync = Record<string, string | number>

const books = kindleBooks as Record<string, KindleSync>

export function withKindleSync<
  T extends { metadata?: Record<string, unknown> },
>(book: T, slug: string): T {
  // hasOwn, not books[slug]: a slug like `constructor` must not hit the prototype.
  const kindle = Object.hasOwn(books, slug) ? books[slug] : undefined
  if (!kindle) return book
  book.metadata = {
    ...book.metadata,
    // Frontmatter wins over the JSON when both have a key (spread order).
    'kindle-sync': {
      ...kindle,
      ...(book.metadata?.['kindle-sync'] as KindleSync | undefined),
    },
  }
  return book
}
