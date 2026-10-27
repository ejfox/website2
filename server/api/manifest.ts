/**
 * @file manifest.ts
 * @description GET /api/manifest. Listable posts and projects from
 *   content/processed/manifest-lite.json (readManifest() in
 *   server/utils/manifest.ts). isListable() drops draft, hidden, unlisted,
 *   password-protected and scheduled posts; anything under drafts/ is dropped too.
 *   Those posts may still resolve at their own URL, they just aren't listed.
 *   No cache. Throws 500 if the manifest can't be read.
 *   Must stay filtered: feeds, tags and many pages build off this list.
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
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to read manifest',
    })
  }
})
