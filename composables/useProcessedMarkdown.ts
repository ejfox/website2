/**
 * Content Processing Pipeline
 * =========================
 *
 * Stage 1: Import (import.mjs)
 * ---------------------------
 * - Reads markdown files from Obsidian vault
 * - Initial filtering:
 *   - Skips drafts without share: true
 *   - Skips files in sensitive directories (robots/, drafts/) without share: true
 *   - Sets hidden: true for drafts (unless it's a week note)
 *   - Preserves frontmatter properties (hidden, share, etc.)
 * - Processes dates:
 *   - Auto-corrects week note dates based on filename (YYYY-WW)
 * - Generates word count and other metadata
 *
 * Stage 2: Process (processMarkdown.mjs)
 * ------------------------------------
 * - Converts markdown to HTML
 * - Processes frontmatter
 * - Generates manifest-lite.json with:
 *   - Slug
 *   - Title
 *   - Date
 *   - Hidden status
 *   - Share status
 *   - Other metadata
 *
 * Stage 3: Runtime (useProcessedMarkdown.ts)
 * ----------------------------------------
 * This composable handles the final stage of content filtering and processing:
 *
 * getAllPosts():
 * - Filters out:
 *   - Index files (slug === 'index' or starts with '!')
 *   - Hidden posts (hidden === true)
 *   - Special sections (reading/, projects/, etc.)
 *   - Week notes (unless includeWeekNotes is true)
 *   - Non-shared drafts (unless includeDrafts is true)
 *
 * getWeekNotes():
 * - Only includes posts from week-notes/
 *   - Hidden posts (hidden === true)
 *   - Posts without deks
 *
 * Visibility Rules:
 * ---------------
 * - hidden: true -> Post is hidden everywhere
 * - In drafts/ -> hidden by default unless share: true
 * - In robots/ -> hidden by default unless share: true
 * - Week notes -> never auto-hidden, respect hidden: true from frontmatter
 * - Other posts -> respect hidden: true from frontmatter
 */

/**
 * Content Type Detection Rules
 * ==========================
 *
 * Week Notes
 * ----------
 * A post is considered a week note if ANY of these conditions are met:
 * 1. Type is 'weekNote'
 * 2. Slug starts with 'week-notes/'
 * 3. Slug matches YYYY-WW pattern (e.g. "2024-45")
 *
 * Special Sections
 * ---------------
 * These sections are filtered out of main blog posts:
 * - reading/
 * - projects/
 * - robots/
 * - drafts/
 * - study-notes/
 *
 * System Files
 * -----------
 * These are always excluded:
 * - index files (slug === 'index')
 * - System files (slug starts with '!' or '_')
 *
 * Visibility Rules
 * --------------
 * - hidden: true -> Post is hidden everywhere
 * - In drafts/ -> hidden by default unless share: true
 * - In robots/ -> hidden by default unless share: true
 * - Week notes -> never auto-hidden, respect hidden: true from frontmatter
 * - Other posts -> respect hidden: true from frontmatter
 */

/**
 * A composable to process and retrieve markdown content, specifically blog posts and their metadata.
 * This includes fetching individual posts, filtering posts by year, managing drafts, and more.
 * The component interacts with a backend API and handles common tasks such as sorting and formatting dates.
 *
 * @returns {Object} An object with various methods to retrieve blog posts and their metadata.
 */

import { parseISO as _parseISO, isValid as _isValid, parse as _parse, startOfWeek as _startOfWeek, format as _format } from 'date-fns'

// Add debug helper
const debug = (_msg: string, _data?: any) => {
  if (process.env.DEBUG_CONTENT === 'true') {
    // console.log(`[content] ${msg}`, data || '')
  }
}

/**
 * Helper function to compare two date strings
 */
function compareDates(a: string, b: string): number {
  const dateA = new Date(a)
  const dateB = new Date(b)
  return dateB.getTime() - dateA.getTime()
}

/**
 * Ensures a valid date string is returned
 */
