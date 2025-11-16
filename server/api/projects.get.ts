import { defineEventHandler } from 'h3'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { existsSync } from 'node:fs'

export default defineEventHandler(async () => {
  try {
    // Read the manifest first
    const manifestPath = resolve(
      process.cwd(),
      'content/processed/manifest-lite.json'
    )
    const manifestContent = await readFile(manifestPath, 'utf8')
    const manifest = JSON.parse(manifestContent)

    // Filter for project posts, excluding those starting with !
    const projectPosts = manifest.filter((post: any) => {
      return post.slug?.startsWith('projects/') && !post.slug.includes('/!')
    })

    // Load content for each project
    const projectsWithContent = await Promise.all(
      projectPosts.map(async (post: any) => {
        try {
          const contentPath = resolve(
            process.cwd(),
            'content/processed',
            `${post.slug}.json`
          )

          if (!existsSync(contentPath)) {
            // Return post without content if file doesn't exist
            return {
              slug: post.slug,
              title: post.title || post.slug,
              html: '',
              metadata: post.metadata || {}
            }
          }

          const content = await readFile(contentPath, 'utf8')
          const fullPost = JSON.parse(content)

          // Clean structure: metadata from processed file, html content, title
          return {
            slug: post.slug,
            title: fullPost.title || post.title,
            html: fullPost.html,
            metadata: fullPost.metadata
          }
        } catch (err) {
          console.error(`Error loading project ${post.slug}:`, err)
          return {
            slug: post.slug,
            title: post.title || post.slug,
            html: '',
            metadata: post.metadata || {}
          }
        }
      })
    )

    // Sort by date descending
    const sorted = projectsWithContent.sort((a, b) => {
      const dateA = new Date(a.metadata?.date || a.date || 0)
      const dateB = new Date(b.metadata?.date || b.date || 0)
      return dateB.getTime() - dateA.getTime()
    })

    return sorted
  } catch (error: any) {
    console.error('Error in projects API:', error)
    return []
  }
})
