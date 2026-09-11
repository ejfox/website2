/**
 * @file manifest.ts
 * @description Serves the processed blog post manifest containing all published posts and projects
 * @endpoint GET /api/manifest
 * @returns Array of post metadata from manifest-lite.json
 */
import { defineEventHandler, createError } from 'h3'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { isScheduled } from '~/utils/postFilters'

interface Post {
  slug?: string
  type?: string
  title?: string
  hidden?: boolean
  draft?: boolean
  unlisted?: boolean
  password?: string
  passwordHash?: string
  metadata?: {
    type?: string
    slug?: string
    hidden?: boolean
    draft?: boolean
    unlisted?: boolean
    password?: string
    passwordHash?: string
  }
}

export default defineEventHandler(async () => {
  try {
    const manifest = await readManifest()

    // Filter out drafts, hidden, unlisted, and password-protected posts
    // These posts exist at their URLs but don't appear in listings
    const publicPosts = manifest.filter((p: Post) => {
      const isDraft = p.draft || p.metadata?.draft
      const isHidden = p.hidden || p.metadata?.hidden
      const isUnlisted = p.unlisted || p.metadata?.unlisted
      const hasPassword = !!(
        p.password ||
        p.passwordHash ||
        p.metadata?.password ||
        p.metadata?.passwordHash
      )
      const isDraftsFolder = p.slug?.startsWith('drafts/')
      // Scheduled posts ship in the build but stay out of listings until their
      // publish time. This is a runtime check, so they appear on their own.
      const isEmbargoed = isScheduled(p)

      return (
        !isDraft &&
        !isHidden &&
        !isUnlisted &&
        !hasPassword &&
        !isDraftsFolder &&
        !isEmbargoed
      )
    })

    return publicPosts
  } catch (error) {
    console.error('Error in manifest endpoint:', error)
    const err = error as Error
    throw createError({
      statusCode: 500,
      message: `Failed to read manifest: ${err.message}`,
    })
  }
})

async function readManifest() {
  const manifestPath = resolve(
    process.cwd(),
    'content/processed/manifest-lite.json'
  )
  try {
    const content = await readFile(manifestPath, 'utf8')
    return JSON.parse(content)
  } catch (error) {
    console.error('Error reading manifest file:', error)
    throw error
  }
}
