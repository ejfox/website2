/**
 * @file manifest.ts
 * @description Serves the processed blog post manifest containing all published posts and projects
 * @endpoint GET /api/manifest
 * @returns Array of post metadata from manifest-lite.json
 */
import { defineEventHandler, createError } from 'h3'
import { readManifest, isListable } from '~/server/utils/manifest'

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

    // Filter out drafts, hidden, unlisted, password-protected, and scheduled
    // posts. These posts exist at their URLs but don't appear in listings.
    const publicPosts = manifest.filter((p: Post) => {
      const isDraftsFolder = p.slug?.startsWith('drafts/')
      return isListable(p) && !isDraftsFolder
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
