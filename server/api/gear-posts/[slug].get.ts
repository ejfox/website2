/**
 * @file gear-posts/[slug].get.ts
 * @description Returns blog posts tagged with a specific gear item slug
 * @endpoint GET /api/gear-posts/:slug
 * @returns Array of matching post summaries (slug, title, date, dek, tags) or empty array
 */
import { readManifest, isListable } from '~/server/utils/manifest'

interface ManifestPost {
  slug: string
  title?: string
  date?: string
  dek?: string
  tags?: string[]
  metadata?: {
    gear?: string | string[]
    [key: string]: unknown
  }
  [key: string]: unknown
}

interface GearPost {
  slug: string
  title?: string
  date?: string
  dek?: string
  tags?: string[]
}

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')
  if (!slug) {
    throw createError({ statusCode: 400, statusMessage: 'Slug is required' })
  }

  try {
    const posts = (await readManifest()) as ManifestPost[]

    const matching: GearPost[] = posts
      .filter((post) => {
        // Privacy filter (CLAUDE.md rule): the shared predicate covers
        // draft/hidden/unlisted/password/sealed (both levels) + embargo.
        const isDraftsFolder =
          typeof post.slug === 'string' && post.slug.startsWith('drafts/')
        if (!isListable(post) || isDraftsFolder) return false

        const gear = post.metadata?.gear
        if (!gear) return false
        if (Array.isArray(gear)) {
          return gear.includes(slug)
        }
        return gear === slug
      })
      .map((post) => ({
        slug: post.slug,
        title: post.title,
        date: post.date,
        dek: post.dek,
        tags: post.tags,
      }))

    return matching
  } catch (error: unknown) {
    // If the manifest doesn't exist yet, return empty array rather than 500
    if (
      error &&
      typeof error === 'object' &&
      'code' in error &&
      (error as NodeJS.ErrnoException).code === 'ENOENT'
    ) {
      return []
    }
    console.error('Error reading manifest for gear-posts:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to load post manifest',
    })
  }
})
