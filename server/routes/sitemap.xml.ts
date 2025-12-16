import { defineEventHandler, setHeader, type H3Event } from 'h3'

// Nuxt auto-imports $fetch at runtime
declare const $fetch: typeof globalThis.fetch

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

  // Start building sitemap XML
  let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
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

    // Add each blog post to sitemap
    for (const post of posts) {
      if (!post.hidden && !post.draft) {
        const priority = post.type === 'essay' ? '0.8' : '0.7'
        const changefreq = 'monthly'
        const lastmod = post.modified || post.date || now

        sitemap += `  <url>
    <loc>${baseUrl}/blog/${post.slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>
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
    <loc>${baseUrl}/predictions/${prediction.id}</loc>
    <lastmod>${prediction.created_at || now}</lastmod>
    <changefreq>monthly</changefreq>
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
