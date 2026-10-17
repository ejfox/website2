/**
 * Pure sitemap builders (no nitro/h3 imports) so the privacy rules are
 * unit-testable: server/utils/__tests__/sitemapEntries.test.ts.
 *
 * Privacy: a post is advertised only if it is NOT draft / hidden / unlisted /
 * password-protected / scheduled (isScheduled) / a special section. Sealed
 * posts never reach manifest-lite.json at all (see docs/SEALED-POSTS.md).
 * Tag pages are counted from the posts that PASS that filter only, so a tag
 * used only on drafts never leaks into the sitemap.
 */
import { isScheduled, type Post } from '~/utils/postFilters'
import { escapeXml } from './xml'

export interface SitemapUrl {
  loc: string
  lastmod?: string
  changefreq?: string
  priority?: string
  images?: string[]
}

export type ManifestPost = Post & {
  slug?: string
  date?: string | null
  modified?: string | null
  passwordHash?: string
  tags?: string[]
  metadata?: Post['metadata'] & {
    passwordHash?: string
    images?: number
    tags?: string[]
  }
}

/** Percent-encode a site path (spaces, curly quotes…) then XML-escape it. */
export function sitemapLoc(baseUrl: string, path: string): string {
  return escapeXml(`${baseUrl}${encodeURI(path)}`)
}

/** Posts that are never public pages, regardless of other flags. */
function isSpecialSection(slug: string): boolean {
  return (
    slug === 'index' || // content/blog/index.md — duplicates the homepage
    slug.startsWith('drafts/') ||
    slug.startsWith('robots/')
  )
}

export function isSitemapEligible(
  post: ManifestPost,
  now: number = Date.now()
): boolean {
  if (!post?.slug) return false
  const m = post.metadata || {}
  if (post.draft || m.draft) return false
  if (post.hidden || m.hidden) return false
  if (post.unlisted || m.unlisted) return false
  if (post.password || post.passwordHash || m.password || m.passwordHash)
    return false
  if (isSpecialSection(post.slug)) return false
  // Don't advertise a post to crawlers before it publishes.
  if (isScheduled(post, now)) return false
  // Reading notes are often undated; everything else needs a date.
  if (!post.slug.startsWith('reading/') && !post.date) return false
  return true
}

/** The canonical public path for a manifest slug. */
export function sitemapPostPath(slug: string): string {
  // Projects' canonical home is /projects/<slug> (blog-projects-redirect.ts);
  // reading notes' is /reading/<slug> (blog-reading-redirect.ts).
  if (slug.startsWith('projects/') || slug.startsWith('reading/'))
    return `/${slug}`
  return `/blog/${slug}`
}

export function buildSitemapPostEntries(
  posts: ManifestPost[],
  opts: { now?: number; minTagPosts?: number } = {}
): {
  entries: Array<SitemapUrl & { path: string; slug: string }>
  tags: string[]
} {
  const now = opts.now ?? Date.now()
  const minTagPosts = opts.minTagPosts ?? 2
  const entries: Array<SitemapUrl & { path: string; slug: string }> = []
  const tagCounts = new Map<string, number>()

  for (const post of posts || []) {
    if (!isSitemapEligible(post, now)) continue
    const slug = post.slug as string

    let changefreq = 'never'
    if (post.date) {
      const monthsOld =
        (now - new Date(post.date).getTime()) / (1000 * 60 * 60 * 24 * 30)
      changefreq = monthsOld < 1 ? 'monthly' : 'never'
    }
    entries.push({
      slug,
      path: sitemapPostPath(slug),
      // Real modification date, else publish date; never "now".
      lastmod: post.modified || post.date || undefined,
      changefreq,
      priority: post.type === 'essay' ? '0.8' : '0.7',
    })

    for (const tag of post.tags || post.metadata?.tags || []) {
      if (typeof tag !== 'string' || !tag || tag.startsWith('!')) continue
      tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1)
    }
  }

  const tags = [...tagCounts]
    .filter(([, n]) => n >= minTagPosts)
    .map(([t]) => t)
    .sort()
  return { entries, tags }
}

export function renderSitemapUrl(u: SitemapUrl) {
  let xml = `  <url>
    <loc>${u.loc}</loc>
`
  if (u.lastmod) xml += `    <lastmod>${u.lastmod}</lastmod>\n`
  if (u.changefreq) xml += `    <changefreq>${u.changefreq}</changefreq>\n`
  if (u.priority) xml += `    <priority>${u.priority}</priority>\n`
  for (const img of u.images || []) {
    xml += `    <image:image>
      <image:loc>${escapeXml(img)}</image:loc>
    </image:image>
`
  }
  xml += `  </url>
`
  return xml
}
