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
  const getManifestLite = async () => {
    console.log('Fetching manifest-lite from /api/manifest-lite')
    try {
      const result = await $fetch('/api/manifest-lite') // Fetching the manifest
      console.log('Manifest-lite fetched successfully:', {
        type: typeof result,
        isArray: Array.isArray(result),
        length: Array.isArray(result) ? result.length : 'N/A',
        sampleData: Array.isArray(result) ? result.slice(0, 3) : result
      })
      return result
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
    console.log(`Fetching post by slug: "${slug}"`)
    try {
      // Special handling for the main index
      if (slug === 'index') {
        console.log('Fetching index content')
        const result = await $fetch('/api/posts/index')
        console.log('Index result:', result)
        return result
      }
      
      const result = await $fetch(`/api/posts/${slug}`)
      console.log(`Post fetched for slug "${slug}". Post details:`, result)
      return result
    } catch (error) {
      console.error(`Error fetching post with slug "${slug}":`, error)
      throw error
    }
  }

  /**
   * Fetches all posts, with options to include drafts and week notes.
   * Filters out certain categories of posts such as reading posts and project posts.
   * @param {boolean} [includeDrafts=false] - Whether to include drafts.
   * @param {boolean} [includeWeekNotes=false] - Whether to include week notes.
   * @returns {Promise<Object[]>} A list of filtered and sorted posts.
   */
  const getAllPosts = async (
    includeDrafts = false,
    includeWeekNotes = false
  ) => {
    const manifest = await getManifestLite() // Get the manifest first
    return manifest
      .filter((post) => {
        const isNotDraft = !post.slug.startsWith('drafts/')
        const isNotWeekNote = !post.slug.startsWith('week-notes/')
        const isNotReading = !post.slug.startsWith('reading/')
        const isNotProject = !post.slug.startsWith('projects/')
        const isNotIndex = !post.slug.startsWith('!') && post.slug !== 'index'
        return (
          (includeDrafts || isNotDraft) &&
          (includeWeekNotes || isNotWeekNote) &&
          isNotReading &&
          isNotProject &&
          isNotIndex
        )
      })
      .map((post) => ({
        ...post,
        date: getValidDate(post.date), // Ensure valid date
        modified: getValidDate(post.modified)
      }))
      .sort((a, b) => b.date.getTime() - a.date.getTime()) // Sort by date, newest first
  }

  /**
   * Fetches all posts from a specific year.
   * @param {number} year - The year to filter posts by.
   * @param {boolean} [includeDrafts=false] - Whether to include drafts.
   * @param {boolean} [includeWeekNotes=false] - Whether to include week notes.
   * @returns {Promise<Object[]>} A list of posts filtered by year.
   */
  const getPostsByYear = async (
    year,
    includeDrafts = false,
    includeWeekNotes = false
  ) => {
    const allPosts = await getAllPosts(includeDrafts, includeWeekNotes) // Get all posts first
    return allPosts.filter((post) => post.date.getFullYear() === year) // Filter by year
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
  ) => {
    console.log(
      `Fetching posts with content. Limit: ${limit}, Offset: ${offset}`
    )
    try {
      const allPosts = await getAllPosts(includeDrafts, includeWeekNotes) // Get all posts first
      const postsToFetch = allPosts.slice(offset, offset + limit) // Apply limit and offset
      const postsWithContent = await Promise.all(
        postsToFetch.map(async (post) => {
          const fullPost = await getPostBySlug(post.slug) // Fetch full content for each post
          return { ...post, ...fullPost } // Merge metadata with full content
        })
      )
      console.log(`Fetched ${postsWithContent.length} posts with content`)
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
  const getDrafts = async () => {
    const manifest = await getManifestLite() // Get the manifest first
    return manifest
      .filter((post) => post.slug.startsWith('drafts/')) // Filter for drafts
      .map((post) => ({
        ...post,
        date: getValidDate(post.date), // Ensure valid date
        modified: getValidDate(post.modified)
      }))
      .sort((a, b) => b.date.getTime() - a.date.getTime()) // Sort drafts by date, newest first
  }

  /**
   * Fetches all week notes posts.
   * @returns {Promise<Object[]>} A list of week notes.
   */
  const getWeekNotes = async () => {
    const manifest = await getManifestLite() // Get the manifest first
    return manifest
      .filter((post) => post.slug.startsWith('week-notes/')) // Filter for week notes
      .map((post) => ({
        ...post,
        date: getValidDate(post.date), // Ensure valid date
        modified: getValidDate(post.modified)
      }))
      .sort((a, b) => b.date.getTime() - a.date.getTime()) // Sort week notes by date, newest first
  }

  /**
   * Fetches all posts related to reading.
   * @returns {Promise<Object[]>} A list of reading-related posts.
   */
  const getReadingPosts = async () => {
    const manifest = await getManifestLite() // Get the manifest first
    return manifest
      .filter((post) => post.slug.startsWith('reading/')) // Filter for reading posts
      .map((post) => ({
        ...post,
        date: getValidDate(post.date), // Ensure valid date
        modified: getValidDate(post.modified)
      }))
      .sort((a, b) => b.date.getTime() - a.date.getTime()) // Sort reading posts by date, newest first
  }

  /**
   * Fetches the previous and next posts relative to the current post.
   * @param {string} currentSlug - The slug of the current post.
   * @returns {Promise<Object>} The next and previous posts, if available.
   */
  const getNextPrevPosts = async (currentSlug) => {
    console.log(`Getting next/prev posts for slug: "${currentSlug}"`)
    const allPosts = await getAllPosts(false, false) // Get all posts (excluding drafts and week notes)
    console.log(`Total posts retrieved: ${allPosts.length}`)

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
      .sort((a: Post, b: Post) => b.date.getTime() - a.date.getTime()) // Sort project posts by date, newest first
  }

  /**
   * Ensures the date is valid and returns a Date object. If the date is invalid, it defaults to the Unix epoch.
   * @param {string | Date | undefined} dateString - The date string or Date object to validate.
   * @returns {Date} A valid Date object, or the Unix epoch if invalid.
   */
  function getValidDate(dateString) {
    if (!dateString) {
      return new Date(0) // Return a default date (Unix epoch) if undefined
    }

    const date = new Date(dateString)
    if (isNaN(date.getTime())) {
      console.warn(`Invalid date: ${dateString}. Using default date.`)
      return new Date(0) // Return a default date if invalid
    }

    return date
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
    getProjectPosts // Include the new project post function
  }
}

interface Post {
  slug: string;
  title: string;
  date: string | Date;
  modified?: string | Date;
  url?: string;
  [key: string]: any; // Allow for other properties
}
