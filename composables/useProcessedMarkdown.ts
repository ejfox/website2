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
 * - Filters out:
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
    // console.log('Fetching manifest-lite from /api/manifest-lite')
    try {
      const result = await $fetch('/api/manifest-lite') // Fetching the manifest
      // console.log('Manifest-lite fetched successfully:', {
      //   type: typeof result,
      //   isArray: Array.isArray(result),
      //   length: Array.isArray(result) ? result.length : 'N/A',
      //   sampleData: Array.isArray(result) ? result.slice(0, 3) : result
      // })
      return result as ManifestItem[]
    } catch (error) {
      console.error('Error fetching manifest-lite:', error)
      throw error // If the fetch fails, an error is thrown
    }
  }

  /**
   * Fetches a single post by its slug.
   * @param {string} slug - The slug of the post to fetch.
   * @returns {Promise<Object>} The post object, including title, date, and content.
   */
  const getPostBySlug = async (slug: string) => {
    // console.log(`Fetching post by slug: "${slug}"`)
    try {
      // Special handling for the main index
      if (slug === 'index') {
        // console.log('Fetching index content')
        const result = await $fetch('/api/posts/index')
        // console.log('Index result:', result)
        return result
      }

      const result = await $fetch(`/api/posts/${slug}`)
      // console.log(`Post fetched for slug "${slug}". Post details:`, result)
      return result
    } catch (error) {
      console.error(`Error fetching post with slug "${slug}":`, error)
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
    // console.log(`Starting getAllPosts with ${manifest.length} total posts`)
    // console.log(
    //   `Parameters: includeDrafts=${includeDrafts}, includeWeekNotes=${includeWeekNotes}`
    // )

    const filteredPosts = manifest.filter((post: Post) => {
      // Handle drafts
      const isNotDraft = !post.slug.startsWith('drafts/')
      const isSharedDraft =
        post.slug.startsWith('drafts/') && post.share === true

      // Special cases that should always be excluded
      const isNotIndex = !post.slug.startsWith('!') && post.slug !== 'index'

      // Handle week notes
      const isWeekNote = post.slug.includes('week-notes/')

      // Check if post is in a special section that should be excluded
      const isSpecialSection = [
        'reading/',
        'projects/',
        'robots/',
        'study-notes/',
        'prompts/'
      ].some((section) => post.slug.startsWith(section))

      // Only exclude posts that are explicitly hidden
      const isNotHidden = !(post.hidden === true || post.hidden === 'true')

      // Debug log for every post
      // console.log(`Filtering post ${post.slug}:`, {
      //   isNotDraft,
      //   isSharedDraft,
      //   isNotIndex,
      //   isWeekNote,
      //   isSpecialSection,
      //   isNotHidden,
      //   hidden: post.hidden,
      //   share: post.share,
      //   shouldKeep:
      //     (includeDrafts ? isSharedDraft || isNotDraft : isNotDraft) &&
      //     isNotIndex &&
      //     (includeWeekNotes ? true : !isWeekNote) &&
      //     !isSpecialSection &&
      //     isNotHidden
      // })

      return (
        (includeDrafts ? isSharedDraft || isNotDraft : isNotDraft) &&
        isNotIndex &&
        (includeWeekNotes ? true : !isWeekNote) &&
        !isSpecialSection &&
        isNotHidden
      )
    })

    // console.log(`After filtering: ${filteredPosts.length} posts remain`)
    // console.log(
    //   'Filtered posts:',
    //   filteredPosts.map((p) => ({
    //     slug: p.slug,
    //     date: p.date,
    //     hidden: p.hidden,
    //     share: p.share
    //   }))
    // )

    const postsWithDates = filteredPosts.map((post: Post) => ({
      ...post,
      date: getValidDate(post.date, post.slug),
      modified: getValidDate(post.modified, post.slug)
    }))

    // console.log(
    //   'After date processing:',
    //   postsWithDates.map((p) => ({
    //     slug: p.slug,
    //     date: p.date,
    //     modified: p.modified
    //   }))
    // )

    const sortedPosts = postsWithDates.sort(
      (a: Post, b: Post) =>
        getValidDate(b.date, b.slug).getTime() -
        getValidDate(a.date, a.slug).getTime()
    )

    console.log(
      'Final sorted posts:',
      sortedPosts.map((p) => ({
        slug: p.slug,
        date: p.date
      }))
    )

    return sortedPosts
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
    // console.log(
    //   `Fetching posts with content. Limit: ${limit}, Offset: ${offset}`
    // )
    try {
      const allPosts = await getAllPosts(includeDrafts, includeWeekNotes) // Get all posts first
      const postsToFetch = allPosts.slice(offset, offset + limit) // Apply limit and offset
      const postsWithContent = await Promise.all(
        postsToFetch.map(async (post) => {
          const fullPost = await getPostBySlug(post.slug) // Fetch full content for each post
          return { ...post, ...fullPost } // Merge metadata with full content
        })
      )
      // console.log(`Fetched ${postsWithContent.length} posts with content`)
      return postsWithContent
    } catch (error) {
      console.error('Error fetching posts with content:', error)
      throw error // If something goes wrong, throw an error
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
        // Check for week notes in either location
        const isWeekNote = post.slug.includes('week-notes/')
        // Only exclude posts that are explicitly hidden
        const isNotHidden = post.hidden !== true
        const isNotIndex = !post.slug.startsWith('!') && post.slug !== 'index'

        // Debug log
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
    // console.log(`Getting next/prev posts for slug: "${currentSlug}"`)
    const allPosts = await getAllPosts(false, false) // Get all posts (excluding drafts and week notes)
    // console.log(`Total posts retrieved: ${allPosts.length}`)

    if (allPosts.length === 0) {
      console.warn('No posts found in getAllPosts')
      return { next: null, prev: null }
    }

    const currentIndex = allPosts.findIndex((post) => post.slug === currentSlug) // Find index of the current post
    if (currentIndex === -1) {
      console.warn(`Post with slug "${currentSlug}" not found.`)
      return { next: null, prev: null }
    }

    // Get next and previous posts based on the current index
    const next = currentIndex > 0 ? allPosts[currentIndex - 1] : null
    const prev =
      currentIndex < allPosts.length - 1 ? allPosts[currentIndex + 1] : null

    return {
      next: next
        ? { slug: next.slug, title: next.title, date: next.date }
        : null,
      prev: prev
        ? { slug: prev.slug, title: prev.title, date: prev.date }
        : null
    }
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
