/**
 * @file useProcessedMarkdown.ts
 * @description Runtime read side of the content pipeline: fetches
 *   /api/manifest and /api/posts/<slug> (or /api/robots/<slug>) and returns
 *   filtered, date-sorted post lists. Markdown → JSON happens earlier, in
 *   scripts/build/processMarkdown.mjs; posts reach the repo via Dispatch.
 *   Used by pages (index, blog, stats, tags, robots) AND by server routes
 *   (rss.xml, feed.json, archive.epub), so it must stay SSR/Nitro-safe.
 *
 * Content type rules:
 * - Special sections (kept out of getAllPosts): reading/, projects/, robots/,
 *   drafts/, study-notes/, prompts/ — with or without a blog/ or YYYY/ prefix
 * - System files: slug 'index' OR starts with '!' or '_'
 * - Week notes are retired and never processed (410 via
 *   server/middleware/week-notes-gone.ts)
 *
 * Visibility: only public posts (isListed, utils/visibility.mjs) reach a
 * listing or feed, unless a caller passes includeDrafts. Robot notes are
 * listed only when `share: true`.
 */

import {
  parseISO as _parseISO,
  isValid as _isValid,
  parse as _parse,
  startOfWeek as _startOfWeek,
  format as _format,
} from 'date-fns'
import { isListed } from '~/utils/visibility.mjs'

// ── Types ───────────────────────────────────────────────────
interface PostMetadata {
  slug: string
  title: string
  date: string
  type?: string
  draft?: boolean
  share?: boolean
  dek?: string
  modified?: string
  description?: string
  tags?: string[]
  firstHeading?: string
}

interface ProcessedHTML {
  content: string
  html: string
  classes?: string[]
}

interface Post extends PostMetadata {
  metadata?: PostMetadata
  content?: string
  html?: string
  processedContent?: ProcessedHTML
}

interface ManifestItem extends Post {
  _isManifestItem?: true
}

// ── Helpers ─────────────────────────────────────────────────
// Newest first.
function compareDates(a: string, b: string): number {
  return new Date(b).getTime() - new Date(a).getTime()
}

// Gotcha: an unparseable or missing date becomes "now", so a bad post date
// sorts to the top rather than throwing.
function getValidDate(date: string | Date | undefined): string {
  try {
    if (!date) return new Date().toISOString()
    if (date instanceof Date) return date.toISOString()
    const parsed = new Date(date)
    return !Number.isNaN(parsed.getTime())
      ? parsed.toISOString()
      : new Date().toISOString()
  } catch {
    return new Date().toISOString()
  }
}

