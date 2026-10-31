/**
 * @file manifest.ts
 * @description The one place server code reads
 *   `content/processed/manifest-lite.json`. Importers: server/middleware/
 *   legacy-redirect.ts (MANIFEST_PATH only), server/routes/sitemap.xml.ts,
 *   server/routes/robots-rss.xml.ts and several server/api routes (manifest,
 *   projects, photo-posts, agent/timeline, gear-posts, words-this-month).
 *   Tests: server/utils/__tests__/manifest.test.ts.
 *   Sealed posts are omitted from the manifest at write time, so no reader
 *   here ever sees one.
 *
 * Nine routes used to read and parse it themselves, and each carried its own
 * copy of the "is this post public?" checks. Two of those copies were
 * hand-written flag lists that drifted. Reading through here and filtering
 * with `isListable` keeps every listing surface on the same rule.
 *
 * Paths are `process.cwd()`-relative on purpose: in prod that's the VPS
 * checkout (CI lays its fresh `content/processed` over it on deploy), and a
 * PR preview runs from its own directory.
 */
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { isListed } from '~/utils/visibility.mjs'

export type ManifestEntry = {
  slug: string
  title?: string
  date?: string
  tags?: string[]
  metadata?: Record<string, any>
  [key: string]: any
}

export const MANIFEST_PATH = () =>
  join(process.cwd(), 'content/processed/manifest-lite.json')

/**
 * Parsed manifest-lite.json. Throws if it's missing or unreadable.
 * UNFILTERED: it includes unlisted and scheduled entries (drafts and sealed
 * posts are never written to it). Filter with isListable before anything
 * reaches a response.
 */
export async function readManifest(): Promise<ManifestEntry[]> {
  return JSON.parse(await readFile(MANIFEST_PATH(), 'utf8'))
}

/** May appear in a public listing, feed or count: visibility is 'public'. */
export function isListable(post: object): boolean {
  return isListed(post)
}
