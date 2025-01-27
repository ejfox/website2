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
 * A composable to process and retrieve markdown content, specifically blog posts and their metadata.
 * This includes fetching individual posts, filtering posts by year, managing drafts, and more.
 * The component interacts with a backend API and handles common tasks such as sorting and formatting dates.
 *
 * @returns {Object} An object with various methods to retrieve blog posts and their metadata.
 */

// Add debug helper
const debug = (msg: string, data?: any) => {
  if (process.env.DEBUG_CONTENT === 'true') {
    console.log(`[content] ${msg}`, data || '')
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
function getValidDate(date?: string | Date, slug?: string): string {
  // If we have a date, convert it to ISO string
  if (date) {
    if (date instanceof Date) {
      return date.toISOString()
    }
    // Parse the date string and preserve timezone
    const parsedDate = new Date(date)
    return parsedDate.toISOString()
  }

  // Try to extract date from slug if provided
  if (slug) {
    const match = slug.match(/\d{4}-\d{2}-\d{2}/)
    if (match) {
      return new Date(match[0]).toISOString()
    }
  }

  // Default to current date
  return new Date().toISOString()
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
  const config = useRuntimeConfig()

  /**
   * Fetches the "manifest-lite" JSON, which contains a lightweight list of posts and metadata.
   * This manifest is used to quickly retrieve post slugs, dates, and other metadata.
   *
   * @returns {Promise<Object[]>} The list of posts from the manifest.
   */
  const getManifestLite = async (): Promise<ManifestItem[]> => {
    try {
      debug('Fetching manifest')
      const result = await $fetch('/api/manifest')

      if (!Array.isArray(result)) {
        console.error('Error: Manifest is not an array')
        return []
      }

      // Log the first item that has 'project' in its slug
      const firstProject = result.find((p) => p.slug?.includes('project'))
      console.log('First project-like item in manifest:', firstProject)

      // Log all project slugs
      const projectSlugs = result
        .filter((p) => p.slug?.startsWith('projects/'))
        .map((p) => p.slug)
      console.log('All project slugs in manifest:', projectSlugs)

      return result as ManifestItem[]
    } catch (error) {
      console.error('Error fetching manifest:', error)
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
      const result = await $fetch<Partial<Post>>(
        slug === 'index' ? '/api/posts/index' : `/api/posts/${slug}`
      )

      // Ensure we return a complete Post object with required fields
      const post: Post = {
        slug: result.metadata?.slug || slug,
        date: getValidDate(result.metadata?.date || result.date, slug),
        title: result.metadata?.title || result.title || formatTitle(slug),
        content: result.content,
        html: result.html,
        metadata: result.metadata
      }
      return post
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
    const type = metadata?.type || post?.type
    const hidden = metadata?.hidden || post?.hidden
    const draft = metadata?.draft || post?.draft

    // Must have a slug and not be hidden/draft
    if (!slug || hidden || draft) return false

    // Exclude special sections
    if (
      slug.startsWith('reading/') ||
      slug.startsWith('projects/') ||
      slug.startsWith('robots/') ||
      slug.startsWith('prompts/') ||
      slug.startsWith('drafts/') ||
      slug.startsWith('week-notes/') ||
      slug.startsWith('study-notes/') ||
      slug.startsWith('!') ||
      slug.startsWith('_') ||
      slug === 'index'
    ) {
      return false
    }

    // Must be a post type or in a year directory
    const isYearDirectory = /^\d{4}\//.test(slug)
    return type === 'post' || isYearDirectory
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
      const filtered = manifest.filter((post: Post) => {
        // Handle both old and new formats
        const metadata = post.metadata || post
        const slug = metadata.slug || post.slug
        const type = metadata.type || post.type
        const hidden = metadata.hidden || post.hidden
        const draft = metadata.draft || post.draft

        // Handle week notes separately if requested
        if (
          includeWeekNotes &&
          (type === 'weekNote' || slug.startsWith('week-notes/'))
        ) {
          return !hidden && !draft
        }

        // Handle drafts separately if requested
        if (includeDrafts && draft) {
          return !hidden
        }

        // For regular blog posts, use our strict helper
        return isRegularBlogPost(post)
      })

      return filtered
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
          date: getValidDate(
            metadata.date || post.date,
            metadata.slug || post.slug
          ),
          modified: getValidDate(
            metadata.modified || post.modified,
            metadata.slug || post.slug
          )
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
      return { next: null, prev: null }
    }

    const currentIndex = filteredPosts.findIndex(
      (post) => post.slug === currentSlug
    )
    if (currentIndex === -1) {
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
   * Fetches all project posts.
   * @returns {Promise<Object[]>} A list of project posts.
   */
  const getProjectPosts = async (): Promise<Post[]> => {
    console.log('getProjectPosts called')
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
   * Fetches all robot notes that are explicitly marked for sharing.
   * @returns {Promise<Object[]>} A list of shareable robot notes.
   */
  const getRobotNotes = async (): Promise<Post[]> => {
    const manifest = await getManifestLite()
    return manifest
      .filter(
        (post: Post) => post.slug.startsWith('robots/') && post.share === true
      )
      .map((post: Post) => ({
        ...post,
        date: getValidDate(post.date),
        modified: getValidDate(post.modified)
      }))
      .sort((a: Post, b: Post) => compareDates(b.date, a.date))
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
    getRobotNotes,
    getRobotNotesWithContent,
    getStudyNotes,
    getPrompts
  }
}

interface ManifestItem extends Post {
  // Add any specific manifest properties here
}

// Helper to ensure dates are ISO strings