function getValidDate(date: string | Date | undefined): string {
  try {
    // If no date, return current date
    if (!date) return new Date().toISOString()

    // If it's already a Date object
    if (date instanceof Date) return date.toISOString()

    // If it's a string (which it usually is from metadata)
    const parsed = new Date(date)
    if (!isNaN(parsed.getTime())) {
      return parsed.toISOString()
    }

    // If parsing failed, return current date
    return new Date().toISOString()
  } catch (_error) {
    return new Date().toISOString()
  }
}

// Add type definitions at the top of the file
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

// Add type for HTML content
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

// Add at the top with other helper functions
function formatTitle(filename: string): string {
  // Remove year prefix if present (e.g. "2024/my-post" -> "my-post")
  const baseName = filename.split('/').pop() || filename

  // Convert kebab-case to Title Case
  return baseName
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

export const useProcessedMarkdown = () => {
  // Access the runtime configuration for the application
  const _config = useRuntimeConfig()

  /**
   * Fetches the "manifest-lite" JSON, which contains a lightweight list of posts and metadata.
   * This manifest is used to quickly retrieve post slugs, dates, and other metadata.
   *
   * @returns {Promise<Object[]>} The list of posts from the manifest.
   */
  const getManifestLite = async (): Promise<ManifestItem[]> => {
    try {
      const response = await $fetch('/api/manifest')
      // console.log('Manifest loaded:', {
      //   total: response?.length,
      //   firstPost: response?.[0],
      //   types: response?.map((p: ManifestItem) => p.type).slice(0, 5)
      // })
      return response
    } catch (error) {
      console.error('Error loading manifest:', error)
      throw error
    }
  }

  /**
   * Fetches a single post by its slug.
   * @param {string} slug - The slug of the post to fetch.
   * @returns {Promise<Object>} The post object, including title, date, and content.
   */
  const getPostBySlug = async (slug: string): Promise<Post> => {
    try {
      // Determine the correct API endpoint based on the slug
      let apiEndpoint = '/api/posts'
      let apiSlug = slug

      // Debug the incoming slug
      // console.log('getPostBySlug called with:', { slug })

      if (slug.startsWith('robots/')) {
        apiEndpoint = '/api/robots'
        // Remove the robots/ prefix since the API route already includes it
        apiSlug = slug.replace('robots/', '')
        // console.log('Using robots endpoint:', { apiEndpoint, apiSlug })
      }

      const result = await $fetch<Post>(
        apiSlug === 'index'
          ? `${apiEndpoint}/index`
          : `${apiEndpoint}/${apiSlug}`
      )

      // Log the result for debugging
      // console.log('API response:', {
      //   apiEndpoint,
      //   apiSlug,
      //   hasResult: !!result,
      //   hasMetadata: !!result?.metadata,
      //   resultType: result?.type,
      //   resultShare: result?.share
      // })

      // Ensure we return a complete Post object with required fields
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

  /**
   * Helper function to determine if a post is a regular blog post
   * Based on the README.md structure and rules
   */
  function isRegularBlogPost(post: Post): boolean {
    const metadata = post?.metadata || post
    const slug = metadata?.slug || post?.slug

    // Only exclude index and system files
    if (
      !slug ||
      slug === 'index' ||
      slug.startsWith('!') ||
      slug.startsWith('_')
    ) {
      return false
    }

    // Handle special sections - check both with and without year prefix
    const pathParts = slug.split('/')
    const basePath =
      pathParts.length > 1 && /^\d{4}$/.test(pathParts[0])
        ? pathParts.slice(1).join('/')
        : slug

    // Skip special sections and drafts
    if (
      basePath.startsWith('reading/') ||
      basePath.startsWith('projects/') ||
      basePath.startsWith('robots/') ||
      basePath.startsWith('drafts/') ||
      basePath.startsWith('study-notes/') ||
      basePath.startsWith('prompts/') ||
      basePath.startsWith('week-notes/')
    ) {
      return false
    }

    // Skip if explicitly hidden or draft
    if (
      metadata?.hidden === true ||
      metadata?.draft === true ||
      post?.hidden === true ||
      post?.draft === true
    ) {
      return false
    }

    return true
  }

  /**
   * Fetches all posts, optionally including drafts and week notes.
   *
   * Filtering Process:
   * 1. Gets manifest-lite.json
   * 2. Filters out:
   *    - Hidden posts
   *    - Drafts (unless includeDrafts is true)
   *    - Week notes (unless includeWeekNotes is true)
   * 3. Processes dates and sorts by date (newest first)
   */
  const getAllPosts = async (
    includeDrafts = false,
    includeWeekNotes = false
  ): Promise<Post[]> => {
    try {
      const manifest = await getManifestLite()

      return manifest
        .filter((post: Post) => {
          const slug = post.slug
          const _type = post.type || post.metadata?.type

          // Skip if no slug
          if (!slug) {
            // console.log('❌ No slug:', post)
            return false
          }

          // Skip system files
          if (slug === 'index' || slug.startsWith('!')) {
            // console.log('❌ System file:', slug)
            return false
          }

          // Skip if explicitly hidden
          if (post.hidden === true || post.metadata?.hidden === true) {
            // console.log('❌ Hidden:', slug)
            return false
          }

          // Skip drafts unless includeDrafts is true
          if (
            (post.draft === true || post.metadata?.draft === true) &&
            !includeDrafts
          ) {
            // console.log('❌ Draft:', slug)
            return false
          }

          // Handle special sections - check both with and without year prefix
          const pathParts = slug.split('/')
          const basePath =
            pathParts.length > 1 && /^\d{4}$/.test(pathParts[0])
              ? pathParts.slice(1).join('/')
              : slug

          // Skip special sections
          if (
            basePath.startsWith('reading/') ||
            basePath.startsWith('projects/') ||
            basePath.startsWith('robots/') ||
            basePath.startsWith('drafts/') ||
            basePath.startsWith('study-notes/')
          ) {
            // console.log('❌ Special section:', slug)
            return false
          }

          // Handle week notes
          if (basePath.startsWith('week-notes/')) {
            const keep = includeWeekNotes
            // console.log(keep ? '✅ Week note:' : '❌ Week note:', slug)
            return keep
          }

          // console.log('✅ Keeping:', slug)
          return true
        })
        .map((post) => {
          // SUPER VERBOSE DEBUG
          // console.log('Processing post:', {
          //   slug: post.slug,
          //   rootTitle: post.title,
          //   metadataTitle: post?.metadata?.title,
          //   dek: post?.metadata?.dek
          // })

          // Ensure we have a title
          let title = post.title || post?.metadata?.title || ''

          if (!title && post?.metadata?.dek) {
            title = post.metadata.dek.split('\n')[0]
            // console.log('Using dek as title:', title)
          }

          if (!title) {
            title = formatTitle(post.slug)
            // console.log('Using formatted slug as title:', title)
          }

          const metadata: PostMetadata = {
            ...post.metadata,
            title,
            slug: post.slug,
            date: getValidDate(post.metadata?.date || post.date)
          }

          return {
            ...post,
            title,
            metadata,
            date: getValidDate(post.metadata?.date || post.date),
            modified: getValidDate(post.metadata?.modified || post.modified),
            type: post.type || post.metadata?.type,
            dek: post.dek || post.metadata?.dek,
            tags: post.tags || post.metadata?.tags
          } as Post
        })
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    } catch (error) {
      console.error('Error fetching posts:', error)
      throw error
    }
  }

  /**
   * Fetches all posts from a specific year.
   * @param {number} year - The year to filter posts by.
   * @param {boolean} [includeDrafts=false] - Whether to include drafts.
   * @param {boolean} [includeWeekNotes=false] - Whether to include week notes.
   * @returns {Promise<Object[]>} A list of posts filtered by year.
   */
  const getPostsByYear = async (
    year: number,
    includeDrafts = false,
    includeWeekNotes = false
  ): Promise<Post[]> => {
    const allPosts = await getAllPosts(includeDrafts, includeWeekNotes)
    return allPosts.filter((post) => new Date(post.date).getFullYear() === year)
  }

  /**
   * Fetches posts with their full content.
   * Limits the number of posts returned and allows pagination using offset.
   * @param {number} [limit=10] - Maximum number of posts to return.
   * @param {number} [offset=0] - Number of posts to skip before fetching.
   * @param {boolean} [includeDrafts=false] - Whether to include drafts.
   * @param {boolean} [includeWeekNotes=false] - Whether to include week notes.
   * @returns {Promise<Object[]>} A list of posts with full content.
   */
  const getPostsWithContent = async (
    limit = 10,
    offset = 0,
    includeDrafts = false,
    includeWeekNotes = false
  ): Promise<Post[]> => {
    try {
      const allPosts = await getAllPosts(includeDrafts, includeWeekNotes)
      const postsToFetch = allPosts.slice(offset, offset + limit)
      const postsWithContent = await Promise.all(
        postsToFetch.map(async (post) => {
          const fullPost = await getPostBySlug(post.slug)
          return { ...post, ...fullPost }
        })
      )
      return postsWithContent
    } catch (error) {
      console.error('Error fetching posts with content:', error)
      throw error
    }
  }

  /**
   * Fetches all draft posts.
   * @returns {Promise<Object[]>} A list of draft posts.
   */
  const getDrafts = async (): Promise<Post[]> => {
    const manifest = await getManifestLite()
    return manifest
      .filter((post: Post) => post.type === 'draft' && post.share === true)
      .map((post: Post) => ({
        ...post,
        date: getValidDate(post.date),
        modified: getValidDate(post.modified)
      }))
      .sort((a: Post, b: Post) => compareDates(b.date, a.date))
  }

  /**
   * Fetches all week notes posts.
   *
   * Filtering Process:
   * 1. Gets manifest-lite.json
   * 2. Filters for:
   *    - Posts in week-notes/ directory
   *    - Not hidden (hidden !== true)
   *    - Has a dek (description)
   * 3. Processes dates and sorts by date (newest first)
   *
   * @returns {Promise<Post[]>} A list of filtered and sorted week notes
   */
  const getWeekNotes = async (): Promise<Post[]> => {
    const manifest = await getManifestLite()
    debug('Filtering week notes')

    return manifest
      .filter((post: Post) => {
        // Handle both old and new formats
        const metadata = post.metadata || post
        const type = metadata.type || post.type
        const slug = metadata.slug || post.slug
        const hidden = metadata.hidden || post.hidden

        // Include only non-hidden week notes
        return (
          !hidden && (type === 'weekNote' || slug.startsWith('week-notes/'))
        )
      })
      .map((post: Post) => {
        const metadata = post.metadata || post
        return {
          ...metadata,
          date: getValidDate(metadata.date || post.date),
          modified: getValidDate(metadata.modified || post.modified)
        }
      })
      .sort((a: Post, b: Post) => compareDates(a.date, b.date))
  }

  /**
   * Fetches all reading posts.
   * @returns {Promise<Object[]>} A list of reading-related posts.
   */
  const getReadingPosts = async (): Promise<Post[]> => {
    const manifest = await getManifestLite()
    return manifest
      .filter((post: Post) => post.slug.startsWith('reading/'))
      .map((post: Post) => ({
        ...post,
        date: getValidDate(post.date),
        modified: getValidDate(post.modified)
      }))
      .sort((a: Post, b: Post) => compareDates(b.date, a.date))
  }

  /**
   * Fetches the previous and next posts relative to the current post.
   * @param {string} currentSlug - The slug of the current post.
   * @returns {Promise<Object>} The next and previous posts, if available.
   */
  const getNextPrevPosts = async (currentSlug: string) => {
    const manifest = await getManifestLite()

    // Use the same strict filtering
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

    const next = currentIndex > 0 ? filteredPosts[currentIndex - 1] : null
    const prev =
      currentIndex < filteredPosts.length - 1
        ? filteredPosts[currentIndex + 1]
        : null

    return { next, prev }
  }

  /**
   * Fetches project posts without content (lightweight version for listing)
   * @returns {Promise<Post[]>} A list of project posts from manifest only
   */
  const getProjectPostsLite = async (): Promise<Post[]> => {
    const manifest = await getManifestLite()
    
    // Filter for project posts
    const projectPosts = manifest.filter((post: Post) => {
      const slug = post.slug || post?.metadata?.slug
      return slug?.startsWith('projects/')
    })
    
    // Return sorted posts without fetching full content
    return projectPosts
      .map((post: Post) => ({
        ...post,
        // Ensure we have required fields
        slug: post.slug,
        title: post.metadata?.title || post.title || formatTitle(post.slug),
        date: getValidDate(post.metadata?.date || post.date),
        // Use metadata html if available (from manifest)
        html: post.html || post.metadata?.html || ''
      }))
      .sort((a: Post, b: Post) => compareDates(b.date, a.date))
  }

  /**
   * Fetches all project posts with full content.
   * WARNING: This fetches content for ALL projects which can be slow
   * @returns {Promise<Object[]>} A list of project posts with content.
   */
  const getProjectPosts = async (): Promise<Post[]> => {
    // console.log('getProjectPosts called')
    const manifest = await getManifestLite()

    // Filter for project posts
    const projectPosts = manifest.filter((post: Post) => {
      const slug = post.slug || post?.metadata?.slug
      return slug?.startsWith('projects/')
    })

    // Fetch full content for each project
    const projectsWithContent = await Promise.all(
      projectPosts.map(async (post: Post) => {
        try {
          // Use the full slug path when fetching content
          const fullPost = await getPostBySlug(post.slug)
          return {
            ...post,
            ...fullPost,
            // Ensure we keep the original slug
            slug: post.slug,
            // Ensure we have a title
            title:
              fullPost.metadata?.title ||
              fullPost.title ||
              post.metadata?.title ||
              post.title ||
              formatTitle(post.slug)
          }
        } catch (err) {
          console.error('Error fetching project content:', {
            slug: post.slug,
            error: err
          })
          return post
        }
      })
    )

    return projectsWithContent
      .filter((post) => post.content || post.html) // Only return posts with content
      .sort((a: Post, b: Post) => compareDates(b.date, a.date))
  }

  /**
   * Fetches all robot-generated posts that are marked as shared.
   * @returns {Promise<Post[]>} Array of robot posts.
   */
  const getRobotNotes = async (): Promise<Post[]> => {
    try {
      const manifest = await getManifestLite()
      return manifest
        .filter((post: Post) => {
          // Check both the post and its metadata for robot indicators
          const isRobot =
            post.slug.startsWith('robots/') || post.type === 'robot'
          const isShared = post.metadata?.share || post.share

          // console.log('Checking robot post:', {
          //   slug: post.slug,
          //   isRobot,
          //   isShared,
          //   type: post.type,
          //   share: post.share,
          //   metadataShare: post.metadata?.share
          // })

          return isRobot && isShared
        })
        .map((post: Post) => ({
          ...post,
          date: getValidDate(post.metadata?.date || post.date),
          modified: getValidDate(post.metadata?.modified || post.modified),
          type: 'robot'
        }))
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    } catch (error) {
      console.error('Error fetching robot notes:', error)
      return []
    }
  }

  /**
   * Fetches all study notes.
   * @returns {Promise<Object[]>} A list of study-notes posts.
   */
  const getStudyNotes = async (): Promise<Post[]> => {
    const manifest = await getManifestLite()
    return manifest
      .filter((post: Post) => post.slug.startsWith('study-notes/'))
      .map((post: Post) => ({
        ...post,
        date: getValidDate(post.date),
        modified: getValidDate(post.modified)
      }))
      .sort((a: Post, b: Post) => compareDates(b.date, a.date))
  }

  /**
   * Fetches all prompts.
   * @returns {Promise<Object[]>} A list of prompts.
   */
  const getPrompts = async (): Promise<Post[]> => {
    const manifest = await getManifestLite()
    return manifest
      .filter((post: Post) => post.slug.startsWith('prompts/'))
      .map((post: Post) => ({
        ...post,
        date: getValidDate(post.date),
        modified: getValidDate(post.modified)
      }))
      .sort((a: Post, b: Post) => compareDates(b.date, a.date))
  }

  // Add a new method for getting full robot note data
  const getRobotNotesWithContent = async (): Promise<Post[]> => {
    const robotPosts = await getRobotNotes()
    return Promise.all(
      robotPosts.map(async (post: Post) => {
        const fullPost = await getPostBySlug(post.slug)
        return {
          ...post,
          ...fullPost
        }
      })
    )
  }

  // Return the available functions for external usage
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

interface ManifestItem extends Post {
  // Add any specific manifest properties here if needed
  _isManifestItem?: true
}

// Helper to ensure dates are ISO strings
