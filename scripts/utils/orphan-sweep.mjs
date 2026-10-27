/**
 * @file utils/orphan-sweep.mjs
 * @description Which files in content/processed/ the orphan sweep in
 *   scripts/build/processMarkdown.mjs may delete. Pure, so it can be tested
 *   without importing processMarkdown.mjs (which runs the pipeline on import).
 * Gotchas: content/processed/ has several writers, and only post JSON from
 *   processMarkdown is ever a sweep candidate. CI rsyncs this dir to prod with
 *   --delete (.github/workflows/deploy.yml), so a wrong deletion here takes
 *   the file off the live site too. Add any new writer to the lists below.
 */

// Directories written by something other than "one .md → one .json".
//   private/  sealed envelopes; the source is gitignored, so it never exists
//             on CI (see docs/SEALED-POSTS.md)
//   rides/    scripts/build/process-rides.mjs
const EXEMPT_DIRS = ['private/', 'rides/']

// Top-level files that are not posts.
//   manifest*.json       processMarkdown's own manifest (and any variant)
//   goodreads-stats.json scripts/build/fetch-goodreads.mjs
// index.json is a real post (content/blog/index.md); it is listed anyway so
// a missing index.md can never take the homepage's JSON with it.
const EXEMPT_FILES = [/^manifest[^/]*\.json$/, /^goodreads-stats\.json$/]
const EXEMPT_EXACT = new Set(['index.json'])

/**
 * True if `relativePath` (relative to content/processed, forward slashes)
 * must never be deleted by the orphan sweep, whatever the source tree says.
 */
export function isExemptFromOrphanSweep(relativePath) {
  const rel = relativePath.split('\\').join('/')
  if (EXEMPT_DIRS.some((dir) => rel.startsWith(dir))) return true
  if (EXEMPT_EXACT.has(rel)) return true
  return EXEMPT_FILES.some((re) => re.test(rel))
}

/**
 * True if parsed JSON looks like a post written by processMarkdown (a
 * rendered post carries html + metadata). Anything else in the dir belongs to
 * another writer we don't know about, so the sweep leaves it alone.
 */
export function looksLikePostJson(parsed) {
  return (
    !!parsed &&
    typeof parsed === 'object' &&
    parsed.sealed !== true &&
    typeof parsed.html === 'string' &&
    !!parsed.metadata &&
    typeof parsed.metadata === 'object'
  )
}

/**
 * The output JSON paths whose source post is gone. `outputRelPaths` are
 * relative to content/processed; `sourceSlugs` is the set of slugs derived
 * from content/blog/**.md. Exempt paths are never returned.
 */
export function findOrphanCandidates(outputRelPaths, sourceSlugs) {
  return outputRelPaths.filter((rel) => {
    if (isExemptFromOrphanSweep(rel)) return false
    const slug = rel
      .split('\\')
      .join('/')
      .replace(/\.json$/, '')
    return !sourceSlugs.has(slug)
  })
}
