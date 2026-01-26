import { defineEventHandler, setHeader, type H3Event } from 'h3'

// Nuxt auto-imports $fetch at runtime
declare const $fetch: typeof globalThis.fetch

// Escape XML special characters
function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

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
    { url: '/projects', priority: '0.8', changefreq: 'weekly' },
    { url: '/gear', priority: '0.7', changefreq: 'weekly' },
    { url: '/stats', priority: '0.6', changefreq: 'daily' },
    { url: '/predictions', priority: '0.7', changefreq: 'weekly' },
    { url: '/gists', priority: '0.6', changefreq: 'weekly' },
    { url: '/scrapbook', priority: '0.5', changefreq: 'weekly' },
    { url: '/now', priority: '0.8', changefreq: 'weekly' },
    { url: '/sitemap', priority: '0.4', changefreq: 'monthly' },
  ]

  const now = new Date().toISOString()

  // Start building sitemap XML with image namespace
  let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
`

  // Add static pages
  for (const page of staticPages) {
    sitemap += `  <url>
    <loc>${baseUrl}${page.url}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>
`
  }

  // Add dynamic blog posts
  try {
    // Use the processed manifest for blog posts
    const fs = await import('node:fs/promises')
    const path = await import('node:path')
    const manifestPath = path.join(
      process.cwd(),
      'content/processed/manifest-lite.json'
    )
    const manifestData = await fs.readFile(manifestPath, 'utf-8')
    const posts = JSON.parse(manifestData)

    // Add each blog post to sitemap (filter drafts, hidden, special sections)
    for (const post of posts) {
      const isDraft = post.draft || post.metadata?.draft
      const isHidden = post.hidden || post.metadata?.hidden
      const isSpecialSection =
        post.slug?.startsWith('drafts/') || post.slug?.startsWith('robots/')
      if (!isDraft && !isHidden && !isSpecialSection && post.date) {
        const priority = post.type === 'essay' ? '0.8' : '0.7'
        // Blog posts are static once published - use 'never' or 'yearly' for older posts
        const postDate = new Date(post.date || now)
        const monthsOld =
          (Date.now() - postDate.getTime()) / (1000 * 60 * 60 * 24 * 30)
        const changefreq = monthsOld < 1 ? 'monthly' : 'never'
        // Use actual modification date, fall back to publish date (never use 'now')
        const lastmod = post.modified || post.date

        // Extract images from post HTML if available
        const imageUrls =
          post.metadata?.images > 0
            ? await getPostImages(post.slug, fs, path)
            : []

        sitemap += `  <url>
    <loc>${escapeXml(`${baseUrl}/blog/${post.slug}`)}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
`
        // Add image entries
        for (const imageUrl of imageUrls) {
          sitemap += `    <image:image>
      <image:loc>${escapeXml(imageUrl)}</image:loc>
    </image:image>
`
        }
        sitemap += `  </url>
`
      }
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
    <loc>${escapeXml(`${baseUrl}/predictions/${prediction.id}`)}</loc>
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

  sitemap += `</urlset>`

  // Set correct headers
  setHeader(event, 'Content-Type', 'application/xml')
  setHeader(event, 'Cache-Control', 'public, max-age=3600, s-maxage=86400')

  return sitemap
})
