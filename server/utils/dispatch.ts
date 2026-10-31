/**
 * @file dispatch.ts
 * @description Shared loader for Dispatch pieces — small standalone pieces of
 * journalism at /dispatch/<slug>. One piece = content/dispatch/<slug>.md,
 * read at request time with gray-matter (same as predictions), so a scheduled
 * piece goes live on its own once `publishAt` passes, no rebuild.
 *
 * Visibility: the same five-state rule as posts (utils/visibility.mjs).
 *   - listings / feed / sitemap: public only — `isPublicDispatch`.
 *   - direct URL: unlisted is served (with noindex); draft and scheduled 404
 *     in production. Dev previews everything, like /api/posts.
 *
 * Importers: server/api/dispatch.get.ts, server/api/dispatch/[slug].get.ts,
 * server/routes/dispatch-rss.xml.ts, server/routes/sitemap.xml.ts.
 *
 * Markdown is rendered with allowDangerousHtml: raw HTML in a piece passes
 * through unsanitised. Fine for EJ-authored files; never feed it other input.
 */
import { promises as fs } from 'node:fs'
import { join, resolve, sep } from 'node:path'
import matter from 'gray-matter'
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkGfm from 'remark-gfm'
import remarkRehype from 'remark-rehype'
import rehypeStringify from 'rehype-stringify'
import { isListed, isScheduled, isServed } from '~/utils/visibility.mjs'

// ── Types ───────────────────────────────────────────────────────────────────

export interface DispatchLink {
  title: string
  url: string
}

export interface DispatchClaim {
  text: string
  source: string
}

export interface DispatchSyndication {
  network: string
  url: string
}

export interface DispatchMeta {
  slug: string
  title: string
  dek: string
  date: string | null
  publishAt: string | null
  image: string | null
  image_alt: string | null
  tags: string[]
  sources: DispatchLink[]
  data: string | null
  claims: DispatchClaim[]
  syndication: DispatchSyndication[]
  unlisted: boolean
  draft: boolean
  /** True while `publishAt` (or `date`) is still in the future. */
  scheduled: boolean
  /** True when the page must carry robots noindex (unlisted/draft/scheduled). */
  noindex: boolean
}

export interface DispatchPiece extends DispatchMeta {
  html: string
}

// ── Slugs + frontmatter normalising ─────────────────────────────────────────

const DISPATCH_DIR = join(process.cwd(), 'content', 'dispatch')

// Lowercase words joined by single hyphens. Rejects dots and slashes outright,
// so `..`, `a/b` and encoded variants can never name a file outside the dir.
const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

export function isValidDispatchSlug(slug: unknown): slug is string {
  return typeof slug === 'string' && slug.length <= 200 && SLUG_RE.test(slug)
}

