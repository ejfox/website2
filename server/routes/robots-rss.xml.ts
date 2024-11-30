import { defineEventHandler } from 'h3'
import { readFile } from 'fs/promises'
import { resolve } from 'path'

const siteURL = 'https://ejfox.com'
const siteName = 'EJ Fox - Robot Posts'
const siteDescription = 'Experiments and explorations in AI and automation.'

export default defineEventHandler(async (event) => {
  try {
    const manifestPath = resolve(
      process.cwd(),
      'content/processed/manifest-lite.json'
    )
    const manifest = JSON.parse(await readFile(manifestPath, 'utf-8'))

    const filteredPosts = manifest
      // Only include robot posts
      .filter((post: { slug: string }) => post.slug.startsWith('robots/'))
      // Filter out hidden posts
      .filter((post: { hidden?: boolean }) => !post.hidden)
      // Filter out drafts
      .filter((post: { draft?: boolean }) => !post.draft)
      .sort(
        (a: { date: string }, b: { date: string }) =>
          new Date(b.date).getTime() - new Date(a.date).getTime()
      )
      .slice(0, 20)

    const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/">
<channel>
  <title>${siteName}</title>
  <description>${siteDescription}</description>
  <link>${siteURL}/robots</link>
  <atom:link href="${siteURL}/robots-rss.xml" rel="self" type="application/rss+xml" />
  <pubDate>${new Date().toUTCString()}</pubDate>
  ${await Promise.all(
    filteredPosts.map(
      async (post: {
        slug: string
        title: string
        description?: string
        date: string
      }) => {
        try {
          const postPath = resolve(
            process.cwd(),
            'content',
            'processed',
            `${post.slug}.json`
          )
          const { content: htmlContent } = JSON.parse(
            await readFile(postPath, 'utf-8')
          )
          return `<item>
        <title>${escapeXml(post.title)}</title>
        <link>${siteURL}/blog/${post.slug}</link>
        <guid isPermaLink="true">${siteURL}/blog/${post.slug}</guid>
        <description>${escapeXml(post.description || '')}</description>
        <pubDate>${new Date(post.date).toUTCString()}</pubDate>
        <content:encoded><![CDATA[${htmlContent}]]></content:encoded>
      </item>`
        } catch (error) {
          console.error(`Error processing post ${post.slug}:`, error)
          return ''
        }
      }
    )
  )}
</channel>
</rss>`

    event.node.res.setHeader('Content-Type', 'application/xml')
    return rss
  } catch (error) {
    console.error(`Error generating robots RSS feed:`, error)
    event.node.res.statusCode = 500
    return '<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>Error</title><description>Error generating RSS feed</description></channel></rss>'
  }
})

function escapeXml(unsafe: string): string {
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<':
        return '&lt;'
      case '>':
        return '&gt;'
      case '&':
        return '&amp;'
      case "'":
        return '&apos;'
      case '"':
        return '&quot;'
      default:
        return c
    }
  })
}
