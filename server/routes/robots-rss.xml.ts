/**
 * @file robots-rss.xml.ts
 * @description GET /robots-rss.xml — RSS of the 20 newest `robots/` posts
 *   (AI/automation experiments, kept out of the main /rss.xml).
 *
 * Visibility: readManifest() + isListable() (server/utils/manifest.ts): public
 *   only, per utils/visibility.mjs. Bodies are
 *   read straight from content/processed/<slug>.json and are NOT passed
 *   through feedHtml(), so relative links stay relative in readers.
 */
import { defineEventHandler } from 'h3'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { escapeXml, cdata } from '~/server/utils/xml'
import { readManifest, isListable } from '~/server/utils/manifest'

const siteURL = 'https://ejfox.com'
const siteName = 'EJ Fox - Robot Posts'
const siteDescription = 'Experiments and explorations in AI and automation.'

export default defineEventHandler(async (event) => {
  try {
    const manifest = await readManifest()

    const filteredPosts = manifest
      // Only robot posts, and only public ones
      .filter((post) => post.slug.startsWith('robots/') && isListable(post))
      .sort(
        (a: { date: string }, b: { date: string }) =>
          new Date(b.date).getTime() - new Date(a.date).getTime()
      )
      .slice(0, 20)

    // Items: allSettled + a per-item catch, so one unreadable post JSON drops
    // that item, not the feed.
    const rssNamespaces =
      'xmlns:atom="http://www.w3.org/2005/Atom" ' +
      'xmlns:content="http://purl.org/rss/1.0/modules/content/"'
    const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" ${rssNamespaces}>
<channel>
  <title>${siteName}</title>
  <description>${siteDescription}</description>
  <link>${siteURL}/blog/robots</link>
  <atom:link href="${siteURL}/robots-rss.xml" rel="self"
             type="application/rss+xml" />
  <pubDate>${new Date().toUTCString()}</pubDate>
  ${(
    await Promise.allSettled(
      filteredPosts.map(
        async (post: {
          slug: string
          title: string
          dek?: string
          metadata?: { dek?: string }
          date: string
        }) => {
          try {
            const postPath = resolve(
              process.cwd(),
              'content',
              'processed',
              `${post.slug}.json`
            )
            // Processed post JSON stores the rendered body under `html`.
            // Reading `content` here emitted CDATA[undefined] for every item.
            const { html: htmlContent } = JSON.parse(
              await readFile(postPath, 'utf-8')
            )
            return `<item>
        <title>${escapeXml(post.title)}</title>
        <link>${siteURL}/blog/${post.slug}</link>
        <guid isPermaLink="true">${siteURL}/blog/${post.slug}</guid>
        <description>${escapeXml(post.dek || post.metadata?.dek || '')}</description>
        <pubDate>${new Date(post.date).toUTCString()}</pubDate>
        <content:encoded>${cdata(htmlContent || '')}</content:encoded>
      </item>`
          } catch (error) {
            console.error(`Error processing post ${post.slug}:`, error)
            return ''
          }
        }
      )
    )
  )
    .filter((r) => r.status === 'fulfilled')
    .map((r) => r.value)
    .join('')}
</channel>
</rss>`

    event.node.res.setHeader('Content-Type', 'application/xml')
    return rss
  } catch (error) {
    console.error(`Error generating robots RSS feed:`, error)
    event.node.res.statusCode = 500
    const errorXml =
      '<?xml version="1.0" encoding="UTF-8"?>' +
      '<rss version="2.0">' +
      '<channel>' +
      '<title>Error</title>' +
      '<description>Error generating RSS feed</description>' +
      '</channel>' +
      '</rss>'
    return errorXml
  }
})