function formatTitle(filename: string): string {
  const baseName = filename.split('/').pop() || filename

  // Detect date-based filenames (YYYY-MM-DD or YYYY-MM-DD-suffix)
  // Keep dashes for these - they're intentional
  const datePattern = /^(\d{4}-\d{2}-\d{2})(-.*)?$/
  const dateMatch = baseName.match(datePattern)
  if (dateMatch) {
    const datePart = dateMatch[1] // e.g., "2026-01-25"
    const suffix = dateMatch[2] // e.g., "-my-thoughts" or undefined
    if (suffix) {
      const suffixTitle = suffix
        .slice(1) // remove leading dash
        .split('-')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')
      return `${datePart} ${suffixTitle}`
    }
    return datePart
  }

  // Standard title case for non-date filenames
  return baseName
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

// ── Visibility + section rules ──────────────────────────────
function isSpecialSection(slug: string): boolean {
  const pathParts = slug.split('/')
  // Handle both old format (YYYY/...) and new format (blog/YYYY/...)
  let basePath = slug

  // If starts with 'blog/', strip it
  if (pathParts[0] === 'blog') {
    basePath = pathParts.slice(1).join('/')
  }

  // If starts with year, get the rest
  const remainingParts = basePath.split('/')
  if (remainingParts.length > 1 && /^\d{4}$/.test(remainingParts[0])) {
    basePath = remainingParts.slice(1).join('/')
  }

  return (
    basePath.startsWith('reading/') ||
    basePath.startsWith('projects/') ||
    basePath.startsWith('robots/') ||
    basePath.startsWith('drafts/') ||
    basePath.startsWith('study-notes/') ||
    basePath.startsWith('prompts/')
  )
}

function isSystemFile(slug: string): boolean {
  return (
    !slug || slug === 'index' || slug.startsWith('!') || slug.startsWith('_')
  )
}

function isRegularBlogPost(post: Post): boolean {
  const slug = post?.metadata?.slug || post?.slug
  return !isSystemFile(slug) && !isSpecialSection(slug) && isListed(post)
}

// Enhanced filtering function that accepts custom filters
function filterAndSortPosts(
  manifest: Post[],
  filters: {
    slugPrefix?: string
    requireShare?: boolean
    customFilter?: (post: Post) => boolean
  } = {}
): Post[] {
  return manifest
    .filter((post: Post) => {
      // Apply slug prefix filter
      if (filters.slugPrefix && !post.slug.startsWith(filters.slugPrefix)) {
        return false
      }

      // Apply share requirement filter
      if (filters.requireShare) {
        const isShared = post.metadata?.share || post.share
        if (!isShared) return false
      }

      // Apply custom filter
      if (filters.customFilter && !filters.customFilter(post)) {
        return false
      }

      return true
    })
    .map((post: Post) => ({
      ...post,
      date: getValidDate(post.metadata?.date || post.date),
      modified: getValidDate(post.metadata?.modified || post.modified),
      title: post.metadata?.title || post.title || formatTitle(post.slug),
    }))
    .sort((a: Post, b: Post) => compareDates(a.date, b.date))
}

// ── Public API ──────────────────────────────────────────────
export const useProcessedMarkdown = () => {
  const getManifestLite = async (): Promise<ManifestItem[]> => {
    try {
      // Cast the URL to string to bypass Nitro's typed-route inference, which
      // recurses too deeply here and triggers TS2321 (excessive stack depth).
      return await $fetch<ManifestItem[]>('/api/manifest' as string)
    } catch (error) {
      console.error('Error loading manifest:', error)
      return []
    }
  }

  const getPostBySlug = async (slug: string): Promise<Post> => {
    try {
      let apiEndpoint = '/api/posts'
      let apiSlug = slug

      if (slug.startsWith('robots/')) {
        apiEndpoint = '/api/robots'
        apiSlug = slug.replace('robots/', '')
      }

      const result = await $fetch<Post>(
        apiSlug === 'index'
          ? `${apiEndpoint}/index`
          : `${apiEndpoint}/${apiSlug}`
      )

      return {
        slug: result.metadata?.slug || slug,
        date: getValidDate(result.metadata?.date || result.date),
        title: result.metadata?.title || result.title || formatTitle(slug),
        content: result.content,
        html: result.html,
        metadata: result.metadata,
        share: result.share,
        type: result.type || result.metadata?.type,
      }
    } catch (error) {
      console.error(`Error fetching post "${slug}":`, error)
      throw error
    }
  }

  const getAllPosts = async (includeDrafts = false): Promise<Post[]> => {
    try {
      const manifest = await getManifestLite()

      return manifest
        .filter((post: Post) => {
          if (isSystemFile(post.slug)) return false
          if (!includeDrafts && !isListed(post)) return false
          return !isSpecialSection(post.slug)
        })
        .map((post) => {
          let title = post.title || post?.metadata?.title || ''
          if (!title && post?.metadata?.dek) {
            title = post.metadata.dek.split('\n')[0]
          }
          if (!title) {
            title = formatTitle(post.slug)
          }

          return {
            ...post,
            title,
            metadata: {
              ...post.metadata,
              title,
              slug: post.slug,
              date: getValidDate(post.metadata?.date || post.date),
            },
            date: getValidDate(post.metadata?.date || post.date),
            modified: getValidDate(post.metadata?.modified || post.modified),
            type: post.type || post.metadata?.type,
            dek: post.dek || post.metadata?.dek,
            tags: post.tags || post.metadata?.tags,
          } as Post
        })
        .sort((a, b) => compareDates(a.date, b.date))
    } catch (error) {
      console.error('Error fetching posts:', error)
      throw error
    }
  }

  const getPostsByYear = async (
    year: number,
    includeDrafts = false
  ): Promise<Post[]> => {
    const allPosts = await getAllPosts(includeDrafts)
    return allPosts.filter((post) => new Date(post.date).getFullYear() === year)
  }

  const getPostsWithContent = async (
    limit = 10,
    offset = 0,
    includeDrafts = false
  ): Promise<Post[]> => {
    try {
      const allPosts = await getAllPosts(includeDrafts)
      const postsToFetch = allPosts.slice(offset, offset + limit)
      return await Promise.all(
        postsToFetch.map(async (post) => {
          try {
            const fullPost = await getPostBySlug(post.slug)
            return { ...post, ...fullPost }
          } catch (error) {
            console.error(
              `Error fetching content for post ${post.slug}:`,
              error
            )
            return post
          }
        })
      )
    } catch (error) {
      console.error('Error fetching posts with content:', error)
      return []
    }
  }

  // Specialized content type getters using the unified filter function
  const getReadingPosts = async (): Promise<Post[]> => {
    const manifest = await getManifestLite()
    return filterAndSortPosts(manifest, { slugPrefix: 'reading/' })
  }

  const getProjectPostsLite = async (): Promise<Post[]> => {
    const manifest = await getManifestLite()
    return filterAndSortPosts(manifest, { slugPrefix: 'projects/' }).map(
      (post: Post) => ({
        ...post,
        html: post.html || (post.metadata as any)?.html || '',
      })
    )
  }

  const getNextPrevPosts = async (currentSlug: string) => {
    const manifest = await getManifestLite()
    const filteredPosts = manifest
      // isListed inside, so an embargoed post never becomes a "Next →" link.
      .filter(isRegularBlogPost)
      .sort((a: Post, b: Post) => compareDates(b.date, a.date))

    if (filteredPosts.length === 0) {
      console.warn('No regular blog posts found')
      return { next: null, prev: null }
    }

    const currentIndex = filteredPosts.findIndex(
      (post) => post.slug === currentSlug
    )
    if (currentIndex === -1) {
      console.warn(
        `Post with slug "${currentSlug}" not found in regular blog posts`
      )
      return { next: null, prev: null }
    }

    return {
      next: currentIndex > 0 ? filteredPosts[currentIndex - 1] : null,
      prev:
        currentIndex < filteredPosts.length - 1
          ? filteredPosts[currentIndex + 1]
          : null,
    }
  }
  const getProjectPosts = async (): Promise<Post[]> => {
    const projectsLite = await getProjectPostsLite()
    const projectsWithContent = await Promise.all(
      projectsLite.map(async (post: Post) => {
        try {
          const fullPost = await getPostBySlug(post.slug)
          return { ...post, ...fullPost, slug: post.slug }
        } catch (err) {
          console.error('Error fetching project content:', {
            slug: post.slug,
            error: err,
          })
          return post
        }
      })
    )
    return projectsWithContent.filter((post) => post.content || post.html)
  }

  const getRobotNotes = async (): Promise<Post[]> => {
    try {
      const manifest = await getManifestLite()
      return filterAndSortPosts(manifest, {
        requireShare: true,
        customFilter: (post) =>
          post.slug.startsWith('robots/') || post.type === 'robot',
      }).map((post) => ({ ...post, type: 'robot' }))
    } catch (error) {
      console.error('Error fetching robot notes:', error)
      return []
    }
  }

  const getStudyNotes = async (): Promise<Post[]> => {
    const manifest = await getManifestLite()
    return filterAndSortPosts(manifest, { slugPrefix: 'study-notes/' })
  }

  const getPrompts = async (): Promise<Post[]> => {
    const manifest = await getManifestLite()
    return filterAndSortPosts(manifest, { slugPrefix: 'prompts/' })
  }

  const getRobotNotesWithContent = async (): Promise<Post[]> => {
    const robotPosts = await getRobotNotes()
    if (!robotPosts || robotPosts.length === 0) {
      return []
    }
    // Use individual try/catch to handle partial failures gracefully
    return Promise.all(
      robotPosts.map(async (post: Post) => {
        try {
          const fullPost = await getPostBySlug(post.slug)
          return { ...post, ...fullPost }
        } catch (err) {
          console.error('Error fetching robot note content:', {
            slug: post.slug,
            error: err,
          })
          // Return post without full content on error
          return post
        }
      })
    )
  }

  return {
    getPostBySlug,
    getAllPosts,
    getPostsByYear,
    getPostsWithContent,
    getReadingPosts,
    getNextPrevPosts,
    getProjectPosts,
    getProjectPostsLite,
    getRobotNotes,
    getRobotNotesWithContent,
    getStudyNotes,
    getPrompts,
  }
}
