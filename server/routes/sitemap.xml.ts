import { defineEventHandler, setHeader, type H3Event } from 'h3'
import { listDispatches } from '~/server/utils/dispatch'
import { readManifest } from '~/server/utils/manifest'
import {
  buildSitemapPostEntries,
  renderSitemapUrl,
  sitemapLoc,
  type ManifestPost,
} from '~/server/utils/sitemapEntries'

// Nuxt auto-imports $fetch at runtime
declare const $fetch: typeof globalThis.fetch

// Extract unique cloudinary image URLs from HTML content
function extractImageUrls(html: string): string[] {
  if (!html) return []
  // Match cloudinary URLs, get the canonical w_800 version
  const regex =
    /https:\/\/res\.cloudinary\.com\/ejf\/image\/upload\/[^"'\s]+w_800[^"'\s]+/g
  const matches = html.match(regex) || []
  // Dedupe
  return [...new Set(matches)]
}

// Extract images from a post file
async function getPostImages(
  slug: string,
  fs: typeof import('node:fs/promises'),
  path: typeof import('node:path')
): Promise<string[]> {
  try {
    const postPath = path.join(process.cwd(), `content/processed/${slug}.json`)
    const postData = await fs.readFile(postPath, 'utf-8')
    const postJson = JSON.parse(postData)
    return extractImageUrls(postJson.html).slice(0, 3)
  } catch {
    // Post file not found, skip images
    return []
  }
}

// Public static pages, grouped the way /sitemap groups them. Anything with a
// noindex routeRule in nuxt.config.ts (/ff, /live, /atlas, /api-docs,
// /kitchen-sink, bookmarklets, /go, /from-youtube) stays out.
const STATIC_SECTIONS: Array<{
  name: string
  pages: Array<{ url: string; priority: string; changefreq: string }>
}> = [
  {
    name: 'Core',
    pages: [
      { url: '/', priority: '1.0', changefreq: 'daily' },
      { url: '/now', priority: '0.8', changefreq: 'weekly' },
      { url: '/sitemap', priority: '0.4', changefreq: 'monthly' },
    ],
  },
  {
    name: 'Writing',
    pages: [
      { url: '/blog', priority: '0.9', changefreq: 'daily' },
      { url: '/dispatch', priority: '0.8', changefreq: 'daily' },
      { url: '/projects', priority: '0.8', changefreq: 'weekly' },
      { url: '/reading', priority: '0.6', changefreq: 'weekly' },
      { url: '/predictions', priority: '0.7', changefreq: 'weekly' },
    ],
  },
  {
    name: 'Work',
    pages: [
      { url: '/consulting', priority: '0.9', changefreq: 'monthly' },
      { url: '/process', priority: '0.7', changefreq: 'monthly' },
      {
        url: '/case-study/nbc-big-board',
        priority: '0.7',
        changefreq: 'yearly',
      },
      { url: '/calendar', priority: '0.5', changefreq: 'weekly' },
      { url: '/tips', priority: '0.5', changefreq: 'yearly' },
    ],
  },
  {
    name: 'About',
    pages: [
      { url: '/verify', priority: '0.5', changefreq: 'yearly' },
      { url: '/following', priority: '0.4', changefreq: 'monthly' },
      { url: '/updates', priority: '0.4', changefreq: 'monthly' },
      { url: '/changelog', priority: '0.4', changefreq: 'weekly' },
    ],
  },
  {
    name: 'Collections',
    pages: [
      { url: '/photos', priority: '0.6', changefreq: 'weekly' },
      { url: '/gear', priority: '0.7', changefreq: 'weekly' },
      { url: '/rides', priority: '0.5', changefreq: 'monthly' },
      { url: '/scraps', priority: '0.5', changefreq: 'weekly' },
      { url: '/apps', priority: '0.5', changefreq: 'monthly' },
      { url: '/flashcards', priority: '0.3', changefreq: 'monthly' },
      { url: '/keymap', priority: '0.4', changefreq: 'monthly' },
    ],
  },
  {
    name: 'Data',
    pages: [
      { url: '/stats', priority: '0.6', changefreq: 'daily' },
      { url: '/github', priority: '0.5', changefreq: 'weekly' },
      { url: '/gists', priority: '0.6', changefreq: 'weekly' },
      { url: '/threads', priority: '0.4', changefreq: 'weekly' },
      { url: '/on-this-day', priority: '0.4', changefreq: 'daily' },
      { url: '/external-links', priority: '0.3', changefreq: 'monthly' },
      { url: '/hand-drawn', priority: '0.3', changefreq: 'yearly' },
    ],
  },
]

const section = (name: string) => `\n  <!-- ${name} -->\n`

// Newest first; undated entries (reading notes) sink, alphabetically.
const byLastmodDesc = (
  a: { lastmod?: string; slug: string },
  b: { lastmod?: string; slug: string }
) =>
  (b.lastmod || '').localeCompare(a.lastmod || '') ||
  a.slug.localeCompare(b.slug)

export default defineEventHandler(async (event: H3Event) => {
  const baseUrl = 'https://ejfox.com'

  // Start building sitemap XML with image namespace
  let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
`

  // Static pages. No <lastmod>: an always-"now" lastmod is noise Google
  // learns to ignore, and these pages have no real modification date.
  for (const { name, pages } of STATIC_SECTIONS) {
    sitemap += section(name)
    for (const page of pages) {
      sitemap += renderSitemapUrl({
        loc: sitemapLoc(baseUrl, page.url),
        changefreq: page.changefreq,
        priority: page.priority,
      })
    }
  }

  // Add dynamic blog posts
  try {
    const fs = await import('node:fs/promises')
    const path = await import('node:path')
    const posts = (await readManifest()) as ManifestPost[]

    // Privacy filters (draft/hidden/unlisted/password/scheduled/special) live
    // in buildSitemapPostEntries — see server/utils/sitemapEntries.ts + test.
    const { entries, tags } = buildSitemapPostEntries(posts)
    const bySlug = new Map(posts.map((p) => [p.slug, p]))
    const groups = [
      { name: 'Blog posts', match: (p: string) => p.startsWith('/blog/') },
      { name: 'Projects', match: (p: string) => p.startsWith('/projects/') },
      {
        name: 'Reading notes',
        match: (p: string) => p.startsWith('/reading/'),
      },
    ]
    for (const group of groups) {
      sitemap += section(group.name)
      for (const entry of entries
        .filter((e) => group.match(e.path))
        .sort(byLastmodDesc)) {
        const post = bySlug.get(entry.slug)
        const images =
          (post?.metadata?.images || 0) > 0
            ? await getPostImages(entry.slug, fs, path)
            : []
        sitemap += renderSitemapUrl({
          ...entry,
          loc: sitemapLoc(baseUrl, entry.path),
          images,
        })
      }
    }

    // Tag pages that are real hubs: >=2 PUBLIC posts (counted after the
    // privacy filter, so a drafts-only tag never shows up here).
    sitemap += section('Tags')
    for (const tag of tags) {
      sitemap += renderSitemapUrl({
        loc: sitemapLoc(baseUrl, `/tag/${tag}`),
        changefreq: 'weekly',
        priority: '0.4',
      })
    }
  } catch (error) {
    console.warn('Could not load blog posts for sitemap:', error)
  }

  // Predictions. lastmod = the latest real date (made, updated, resolved);
  // they change when resolved, so not "never".
  try {
    const predictions = await $fetch('/api/predictions')
    if (Array.isArray(predictions)) {
      sitemap += section('Predictions')
      for (const prediction of predictions) {
        const lastmod = [
          prediction.created,
          prediction.updatedAt,
          prediction.resolved_date,
        ]
          .filter(Boolean)
          .sort()
          .pop()
        sitemap += renderSitemapUrl({
          loc: sitemapLoc(baseUrl, `/predictions/${prediction.id}`),
          lastmod,
          changefreq: prediction.resolved_date ? 'yearly' : 'monthly',
          priority: '0.6',
        })
      }
    }
  } catch (error) {
    console.warn('Could not load predictions for sitemap:', error)
  }

  // Add Dispatch pieces — public only (listDispatches without preview drops
  // draft/unlisted/password/scheduled), regardless of dev/prod.
  try {
    const pieces = await listDispatches({ preview: false })
    if (pieces.length) sitemap += section('Dispatch')
    for (const piece of pieces) {
      sitemap += renderSitemapUrl({
        loc: sitemapLoc(baseUrl, `/dispatch/${piece.slug}`),
        lastmod: piece.date || undefined,
        changefreq: 'monthly',
        priority: '0.7',
        images: piece.image ? [piece.image] : [],
      })
    }
  } catch (error) {
    console.warn('Could not load dispatch pieces for sitemap:', error)
  }

  sitemap += `</urlset>`

  // Set correct headers
  setHeader(event, 'Content-Type', 'application/xml')
  setHeader(event, 'Cache-Control', 'public, max-age=3600, s-maxage=86400')

  return sitemap
})
