export default defineEventHandler(async (event) => {
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
    { url: '/sitemap', priority: '0.4', changefreq: 'monthly' }
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

  // TODO: Add dynamic blog posts from content directory
  // TODO: Add dynamic gear items if they have individual pages
  // TODO: Add dynamic prediction pages if they exist

  sitemap += `</urlset>`

  // Set correct headers
  setHeader(event, 'Content-Type', 'application/xml')
  setHeader(event, 'Cache-Control', 'public, max-age=3600, s-maxage=86400')
  
  return sitemap
})