/**
 * @file markdownTwin.ts
 * @description Turn a processed post (content/processed/**.json) into a plain
 *   Markdown copy for AI tools and anyone who wants to cite the text exactly.
 *   Served at /blog/<year>/<slug>.md by server/middleware/markdown-twin.ts.
 *
 * The body is derived from the processed HTML — the same thing the page
 * renders — never from content/blog source. Source is less sanitized
 * (wikilinks to private notes, raw frontmatter keys); processed HTML has
 * already had dead/draft links reduced to plain text and private keys dropped.
 *
 * Frontmatter is a WHITELIST of four keys: title, date, tags, canonical.
 * Adding a frontmatter field to a post must never make it appear here.
 */
import { unified } from 'unified'
import rehypeParse from 'rehype-parse'
import rehypeRemark from 'rehype-remark'
import remarkGfm from 'remark-gfm'
import remarkStringify from 'remark-stringify'
import { visit } from 'unist-util-visit'
import {
  isHiddenFromListings,
  isScheduled,
  type Post,
} from '~/utils/postFilters'
import { isSealedPost, isSealedSlug } from '~/utils/postSeal.mjs'

export const SITE_URL = 'https://ejfox.com'

/** The only frontmatter keys a markdown copy may carry. */
export const MARKDOWN_FRONTMATTER_KEYS = [
  'title',
  'date',
  'tags',
  'canonical',
] as const

/**
 * True if a post may have a public markdown copy. Stricter than the HTML
 * route: `unlisted` (secret-URL) posts are excluded too, because a copy built
 * for machines to ingest is the opposite of "only people with the link".
 * `isHiddenFromListings` reads draft/hidden/unlisted/password/passwordHash/
 * sealed at both the top level and `metadata`; `isScheduled` holds embargoes.
 */
export function isMarkdownServable(
  data: unknown,
  now: number = Date.now()
): boolean {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return false
  const d = data as Record<string, unknown>
  if (isSealedPost(d)) return false
  if (typeof d.html !== 'string' || !d.html.trim()) return false
  const post = d as Post
  return !isHiddenFromListings(post) && !isScheduled(post, now)
}

/**
 * Only `<year>/<slug>` — the shape `isValidPost` calls a regular blog post.
 * Week notes, robots, projects and anything else under content/processed get
 * no markdown copy. `private/` and `..` are refused outright as well.
 */
export function isMarkdownSlug(slug: string): boolean {
  if (!slug || slug.includes('..') || slug.includes('|')) return false
  if (isSealedSlug(`${slug}/`)) return false
  return /^\d{4}\/[^/]+$/.test(slug)
}

// rehype-pretty-code puts the language on `data-language`, which
// hast-util-to-mdast doesn't read; lift it to `language-x` so fences keep it.
// Root-relative hrefs/srcs become absolute so a cited link still resolves.
function rehypeTidy() {
  return (tree: any) => {
    visit(tree, 'element', (node: any) => {
      const p = node.properties || {}
      if (node.tagName === 'code' && p.dataLanguage) {
        p.className = [`language-${p.dataLanguage}`]
      }
      for (const key of ['href', 'src']) {
        const v = p[key]
        if (typeof v === 'string' && v.startsWith('/') && !v.startsWith('//')) {
          p[key] = `${SITE_URL}${v}`
        }
      }
    })
  }
}

const processor = unified()
  .use(rehypeParse, { fragment: true })
  .use(rehypeTidy)
  .use(rehypeRemark)
  .use(remarkGfm)
  .use(remarkStringify, { bullet: '-', fences: true, rule: '-' })

export function htmlToMarkdown(html: string): string {
  return String(processor.processSync(html)).trim()
}

function yamlString(s: string): string {
  // JSON strings are valid YAML double-quoted scalars (colons, quotes, unicode).
  return JSON.stringify(s)
}

function toIsoDate(value: unknown): string | null {
  if (!value) return null
  const t = new Date(value as string).getTime()
  return Number.isFinite(t) ? new Date(t).toISOString() : null
}

/** Build the full `.md` document. Caller must gate with isMarkdownServable. */
export function postToMarkdown(
  data: Record<string, any>,
  slug: string
): string {
  const meta = (data.metadata ?? {}) as Record<string, any>
  const title = String(meta.title || data.title || slug.split('/').pop())
  const date = toIsoDate(meta.date || data.date)
  const rawTags = meta.tags || data.tags
  // `!`-prefixed tags are internal markers (e.g. !featured), not subjects.
  const tags = Array.isArray(rawTags)
    ? rawTags.filter((t) => typeof t === 'string' && !t.startsWith('!'))
    : []
  const canonical = `${SITE_URL}/blog/${slug}`

  const fm = ['---', `title: ${yamlString(title)}`]
  if (date) fm.push(`date: ${yamlString(date)}`)
  fm.push(
    tags.length
      ? `tags:\n${tags.map((t) => `  - ${yamlString(t)}`).join('\n')}`
      : 'tags: []'
  )
  fm.push(`canonical: ${yamlString(canonical)}`, '---')

  return `${fm.join('\n')}\n\n# ${title}\n\n${htmlToMarkdown(data.html)}\n`
}
