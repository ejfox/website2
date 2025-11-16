/**
 * Content Processing Pipeline
 * =========================
 *
 * Stage 1: Import (import.mjs) - Reads markdown files from Obsidian vault
 * Stage 2: Process (processMarkdown.mjs) - Converts markdown to HTML
 * Stage 3: Runtime (useProcessedMarkdown.ts) - Final filtering and processing
 *
 * Content Type Detection Rules:
 * - Week Notes: type='weekNote' OR slug starts with 'week-notes/' OR slug matches YYYY-WW
 * - Special Sections: reading/, projects/, robots/, drafts/, study-notes/, prompts/
 * - System Files: slug='index' OR starts with '!' or '_'
 *
 * Visibility Rules:
 * - hidden: true -> Post is hidden everywhere
 * - In drafts/robots/ -> hidden by default unless share: true
 * - Week notes -> never auto-hidden, respect hidden: true from frontmatter
 */

import {
  parseISO as _parseISO,
  isValid as _isValid,
  parse as _parse,
  startOfWeek as _startOfWeek,
  format as _format
} from 'date-fns'

// Type definitions
interface PostMetadata {
  slug: string
  title: string
  date: string
  type?: string
  hidden?: boolean
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

// Utility functions
const _debug = (_msg: string, _data?: any) => {
  const config = useRuntimeConfig()
  if (config.public.debugContent) {
    // Debug logging disabled
  }
}

function compareDates(a: string, b: string): number {
  return new Date(b).getTime() - new Date(a).getTime()
}

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
  return baseName
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

// Core filtering functions
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
    basePath.startsWith('prompts/') ||
    basePath.startsWith('week-notes/')
  )
}

function isSystemFile(slug: string): boolean {
  return (
    !slug || slug === 'index' || slug.startsWith('!') || slug.startsWith('_')
  )
}

function isHidden(post: Post): boolean {
  return (
    post?.hidden === true ||
    post?.metadata?.hidden === true ||
    post?.draft === true ||
    post?.metadata?.draft === true
  )
}

function isRegularBlogPost(post: Post): boolean {
  const slug = post?.metadata?.slug || post?.slug
  return !isSystemFile(slug) && !isSpecialSection(slug) && !isHidden(post)
}

// Enhanced filtering function that accepts custom filters
function filterAndSortPosts(
  manifest: Post[],
  filters: {
    slugPrefix?: string
    type?: string
    requireShare?: boolean
    excludeHidden?: boolean
    customFilter?: (post: Post) => boolean
  } = {}
): Post[] {
  return manifest
    .filter((post: Post) => {
      // Apply slug prefix filter
      if (filters.slugPrefix && !post.slug.startsWith(filters.slugPrefix)) {
        return false
      }

      // Apply type filter
      if (filters.type) {
        const postType = post.type || post.metadata?.type
        if (postType !== filters.type) return false
      }

      // Apply share requirement filter
      if (filters.requireShare) {
        const isShared = post.metadata?.share || post.share
        if (!isShared) return false
      }

      // Apply hidden filter
      if (filters.excludeHidden && isHidden(post)) {
        return false
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
      title: post.metadata?.title || post.title || formatTitle(post.slug)
    }))
    .sort((a: Post, b: Post) => compareDates(a.date, b.date))
}

export const useProcessedMarkdown = () => {
  const _config = useRuntimeConfig()

  const getManifestLite = async (): Promise<ManifestItem[]> => {
    try {
      return await $fetch('/api/manifest')
    } catch (error) {
      console.error('Error loading manifest:', error)
      throw error
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
        type: result.type || result.metadata?.type
      }
    } catch (error) {
      console.error(`Error fetching post "${slug}":`, error)
      throw error
    }
  }

  const getAllPosts = async (
    includeDrafts = false,
    includeWeekNotes = false
  ): Promise<Post[]> => {
    try {
      const manifest = await getManifestLite()

      return manifest
        .filter((post: Post) => {
          if (isSystemFile(post.slug)) return false
          if (!includeDrafts && isHidden(post)) return false
          if (isSpecialSection(post.slug)) {
            // Handle week notes special case
            if (post.slug.includes('week-notes/')) return includeWeekNotes
            return false
          }
          return true
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
              date: getValidDate(post.metadata?.date || post.date)
            },
            date: getValidDate(post.metadata?.date || post.date),
            modified: getValidDate(post.metadata?.modified || post.modified),
            type: post.type || post.metadata?.type,
            dek: post.dek || post.metadata?.dek,
            tags: post.tags || post.metadata?.tags
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
    includeDrafts = false,
    includeWeekNotes = false
  ): Promise<Post[]> => {
    const allPosts = await getAllPosts(includeDrafts, includeWeekNotes)
    return allPosts.filter((post) => new Date(post.date).getFullYear() === year)
  }

  const getPostsWithContent = async (
    limit = 10,
    offset = 0,
    includeDrafts = false,
    includeWeekNotes = false
  ): Promise<Post[]> => {
    try {
      const allPosts = await getAllPosts(includeDrafts, includeWeekNotes)
      const postsToFetch = allPosts.slice(offset, offset + limit)
      return await Promise.all(
        postsToFetch.map(async (post) => {
          const fullPost = await getPostBySlug(post.slug)
          return { ...post, ...fullPost }
        })
      )
    } catch (error) {
      console.error('Error fetching posts with content:', error)
      throw error
    }
  }

  const getNextPrevPosts = async (currentSlug: string) => {
    const manifest = await getManifestLite()
    const filteredPosts = manifest
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
          : null
    }
  }

  // Specialized content type getters using the unified filter function
  const getDrafts = async (): Promise<Post[]> => {
    const manifest = await getManifestLite()
    return filterAndSortPosts(manifest, { type: 'draft', requireShare: true })
  }

  const getWeekNotes = async (): Promise<Post[]> => {
    const manifest = await getManifestLite()
    return filterAndSortPosts(manifest, {
      excludeHidden: true,
      customFilter: (post) =>
        post.type === 'weekNote' || post.slug.startsWith('week-notes/')
    })
  }

  const getReadingPosts = async (): Promise<Post[]> => {
    const manifest = await getManifestLite()
    return filterAndSortPosts(manifest, { slugPrefix: 'reading/' })
  }

  const getProjectPostsLite = async (): Promise<Post[]> => {
    const manifest = await getManifestLite()
    return filterAndSortPosts(manifest, { slugPrefix: 'projects/' }).map(
      (post: Post) => ({
        ...post,
        html: post.html || post.metadata?.html || ''
      })
    )
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
            error: err
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
          post.slug.startsWith('robots/') || post.type === 'robot'
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
    return Promise.all(
      robotPosts.map(async (post: Post) => {
        const fullPost = await getPostBySlug(post.slug)
        return { ...post, ...fullPost }
      })
    )
  }

  return {
    getPostBySlug,
    getAllPosts,
    getPostsByYear,
    getPostsWithContent,
    getDrafts,
    getWeekNotes,
    getReadingPosts,
    getNextPrevPosts,
    getProjectPosts,
    getProjectPostsLite,
    getRobotNotes,
    getRobotNotesWithContent,
    getStudyNotes,
    getPrompts
  }
}
