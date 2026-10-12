/**
 * @file blog-reading-redirect.ts
 * @description 301 /blog/reading/<slug> → /reading/<slug>. Reading notes live
 *   in the blog content pipeline (slug prefix `reading/`), so the generic blog
 *   route rendered every note twice — /blog/reading/X and /reading/X, both
 *   indexable and self-canonical. One canonical home: /reading/<slug>.
 *
 *   The slug is copied from the RAW request path, so its percent-encoding
 *   (`%20`, curly quotes) is preserved byte-for-byte; the query string too.
 *
 *   Also handles one legacy inbound link (aocr.org) to a year-less, lowercased
 *   reading-note URL. Matching that here rather than in routeRules because the
 *   link arrives as `%20`, `%2520` or a literal space depending on the client.
 */
import { sendRedirect } from 'h3'

const LEGACY: Record<string, string> = {
  '/blog/williams-the dead emcee scrolls':
    '/reading/Williams-The%20Dead%20Emcee%20Scrolls',
}

function fullyDecode(s: string): string {
  let prev = s
  for (let i = 0; i < 3; i++) {
    try {
      const next = decodeURIComponent(prev)
      if (next === prev) break
      prev = next
    } catch {
      break
    }
  }
  return prev
}

export default defineEventHandler((event) => {
  const raw = event.path || ''
  if (!raw.startsWith('/blog/')) return

  const qIndex = raw.indexOf('?')
  const path = qIndex === -1 ? raw : raw.slice(0, qIndex)
  const query = qIndex === -1 ? '' : raw.slice(qIndex)

  const legacy = LEGACY[fullyDecode(path).toLowerCase().replace(/\/$/, '')]
  if (legacy) return sendRedirect(event, legacy, 301)

  if (path === '/blog/reading' || path === '/blog/reading/') {
    return sendRedirect(event, `/reading${query}`, 301)
  }
  if (!path.startsWith('/blog/reading/')) return
  const rest = path.slice('/blog/reading/'.length)
  if (!rest || rest.includes('/')) return
  return sendRedirect(event, `/reading/${rest}${query}`, 301)
})
