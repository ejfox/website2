import RSS from 'rss'
import { marked } from 'marked'
import sanitizeHtml from 'sanitize-html'
import { useProcessedMarkdown } from '~/composables/useProcessedMarkdown'

export default defineEventHandler(async (event) => {
  const { getAllPosts } = useProcessedMarkdown()

  // Initialize RSS feed
  const feed = new RSS({
    title: 'EJ Fox',
    description:
      'Hacker-journalist using code and art to uncover hidden patterns.',
    feed_url: 'https://ejfox.com/rss.xml',
    site_url: 'https://ejfox.com',
    image_url: 'https://ejfox.com/icon.png',
    language: 'en',
    pubDate: new Date().toUTCString()
  })

  // Get all published posts
  const posts = await getAllPosts(false, false)

  // Add items to feed
  for (const post of posts) {
    const parsedContent = await marked.parse(post.content || '')
    const html = sanitizeHtml(parsedContent, {
      allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img']),
      allowedAttributes: {
        ...sanitizeHtml.defaults.allowedAttributes,
        img: ['src', 'alt', 'title']
      }
    })

    feed.item({
      title: post.title || '',
      description: post.description || '',
      url: `https://ejfox.com/blog/${post.slug}`,
      guid: `https://ejfox.com/blog/${post.slug}`,
      categories: post.tags || [],
      author: post.author || 'EJ Fox',
      date: post.date ? new Date(post.date) : new Date(),
      content: html
    })
  }

  // Set response headers
  event.node.res.setHeader('content-type', 'application/xml')
  event.node.res.setHeader('cache-control', 'max-age=1800, s-maxage=3600')

  return feed.xml({ indent: true })
})
