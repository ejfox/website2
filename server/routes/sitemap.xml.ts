import { defineEventHandler, setHeader, type H3Event } from 'h3'
import { listDispatches } from '~/server/utils/dispatch'
import { escapeXml } from '~/server/utils/xml'
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

export default defineEventHandler(async (event: H3Event) => {
  const baseUrl = 'https://ejfox.com'

  // Static pages with their priorities and update frequencies
  const staticPages = [
    { url: '/', priority: '1.0', changefreq: 'daily' },
    { url: '/blog', priority: '0.9', changefreq: 'daily' },
    { url: '/consulting', priority: '0.9', changefreq: 'monthly' },
    { url: '/process', priority: '0.7', changefreq: 'monthly' },
    { url: '/case-study/nbc-big-board', priority: '0.7', changefreq: 'yearly' },
    { url: '/photos', priority: '0.6', changefreq: 'weekly' },
    { url: '/rides', priority: '0.5', changefreq: 'monthly' },
    { url: '/reading', priority: '0.6', changefreq: 'weekly' },
    { url: '/threads', priority: '0.4', changefreq: 'weekly' },
    { url: '/changelog', priority: '0.4', changefreq: 'weekly' },
    { url: '/projects', priority: '0.8', changefreq: 'weekly' },
    { url: '/gear', priority: '0.7', changefreq: 'weekly' },
    { url: '/stats', priority: '0.6', changefreq: 'daily' },
    { url: '/predictions', priority: '0.7', changefreq: 'weekly' },
    { url: '/dispatch', priority: '0.8', changefreq: 'daily' },
    { url: '/gists', priority: '0.6', changefreq: 'weekly' },
    { url: '/scraps', priority: '0.5', changefreq: 'weekly' },
    { url: '/now', priority: '0.8', changefreq: 'weekly' },
    { url: '/tips', priority: '0.5', changefreq: 'yearly' },
    { url: '/verify', priority: '0.5', changefreq: 'yearly' },
    { url: '/keymap', priority: '0.4', changefreq: 'monthly' },
    { url: '/sitemap', priority: '0.4', changefreq: 'monthly' },
  ]

  const now = new Date().toISOString()

  // Start building sitemap XML with image namespace
  let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
`

  // Add static pages. No <lastmod>: an always-"now" lastmod is noise Google
  // learns to ignore, and these pages have no real modification date.
  for (const page of staticPages) {
    sitemap += renderSitemapUrl({
      loc: sitemapLoc(baseUrl, page.url),
      changefreq: page.changefreq,
      priority: page.priority,
    })
  }

  // Add dynamic blog posts
  try {
    // Use the processed manifest for blog posts
    const fs = await import('node:fs/promises')
    const path = await import('node:path')
    const posts = (await readManifest()) as ManifestPost[]

    // Privacy filters (draft/hidden/unlisted/password/scheduled/special) live
    // in buildSitemapPostEntries — see server/utils/sitemapEntries.ts + test.
    const { entries, tags } = buildSitemapPostEntries(posts)
    const bySlug = new Map(posts.map((p) => [p.slug, p]))
    for (const entry of entries) {
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

    // Tag pages that are real hubs: >=2 PUBLIC posts (counted after the
    // privacy filter, so a drafts-only tag never shows up here).
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

  // Add dynamic predictions
  try {
    const predictions = await $fetch('/api/predictions')
    if (Array.isArray(predictions)) {
      for (const prediction of predictions) {
        sitemap += `  <url>
    <loc>${sitemapLoc(baseUrl, `/predictions/${prediction.id}`)}</loc>
    <lastmod>${prediction.created_at || now}</lastmod>
    <changefreq>never</changefreq>
    <priority>0.6</priority>
  </url>
`
      }
    }
  } catch (error) {
    console.warn('Could not load predictions for sitemap:', error)
  }

  // Add Dispatch pieces — public only (listDispatches without preview drops
  // draft/unlisted/password/scheduled), regardless of dev/prod.
  try {
    const pieces = await listDispatches({ preview: false })
    for (const piece of pieces) {
      sitemap += `  <url>
    <loc>${sitemapLoc(baseUrl, `/dispatch/${piece.slug}`)}</loc>
    <lastmod>${piece.date || now}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
`
      if (piece.image) {
        sitemap += `    <image:image>
      <image:loc>${escapeXml(piece.image)}</image:loc>
    </image:image>
`
      }
      sitemap += `  </url>
`
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