/** Only http(s) or site-relative URLs survive — no javascript:, data:, etc. */
function safeUrl(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const v = value.trim()
  if (/^https?:\/\//i.test(v)) return v
  if (v.startsWith('/') && !v.startsWith('//')) return v
  return null
}

function str(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

/** gray-matter turns unquoted ISO timestamps into Date objects. */
function isoOrNull(value: unknown): string | null {
  if (value instanceof Date)
    return Number.isNaN(value.getTime()) ? null : value.toISOString()
  if (typeof value === 'string' && value.trim()) return value.trim()
  return null
}

function asArray(value: unknown): Record<string, unknown>[] {
  return Array.isArray(value)
    ? value.filter(
        (v): v is Record<string, unknown> => !!v && typeof v === 'object'
      )
    : []
}

function normalize(slug: string, data: Record<string, unknown>): DispatchMeta {
  const date = isoOrNull(data.date)
  const publishAt = isoOrNull(data.publishAt)
  const image = safeUrl(data.image)
  const draft = Boolean(data.draft)
  const unlisted = Boolean(data.unlisted)
  const scheduled = isScheduled({
    date: date ?? undefined,
    publishAt: publishAt ?? undefined,
  })

  return {
    slug,
    title: str(data.title) || slug,
    dek: str(data.dek),
    date,
    publishAt,
    image,
    image_alt: image ? str(data.image_alt) || null : null,
    tags: Array.isArray(data.tags)
      ? data.tags.filter((t): t is string => typeof t === 'string')
      : [],
    sources: asArray(data.sources)
      .map((s) => ({ title: str(s.title), url: safeUrl(s.url) }))
      .filter((s): s is DispatchLink => !!s.url)
      .map((s) => ({ ...s, title: s.title || s.url })),
    data: safeUrl(data.data),
    claims: asArray(data.claims)
      .map((c) => ({ text: str(c.text), source: safeUrl(c.source) ?? '' }))
      .filter((c) => c.text),
    syndication: asArray(data.syndication)
      .map((s) => ({ network: str(s.network), url: safeUrl(s.url) }))
      .filter((s): s is DispatchSyndication => !!s.url && !!s.network),
    unlisted,
    draft,
    scheduled,
    noindex: draft || unlisted || scheduled,
  }
}

// ── Visibility ──────────────────────────────────────────────────────────────

/** Raw frontmatter flags, for the shared visibility predicates. */
type Flags = Record<string, unknown>

/** True if the piece may appear in a listing, feed or sitemap. */
export function isPublicDispatch(flags: Flags): boolean {
  return isListed(flags)
}

// Dates normalised to ISO strings first: gray-matter hands back Date objects
// for unquoted timestamps, and the shared predicates are typed for strings.
function flagsOf(data: Record<string, unknown>): Flags {
  return {
    ...data,
    date: isoOrNull(data.date) ?? undefined,
    publishAt: isoOrNull(data.publishAt) ?? undefined,
  }
}

// ── Reading + rendering ─────────────────────────────────────────────────────

async function readSource(slug: string) {
  const filePath = resolve(DISPATCH_DIR, `${slug}.md`)
  // Belt and braces on top of SLUG_RE: never read outside the dispatch dir.
  if (!filePath.startsWith(DISPATCH_DIR + sep)) return null
  try {
    const raw = await fs.readFile(filePath, 'utf-8')
    return matter(raw)
  } catch {
    return null
  }
}

const processor = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkRehype, { allowDangerousHtml: true })
  .use(rehypeStringify, { allowDangerousHtml: true })

export async function renderDispatchMarkdown(
  markdown: string
): Promise<string> {
  return markdown.trim() ? String(await processor.process(markdown)) : ''
}

// ── Public API ──────────────────────────────────────────────────────────────

/**
 * All pieces, newest first. Public only unless `preview` (dev), which also
 * returns drafts/unlisted/scheduled so they can be checked locally.
 */
export async function listDispatches({
  preview = false,
}: { preview?: boolean } = {}): Promise<DispatchMeta[]> {
  let files: string[]
  try {
    files = await fs.readdir(DISPATCH_DIR)
  } catch {
    return []
  }

  const pieces = await Promise.all(
    files
      .filter((f) => f.endsWith('.md'))
      .map((f) => f.slice(0, -3))
      .filter(isValidDispatchSlug)
      .map(async (slug) => {
        const parsed = await readSource(slug)
        if (!parsed) return null
        const data = parsed.data as Record<string, unknown>
        if (!preview && !isPublicDispatch(flagsOf(data))) return null
        return normalize(slug, data)
      })
  )

  return pieces
    .filter((p): p is DispatchMeta => p !== null)
    .sort(
      (a, b) =>
        new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime()
    )
}

/**
 * One piece with rendered HTML, or null if it doesn't exist or must not be
 * served. Unlisted pieces ARE returned (with `noindex: true`).
 */
export async function getDispatch(
  slug: string,
  { preview = false }: { preview?: boolean } = {}
): Promise<DispatchPiece | null> {
  if (!isValidDispatchSlug(slug)) return null
  const parsed = await readSource(slug)
  if (!parsed) return null
  const data = parsed.data as Record<string, unknown>
  if (!isServed(flagsOf(data), { dev: preview })) return null
  return {
    ...normalize(slug, data),
    html: await renderDispatchMarkdown(parsed.content),
  }
}
