import { defineEventHandler } from 'h3'
import { createClient } from '@supabase/supabase-js'
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

function formatDateTime(date: string | null): string {
  if (!date) return ''
  return new Date(date).toUTCString()
}

function formatLocation(scrap: any): string {
  if (!scrap.location || !scrap.latitude || !scrap.longitude) return ''

  return `
    <geo:lat>${scrap.latitude}</geo:lat>
    <geo:long>${scrap.longitude}</geo:long>
    <geo:location>${scrap.location}</geo:location>
    <location:formatted>${scrap.location}</location:formatted>`
}

function formatMetadata(metadata: any): string {
  if (!metadata) return ''
  try {
    return Object.entries(metadata)
      .map(([key, value]) => {
        // Format key for better readability
        const formattedKey = key
          .replace(/_/g, ' ')
          .replace(/\b\w/g, (l) => l.toUpperCase())
        return `<metadata:${key}>${value}</metadata:${key}>`
      })
      .join('\n')
  } catch (e) {
    return ''
  }
}

function formatRelationships(relationships: any): string {
  if (!relationships) return ''
  try {
    return Object.entries(relationships)
      .map(
        ([key, value]) => `<relationship:${key}>${value}</relationship:${key}>`
      )
      .join('\n')
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
      .eq('shared', true)
      .order('created_at', { ascending: false })
      .limit(SCRAPS_LIMIT)

    if (error) throw error

    const lastBuildDate = scraps.reduce((latest, scrap) => {
      const scrapDate = new Date(scrap.updated_at || scrap.created_at)
      return scrapDate > latest ? scrapDate : latest
    }, new Date(0))

    // ETag handling
    const etag = `"${lastBuildDate.getTime()}"`
    event.node.res.setHeader('ETag', etag)
    if (event.node.req.headers['if-none-match'] === etag) {
      event.node.res.statusCode = 304
      return ''
    }

    const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" 
  xmlns:atom="http://www.w3.org/2005/Atom" 
  xmlns:content="http://purl.org/rss/1.0/modules/content/"
  xmlns:dc="http://purl.org/dc/elements/1.1/"
  xmlns:geo="http://www.w3.org/2003/01/geo/wgs84_pos#"
  xmlns:media="http://search.yahoo.com/mrss/"
  xmlns:metadata="http://ejfox.com/ns/metadata/"
  xmlns:relationship="http://ejfox.com/ns/relationship/"
  xmlns:location="http://ejfox.com/ns/location/">
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
      const pubDate = formatDateTime(scrap.published_at || scrap.created_at)
      const updateDate = formatDateTime(scrap.updated_at)
      const location = formatLocation(scrap)
      const metadata = formatMetadata(scrap.metadata)
      const relationships = formatRelationships(scrap.relationships)

      const mediaContent = scrap.screenshot_url
        ? `<media:content url="${scrap.screenshot_url}" medium="image" />`
        : ''

      return `<item>
      <title><![CDATA[${title}]]></title>
      <link>${siteURL}/scrapbook#${scrap.id}</link>
      <guid isPermaLink="true">${siteURL}/scrapbook#${scrap.id}</guid>
      <pubDate>${pubDate}</pubDate>
      ${updateDate ? `<dc:modified>${updateDate}</dc:modified>` : ''}
      <dc:creator>EJ Fox</dc:creator>
      <dc:type>${scrap.type || 'unknown'}</dc:type>
      ${scrap.source ? `<dc:source>${scrap.source}</dc:source>` : ''}
      ${location}
      ${mediaContent}
      ${metadata}
      ${relationships}
      <description><![CDATA[${scrap.summary || ''}]]></description>
      <content:encoded><![CDATA[
        ${scrap.content || ''}
        ${
          scrap.url
            ? `<p>Source: <a href="${scrap.url}">${scrap.url}</a></p>`
            : ''
        }
        ${scrap.tags ? `<p>Tags: ${scrap.tags.join(', ')}</p>` : ''}
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
