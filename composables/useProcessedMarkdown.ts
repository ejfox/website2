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

// Add a simple debug helper at the top
const debug = (msg: string, data?: any) => {
  if (process.env.DEBUG_CONTENT === 'true') {
    console.log(`[content] ${msg}`, data || '')
  }
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
      debug('Fetching manifest-lite')
      const result = await $fetch('/api/manifest-lite')

      if (!Array.isArray(result)) {
        console.error('Error: Manifest-lite is not an array')
        return []
      }

      // Only log stats in debug mode
      debug('Manifest stats', {
        total: result.length,
        posts: result.filter((p) => p?.metadata?.type === 'post').length,
        weekNotes: result.filter((p) => p?.slug?.includes('week-notes/'))
          .length,
        hidden: result.filter((p) => p?.metadata?.hidden || p?.hidden).length
      })

      return result as ManifestItem[]
    } catch (error) {
      console.error('Error fetching manifest-lite:', error)
      throw error
    }
  }

  /**
   * Fetches a single post by its slug.
   * @param {string} slug - The slug of the post to fetch.
   * @returns {Promise<Object>} The post object, including title, date, and content.
   */
  const getPostBySlug = async (slug: string) => {
    try {
      const result = await $fetch(
        slug === 'index' ? '/api/posts/index' : `/api/posts/${slug}`
      )
      return result
    } catch (error) {
      console.error(`Error fetching post "${slug}":`, error)
      throw error
    }
  }

  /**
   * Fetches all posts, with options to include drafts and week notes.
   *
   * Filtering Process:
   * 1. Gets manifest-lite.json (all posts)
   * 2. Applies visibility filters:
   *    - Drafts: Only shown if includeDrafts=true AND share=true
   *    - Hidden posts: Filtered out if hidden=true
   *    - Special sections: Filtered out (reading/, projects/, etc.)
   *    - Week notes: Only included if includeWeekNotes=true
   * 3. Processes dates and sorts by date (newest first)
   *
   * @param {boolean} [includeDrafts=false] - Whether to include drafts with share=true
   * @param {boolean} [includeWeekNotes=false] - Whether to include week notes
   * @returns {Promise<Post[]>} A list of filtered and sorted posts
   */
  const getAllPosts = async (
    includeDrafts = false,
    includeWeekNotes = false
  ): Promise<Post[]> => {
    const manifest = await getManifestLite()
    debug('Filtering posts', { includeDrafts, includeWeekNotes })

    return manifest
      .filter((post: Post) => {
        // Skip posts without content
        if (!post?.wordCount && !post?.metadata?.wordCount && !post?.html) {
          debug(`Skipping post without content: ${post?.slug}`)
          return false
        }

        const isHidden = post?.metadata?.hidden || post?.hidden === true
        const isIndex = post?.slug === 'index' || post?.slug?.startsWith('!')
        const isSpecialSection = [
          'reading/',
          'projects/',
          'robots/',
          'study-notes/',
          'prompts/'
        ].some((section) => post.slug.startsWith(section))
        const isDraft = post?.metadata?.draft || post?.draft === true
        const isWeekNote = post.slug.includes('week-notes/')

        // Skip hidden and index posts
        if (isHidden || isIndex) return false

        // Skip special sections unless it's a week note we want to include
        if (isSpecialSection && !(includeWeekNotes && isWeekNote)) return false

        // Skip week notes unless explicitly included
        if (isWeekNote && !includeWeekNotes) return false

        // Handle drafts
        if (isDraft) {
          return (
            includeDrafts && (post?.metadata?.share || post?.share === true)
          )
        }

        return true
      })
      .sort(
        (a: Post, b: Post) =>
          new Date(b.date).getTime() - new Date(a.date).getTime()
      )
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
    const allPosts = await getAllPosts(includeDrafts, includeWeekNotes) // Get all posts first
    return allPosts.filter(
      (post) => getValidDate(post.date).getFullYear() === year
    ) // Filter by year
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
      .filter(
        (post: Post) =>
          // Only include drafts that are explicitly marked for sharing
          post.slug.startsWith('drafts/') && post.share === true
      )
      .map((post: Post) => ({
        ...post,
        date: getValidDate(post.date),
        modified: getValidDate(post.modified)
      }))
      .sort(
        (a: Post, b: Post) =>
          getValidDate(b.date).getTime() - getValidDate(a.date).getTime()
      )
  }

  /**
   * Ensures the date is valid and returns a Date object.
   * For week notes, attempts to extract date from filename if frontmatter date is invalid.
   * @param {string | Date | undefined} dateString - The date string or Date object to validate.
   * @param {string} [slug] - Optional slug to extract date from filename for week notes
   * @returns {Date} A valid Date object, or the Unix epoch if invalid.
   */
  function getValidDate(
    dateString: string | Date | undefined,
    slug?: string
  ): Date {
    // First try the provided date
    if (dateString) {
      const date = new Date(dateString)
      if (!isNaN(date.getTime())) {
        return date
      }
    }

    // For week notes, try to extract date from filename
    if (slug?.includes('week-notes/')) {
      const weekMatch = slug.match(/(\d{4})-(\d+)/)
      if (weekMatch) {
        const [_, year, week] = weekMatch
        const date = new Date(parseInt(year, 10))
        date.setDate(1 + (parseInt(week, 10) - 1) * 7)
        if (!isNaN(date.getTime())) {
          return date
        }
      }
    }

    // Try to extract date from filename for other posts
    if (slug) {
      // Try YYYY-MM-DD format
      const dateMatch = slug.match(/(\d{4})-(\d{2})-(\d{2})/)
      if (dateMatch) {
        const [_, year, month, day] = dateMatch
        const date = new Date(
          parseInt(year, 10),
          parseInt(month, 10) - 1,
          parseInt(day, 10)
        )
        if (!isNaN(date.getTime())) {
          return date
        }
      }

      // Try YYYY format
      const yearMatch = slug.match(/(\d{4})/)
      if (yearMatch) {
        const year = parseInt(yearMatch[1], 10)
        if (year > 1970 && year < 2025) {
          const date = new Date(year, 0, 1)
          if (!isNaN(date.getTime())) {
            return date
          }
        }
      }
    }

    // If no valid date found, use file modification time or a recent date
    console.warn(
      `Invalid date: ${dateString} for ${
        slug || 'unknown file'
      }. Using recent date.`
    )
    return new Date() // Use current date as fallback instead of Unix epoch
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
    return manifest
      .filter((post: Post) => {
        const isWeekNote = post.slug.includes('week-notes/')
        const isNotHidden = post.hidden !== true
        const isNotIndex = !post.slug.startsWith('!') && post.slug !== 'index'

        console.log('Week note filtering:', {
          slug: post.slug,
          isWeekNote,
          isNotHidden,
          isNotIndex,
          hidden: post.hidden,
          shouldKeep: isWeekNote && isNotHidden && isNotIndex
        })

        return isWeekNote && isNotHidden && isNotIndex
      })
      .map((post: Post) => ({
        ...post,
        date: getValidDate(post.date, post.slug),
        modified: getValidDate(post.modified, post.slug)
      }))
      .sort(
        (a: Post, b: Post) =>
          getValidDate(b.date, b.slug).getTime() -
          getValidDate(a.date, a.slug).getTime()
      )
  }

  /**
   * Fetches all posts related to reading.
   * @returns {Promise<Object[]>} A list of reading-related posts.
   */
  const getReadingPosts = async (): Promise<Post[]> => {
    const manifest = await getManifestLite() // Get the manifest first
    return manifest
      .filter((post: Post) => post.slug.startsWith('reading/')) // Filter for reading posts
      .map((post: Post) => ({
        ...post,
        date: getValidDate(post.date), // Ensure valid date
        modified: getValidDate(post.modified)
      }))
      .sort(
        (a: Post, b: Post) =>
          getValidDate(b.date).getTime() - getValidDate(a.date).getTime()
      ) // Sort reading posts by date, newest first
  }

  /**
   * Fetches the previous and next posts relative to the current post.
   * @param {string} currentSlug - The slug of the current post.
   * @returns {Promise<Object>} The next and previous posts, if available.
   */
  const getNextPrevPosts = async (currentSlug: string) => {
    const allPosts = await getAllPosts(false, false)

    if (allPosts.length === 0) {
      return { next: null, prev: null }
    }

    const currentIndex = allPosts.findIndex((post) => post.slug === currentSlug)
    if (currentIndex === -1) {
      return { next: null, prev: null }
    }

    const next = currentIndex > 0 ? allPosts[currentIndex - 1] : null
    const prev =
      currentIndex < allPosts.length - 1 ? allPosts[currentIndex + 1] : null

    return { next, prev }
  }

  /**
   * Fetches all project-related posts.
   * @returns {Promise<Object[]>} A list of project posts.
   */
  const getProjectPosts = async (): Promise<Post[]> => {
    const manifest = await getManifestLite() // Get the manifest first
    return manifest
      .filter((post: Post) => post.slug.startsWith('projects/')) // Filter for project posts
      .map((post: Post) => ({
        ...post,
        date: getValidDate(post.date), // Ensure valid date
        modified: getValidDate(post.modified),
        url: post.url // Persist the .url property from the front matter
      }))
      .sort(
        (a: Post, b: Post) =>
          getValidDate(b.date).getTime() - getValidDate(a.date).getTime()
      ) // Sort project posts by date, newest first
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
      .sort(
        (a: Post, b: Post) =>
          getValidDate(b.date).getTime() - getValidDate(a.date).getTime()
      )
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

  // Add new helper functions for the new sections
  const getStudyNotes = async (): Promise<Post[]> => {
    const manifest = await getManifestLite()
    return manifest
      .filter((post: Post) => post.slug.startsWith('study-notes/'))
      .map((post: Post) => ({
        ...post,
        date: getValidDate(post.date),
        modified: getValidDate(post.modified)
      }))
      .sort(
        (a: Post, b: Post) =>
          getValidDate(b.date).getTime() - getValidDate(a.date).getTime()
      )
  }

  const getPrompts = async (): Promise<Post[]> => {
    const manifest = await getManifestLite()
    return manifest
      .filter((post: Post) => post.slug.startsWith('prompts/'))
      .map((post: Post) => ({
        ...post,
        date: getValidDate(post.date),
        modified: getValidDate(post.modified)
      }))
      .sort(
        (a: Post, b: Post) =>
          getValidDate(b.date).getTime() - getValidDate(a.date).getTime()
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

interface Post {
  slug: string
  title: string
  date: string | Date
  modified?: string | Date
  url?: string
  share?: boolean
  _path?: string
  description?: string
  tags?: string[]
  [key: string]: any // Allow for other properties
}

interface ManifestItem extends Post {
  // Add any specific manifest properties here
}
