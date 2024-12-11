import { defineEventHandler } from 'h3'
import { readFile } from 'fs/promises'
import { resolve } from 'path'
import { startOfWeek } from 'date-fns'

/**
 * Interface representing a blog post in the content system
 */
interface BlogPost {
  slug: string
  title: string
  date: string
  description?: string
  dek?: string // Extended description, required for week notes
  hidden?: boolean // If true, post is hidden from all listings
  draft?: boolean // Draft status
  private?: boolean // If true, post is private
  shared?: boolean // For robot posts and drafts - if true, they appear in public feeds
  content?: string
}

// Site configuration
const siteURL = 'https://ejfox.com'
const siteName = 'EJ Fox'
const siteDescription =
  'Hacker-journalist using code and art to uncover hidden patterns.'

/**
 * Decodes HTML entities back to their original characters
 * More comprehensive version
 */
function decodeHtmlEntities(str: string): string {
  const entities = {
    '&#x26;': '&',
    '&#x27;': "'",
    '&#x22;': '"',
    '&#x3C;': '<',
    '&#x3E;': '>',
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&apos;': "'"
  }

  // First pass: decode numeric and named entities
  let decoded = str.replace(/&#x[0-9a-f]+;|&#[0-9]+;|&[a-z]+;/gi, (match) => {
    if (match in entities) {
      return entities[match as keyof typeof entities]
    }
    // For other numeric entities, use the browser's decoder
    try {
      return decodeURIComponent(match.replace(/&#x/g, '%'))
    } catch {
      return match
    }
  })

  // Second pass: handle any remaining basic entities
  decoded = decoded
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")

  return decoded
}

/**
 * Cleans content for XML while preserving CSS and shell syntax
 */
function cleanContentForXML(content: string): string {
  // First handle code blocks
  const safeContent = content
    // Replace code blocks with links when possible
    .replace(
      /<pre.*?><code.*?>([\s\S]*?)<\/code><\/pre>/g,
      (_match, codeContent) => {
        // Return a simple placeholder for code blocks
        return '[Code block removed - view on website]'
      }
    )
    // Replace inline code with simplified version
    .replace(/<code.*?>(.*?)<\/code>/g, '`$1`')

  // Now protect special characters and handle XML escaping
  const processed = safeContent
    // Remove invalid XML characters
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\uFFFE\uFFFF]/g, '')
    // Handle existing entities
    .replace(/&(?:amp|lt|gt|quot|apos|#\d+|#x[0-9a-f]+);/gi, (match) => {
      try {
        return decodeHtmlEntities(match)
      } catch {
        return match
      }
    })
    // Escape remaining special characters
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')

  return processed
}

/**
 * Handles RSS feed generation for the site
 * Includes all public posts, shared robot posts, and shared drafts
 * Week notes require a dek to be included
 */
export default defineEventHandler(async (event) => {
  try {
    // Load and parse the content manifest
    const manifestPath = resolve(
      process.cwd(),
      'content/processed/manifest-lite.json'
    )
    const manifest = JSON.parse(
      await readFile(manifestPath, 'utf-8')
    ) as BlogPost[]

    const filteredPosts = manifest
      // Basic visibility filters
      .filter((post: BlogPost) => !post.hidden)
      .filter((post: BlogPost) => !post.private)
      // Handle week notes - they need valid dates and deks
      .filter((post: BlogPost) => {
        if (!post.slug.startsWith('week-notes/')) return true

        const weekMatch = post.slug.match(/(\d{4})-(\d{2})/)
        if (!weekMatch) return false

        const [, yearStr, weekStr] = weekMatch
        const year = parseInt(yearStr, 10)
        const week = parseInt(weekStr, 10)
        const date = startOfWeek(new Date(year, 0, 1), { weekStartsOn: 1 })
        const actualDate = new Date(
          date.setDate(date.getDate() + (week - 1) * 7)
        )

        return Boolean(post.dek && actualDate)
      })
      // Handle visibility rules for different content types
      .filter((post: BlogPost) => {
        if (post.slug.startsWith('robots/') || post.draft) {
          return post.shared === true
        }
        return true
      })
      // Exclude project pages
      .filter((post: BlogPost) => !post.slug.startsWith('projects/'))
      // Sort by date, newest first
      .sort(
        (a: BlogPost, b: BlogPost) =>
          new Date(b.date).getTime() - new Date(a.date).getTime()
      )

    // Generate RSS XML
    const rss = await generateRSSXml(filteredPosts)

    // Set proper content type and return
    event.node.res.setHeader('Content-Type', 'application/xml')
    return rss
  } catch (error) {
    console.error(`Error generating RSS feed:`, error)
    event.node.res.statusCode = 500
    return generateErrorRSS()
  }
})

/**
 * Generates the RSS XML string from filtered posts
 */
async function generateRSSXml(filteredPosts: BlogPost[]): Promise<string> {
  const items = await Promise.all(
    filteredPosts.map(async (post: BlogPost) => {
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

        // Clean the content and wrap in CDATA
        const cleanContent = cleanContentForXML(htmlContent)
        const wrappedContent = `<![CDATA[${cleanContent}]]>`

        // Add a note about code blocks if they were removed
        const hasCodeBlocks = htmlContent.includes('</code>')
        const contentWithNote = hasCodeBlocks
          ? `${cleanContent}\n\n[Note: This post contains code examples. View the full post on the website for the best experience.]`
          : cleanContent

        // Clean and wrap description
        const description = (post.description || post.dek || '').trim()
        const cleanDescription = cleanContentForXML(description)
        const wrappedDescription = `<![CDATA[${cleanDescription}]]>`

        const item = `<item>
          <title>${escapeXml(post.title)}</title>
          <link>${siteURL}/blog/${post.slug}</link>
          <guid isPermaLink="true">${siteURL}/blog/${post.slug}</guid>
          <description>${wrappedDescription}</description>
          <pubDate>${new Date(post.date).toUTCString()}</pubDate>
          <content:encoded><![CDATA[${contentWithNote}]]></content:encoded>
        </item>`.trim()

        return item
      } catch (error) {
        console.error(`Error processing post ${post.slug}:`, error)
        return ''
      }
    })
  )

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>${escapeXml(siteName)}</title>
    <description>${escapeXml(siteDescription)}</description>
    <link>${siteURL}</link>
    <atom:link href="${siteURL}/rss.xml" rel="self" type="application/rss+xml" />
    <pubDate>${new Date().toUTCString()}</pubDate>
    ${items.join('\n    ')}
  </channel>
</rss>`.trim()
}

/**
 * Generates error RSS XML
 */
function generateErrorRSS(): string {
  return '<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>Error</title><description>Error generating RSS feed</description></channel></rss>'
}

/**
 * Escapes special characters for XML
 */
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
