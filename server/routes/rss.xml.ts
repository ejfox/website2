import { defineEventHandler } from 'h3'
import { readFile } from 'fs/promises'
import { resolve } from 'path'
import { startOfWeek } from 'date-fns'

const siteURL = 'https://ejfox.com'
const siteName = 'EJ Fox'
const siteDescription = 'Hacker-journalist using code and art to uncover hidden patterns.'

export default defineEventHandler(async (event) => {
  try {
    const manifestPath = resolve(process.cwd(), 'content/processed/manifest-lite.json')
    const manifest = JSON.parse(await readFile(manifestPath, 'utf-8'))

    const filteredPosts = manifest
      .filter((post: { hidden?: boolean; slug: string; dek?: string; draft?: boolean }) => !post.hidden) // Filter out hidden posts
      .filter((post: { slug: string; dek?: string }) => {
        // Filter out week notes without deks
        if (post.slug.startsWith('week-notes/')) {
          const weekMatch = post.slug.match(/(\d{4})-(\d{2})/)
          if (weekMatch) {
            const year = parseInt(weekMatch[1], 10)
            const week = parseInt(weekMatch[2], 10)
            const date = startOfWeek(new Date(year, 0, 1), { weekStartsOn: 1 })
            const actualDate = new Date(date.setDate(date.getDate() + (week - 1) * 7))
            return post.dek && actualDate
          }
          return false
        }
        return true
      })
      .filter((note: { hidden?: boolean }) => !note.hidden)
      // filter out any drafts  
      .filter((note: { draft?: boolean }) => !note.draft)
      // make sure not in the /projects folder
      .filter((note: { slug: string }) => !note.slug.startsWith('projects/'))
      // Add protection for robot notes
      .filter((note: { slug: string }) => !note.slug.startsWith('robots/'))
      .sort((a: { date: string }, b: { date: string }) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 20)

    const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/">
<channel>
  <title>${siteName}</title>
  <description>${siteDescription}</description>
  <link>${siteURL}</link>
  <atom:link href="${siteURL}/rss.xml" rel="self" type="application/rss+xml" />
  <pubDate>${new Date().toUTCString()}</pubDate>
  ${await Promise.all(filteredPosts.map(async (post) => {
    try {
      const postPath = resolve(process.cwd(), 'content', 'processed', `${post.slug}.json`)
      const { content: htmlContent } = JSON.parse(await readFile(postPath, 'utf-8'))
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
  }))}
</channel>
</rss>`

    event.node.res.setHeader('Content-Type', 'application/xml')
    return rss
  } catch (error) {
    console.error(`Error generating RSS feed:`, error)
    event.node.res.statusCode = 500
    return '<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>Error</title><description>Error generating RSS feed</description></channel></rss>'
  }
})

function escapeXml(unsafe: string): string {
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<': return '&lt;'
      case '>': return '&gt;'
      case '&': return '&amp;'
      case "'": return '&apos;'
      case '"': return '&quot;'
      default: return c
    }
  })
}
