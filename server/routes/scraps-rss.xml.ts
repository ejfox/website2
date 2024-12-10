import { defineEventHandler } from 'h3'
import { createClient } from '@supabase/supabase-js'
import { sanitizeHtml } from 'h3-utils'
import type { Database } from '~/types/supabase'

const siteURL = 'https://ejfox.com'
const siteName = 'EJ Fox - Digital Garden'
const siteDescription =
  'A digital garden of interesting finds, thoughts, and experiments.'
const SCRAPS_LIMIT = 100
const CACHE_DURATION = 3600

// Initialize Supabase client
const supabase = createClient<Database>(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_KEY!
)

function formatLocation(scrap: any) {
  if (scrap.location && scrap.latitude && scrap.longitude) {
    return `<geo:lat>${scrap.latitude}</geo:lat>
    <geo:long>${scrap.longitude}</geo:long>
    <geo:location>${scrap.location}</geo:location>`
  }
  return ''
}

function formatMetadata(metadata: any) {
  if (!metadata) return ''
  try {
    const metadataStr = Object.entries(metadata)
      .map(([key, value]) => `${key}: ${value}`)
      .join('<br/>')
    return `<br/><br/>Additional Info:<br/>${metadataStr}`
  } catch (e) {
    return ''
  }
}

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
      .eq('shared', true) // Only fetch shared scraps
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
<rss version="2.0" 
  xmlns:atom="http://www.w3.org/2005/Atom" 
  xmlns:content="http://purl.org/rss/1.0/modules/content/"
  xmlns:dc="http://purl.org/dc/elements/1.1/"
  xmlns:geo="http://www.w3.org/2003/01/geo/wgs84_pos#"
  xmlns:media="http://search.yahoo.com/mrss/">
<channel>
  <title>${siteName}</title>
  <description>${siteDescription}</description>
  <link>${siteURL}/scrapbook</link>
  <atom:link href="${siteURL}/scraps-rss.xml" rel="self" type="application/rss+xml" />
  <lastBuildDate>${lastBuildDate.toUTCString()}</lastBuildDate>
  <ttl>${CACHE_DURATION / 60}</ttl>
  <generator>EJ Fox Scrapbook RSS Generator</generator>
  ${scraps
    .map((scrap) => {
      const title =
        scrap.title || scrap.summary?.slice(0, 100) || 'Untitled Scrap'
      const content = scrap.content || ''
      const summary = scrap.summary || ''
      const tags = scrap.tags ? `<br/><br/>Tags: ${scrap.tags.join(', ')}` : ''
      const source = scrap.url
        ? `<br/>Source: <a href="${scrap.url}">${scrap.url}</a>`
        : ''
      const type = scrap.type ? `<br/>Type: ${scrap.type}` : ''
      const metadata = formatMetadata(scrap.metadata)
      const location = formatLocation(scrap)
      const pubDate = new Date(
        scrap.published_at || scrap.created_at
      ).toUTCString()

      const mediaContent = scrap.screenshot_url
        ? `<media:content url="${scrap.screenshot_url}" medium="image" />`
        : ''

      return `<item>
      <title><![CDATA[${title}]]></title>
      <link>${siteURL}/scrapbook#${scrap.id}</link>
      <guid isPermaLink="true">${siteURL}/scrapbook#${scrap.id}</guid>
      <description><![CDATA[${summary}]]></description>
      <pubDate>${pubDate}</pubDate>
      ${location}
      ${mediaContent}
      <dc:creator>EJ Fox</dc:creator>
      <content:encoded><![CDATA[
        ${content}
        ${source}
        ${type}
        ${tags}
        ${metadata}
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
