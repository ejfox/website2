import { defineEventHandler } from 'h3'
import { readFile } from 'fs/promises'
import { resolve } from 'path'
import { existsSync } from 'fs'

interface ProjectPost {
  slug: string
  title?: string
  date?: string
  html?: string
  metadata?: any
}

export default defineEventHandler(async () => {
  try {
    // Read the manifest first
    const manifestPath = resolve(process.cwd(), 'content/processed/manifest-lite.json')
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
              ...post,
              html: '',
              title: post.metadata?.title || post.title || post.slug
            }
          }
          
          const content = await readFile(contentPath, 'utf8')
          const fullPost = JSON.parse(content)
          
          return {
            ...post,
            ...fullPost,
            slug: post.slug,
            title: fullPost.metadata?.title || fullPost.title || post.metadata?.title || post.title
          }
        } catch (err) {
          console.error(`Error loading project ${post.slug}:`, err)
          return {
            ...post,
            html: '',
            title: post.metadata?.title || post.title || post.slug
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