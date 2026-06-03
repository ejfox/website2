/**
 * @file projects.get.ts
 * @description Loads project posts from manifest and enriches with full content from processed JSON files
 * @endpoint GET /api/projects
 * @returns Array of project posts with slug, title, HTML content, and metadata, sorted by date descending
 */
import { defineEventHandler } from 'h3'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { existsSync } from 'node:fs'

interface ManifestPost {
  slug: string
  title?: string
  metadata?: Record<string, unknown>
  date?: string
  draft?: boolean
  hidden?: boolean
  unlisted?: boolean
  password?: string
  passwordHash?: string
}

export default defineEventHandler(async () => {
  try {
    // Read the manifest first
    const manifestPath = resolve(
      process.cwd(),
      'content/processed/manifest-lite.json'
    )
    const manifestContent = await readFile(manifestPath, 'utf8')
    const manifest = JSON.parse(manifestContent)

    // Filter for project posts, excluding drafts, hidden, unlisted, password-protected, and those starting with !
    const projectPosts = manifest.filter((post: ManifestPost) => {
      const metadata = post.metadata as Record<string, unknown>
      const isDraft = post.draft || metadata?.draft
      const isHidden = post.hidden || metadata?.hidden
      const isUnlisted = post.unlisted || metadata?.unlisted
      const hasPassword = !!(
        post.password ||
        post.passwordHash ||
        metadata?.password ||
        metadata?.passwordHash
      )
      // Show drafts on the local dev server so works-in-progress are
      // previewable; production still hides them.
      const allowDrafts = import.meta.dev
      return (
        post.slug?.startsWith('projects/') &&
        !post.slug.includes('/!') &&
        (allowDrafts || !isDraft) &&
        !isHidden &&
        !isUnlisted &&
        !hasPassword
      )
    })

    // Load content for each project
    const projectsWithContent = await Promise.all(
      projectPosts.map(async (post: ManifestPost) => {
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
              metadata: post.metadata || {},
            }
          }

          const content = await readFile(contentPath, 'utf8')
          const fullPost = JSON.parse(content)

          // Clean structure: metadata from processed file, html content, title
          return {
            slug: post.slug,
            title: fullPost.title || post.title,
            html: fullPost.html,
            metadata: fullPost.metadata,
          }
        } catch (err) {
          console.error(`Error loading project ${post.slug}:`, err)
          return {
            slug: post.slug,
            title: post.title || post.slug,
            html: '',
            metadata: post.metadata || {},
          }
        }
      })
    )

    // DEV ONLY: also surface draft projects (which the manifest omits) by
    // reading the processed JSON files directly, so works-in-progress are
    // previewable locally. Production never reaches this branch.
    if (import.meta.dev) {
      try {
        const { readdir } = await import('node:fs/promises')
        const projectsDir = resolve(process.cwd(), 'content/processed/projects')
        const seen = new Set(projectPosts.map((p: ManifestPost) => p.slug))
        const files = await readdir(projectsDir)
        for (const file of files) {
          if (!file.endsWith('.json')) continue
          const slug = `projects/${file.replace(/\.json$/, '')}`
          if (seen.has(slug) || file.startsWith('!')) continue
          const full = JSON.parse(
            await readFile(resolve(projectsDir, file), 'utf8')
          )
          projectsWithContent.push({
            slug,
            title: full.title,
            html: full.html,
            metadata: full.metadata,
          })
        }
      } catch (err) {
        console.error('dev draft-project preview failed:', err)
      }
    }

    // Sort by date descending
    const sorted = projectsWithContent.sort((a, b) => {
      const dateA = new Date(a.metadata?.date || a.date || 0)
      const dateB = new Date(b.metadata?.date || b.date || 0)
      return dateB.getTime() - dateA.getTime()
    })

    return sorted
  } catch (error) {
    console.error('Error in projects API:', error)
    return []
  }
})
