/**
 * @file manifest.ts
 * @description Serves the processed blog post manifest containing all published posts and projects
 * @endpoint GET /api/manifest
 * @returns Array of post metadata from manifest-lite.json
 */
import { defineEventHandler, createError } from 'h3'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { isHiddenFromListings, isScheduled } from '~/utils/postFilters'

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
      return !isHiddenFromListings(p) && !isDraftsFolder && !isScheduled(p)
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
