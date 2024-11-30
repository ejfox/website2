import { defineEventHandler } from 'h3'
import { createClient } from '@supabase/supabase-js'

const siteURL = 'https://ejfox.com'
const siteName = 'EJ Fox - Scraps'
const siteDescription = 'Digital scrapbook of interesting finds and thoughts.'
const SCRAPS_LIMIT = 100
const CACHE_DURATION = 3600

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_KEY!
)

export default defineEventHandler(async (event) => {
  try {
    // Add cache control headers
    event.node.res.setHeader(
      'Cache-Control',
      `public, max-age=${CACHE_DURATION}`
    )

    const { data: scraps, error } = await supabase
      .from('scraps')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(SCRAPS_LIMIT)

    if (error) throw error

    const lastBuildDate = scraps.reduce((latest, scrap) => {
      const scrapDate = new Date(scrap.updated_at || scrap.created_at)
      return scrapDate > latest ? scrapDate : latest
    }, new Date(0))

    // Add ETag header based on the last update time
    const etag = `"${lastBuildDate.getTime()}"`
    event.node.res.setHeader('ETag', etag)

    // Check if content hasn't changed
    const ifNoneMatch = event.node.req.headers['if-none-match']
    if (ifNoneMatch === etag) {
      event.node.res.statusCode = 304 // Not Modified
      return ''
    }

    const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:dc="http://purl.org/dc/elements/1.1/">
<channel>
  <title>${siteName}</title>
  <description>${siteDescription}</description>
  <link>${siteURL}/scrapbook</link>
  <atom:link href="${siteURL}/scraps-rss.xml" rel="self" type="application/rss+xml" />
  <lastBuildDate>${lastBuildDate.toUTCString()}</lastBuildDate>
  <ttl>${CACHE_DURATION / 60}</ttl>
  ${scraps
    .map((scrap) => {
      const content = scrap.content || ''
      const summary = scrap.summary || ''
      const tags = scrap.tags ? `<br/><br/>Tags: ${scrap.tags.join(', ')}` : ''
      const source = scrap.source ? `<br/>Source: ${scrap.source}` : ''
      const pubDate = new Date(scrap.created_at).toUTCString()

      return `<item>
      <title><![CDATA[${summary.slice(0, 100)}]]></title>
      <link>${siteURL}/scrapbook#${scrap.id}</link>
      <guid isPermaLink="true">${siteURL}/scrapbook#${scrap.id}</guid>
      <description><![CDATA[${summary}]]></description>
      <pubDate>${pubDate}</pubDate>
      <content:encoded><![CDATA[
        ${content}
        ${source}
        ${tags}
      ]]></content:encoded>
    </item>`
    })
    .join('\n')}
</channel>
</rss>`

    event.node.res.setHeader('Content-Type', 'application/xml')
    return rss
  } catch (error) {
    console.error(`Error generating scraps RSS feed:`, error)
    event.node.res.statusCode = 500
    return '<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>Error</title><description>Error generating scraps RSS feed</description></channel></rss>'
  }
})
