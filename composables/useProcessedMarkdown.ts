export const useProcessedMarkdown = () => {
  const config = useRuntimeConfig()

  const getManifestLite = async () => {
    console.log('Fetching manifest-lite from /api/manifest-lite')
    try {
      const result = await $fetch('/api/manifest-lite')
      console.log('Manifest-lite fetched successfully:', {
        type: typeof result,
        isArray: Array.isArray(result),
        length: Array.isArray(result) ? result.length : 'N/A',
        sampleData: Array.isArray(result) ? result.slice(0, 3) : result
      })
      return result
    } catch (error) {
      console.error('Error fetching manifest-lite:', error)
      throw error
    }
  }

  const getPostBySlug = async (slug: string) => {
    console.log(`Fetching post by slug: "${slug}" from /api/posts/${slug}`)
    try {
      const result = await $fetch(`/api/posts/${slug}`)
      console.log(`Post fetched for slug "${slug}". Post details:`, {
        title: result?.title,
        date: result?.date,
        contentLength: result.content ? result.content.length : 'N/A'
      })
      return result
    } catch (error) {
      console.error(`Error fetching post with slug "${slug}":`, error)
      throw error
    }
  }

  const getAllPosts = async (
    includeDrafts = false,
    includeWeekNotes = false
  ) => {
    const manifest = await getManifestLite()
    return manifest
      .filter((post) => {
        const isNotDraft = !post.slug.startsWith('drafts/')
        const isNotWeekNote = !post.slug.startsWith('week-notes/')
        const isNotReading = !post.slug.startsWith('reading/')
        const isNotProject = !post.slug.startsWith('projects/') // Add this line
        // it's an index page if the filename starts with !
        const isNotIndex = !post.slug.startsWith('!') && post.slug !== 'index'
        return (
          (includeDrafts || isNotDraft) &&
          (includeWeekNotes || isNotWeekNote) &&
          isNotReading &&
          isNotProject && // Add this condition
          isNotIndex
        )
      })
      .map((post) => ({
        ...post,
        date: getValidDate(post.date),
        modified: getValidDate(post.modified)
      }))
      .sort((a, b) => b.date.getTime() - a.date.getTime())
  }

  const getPostsByYear = async (
    year: number,
    includeDrafts = false,
    includeWeekNotes = false
  ) => {
    const allPosts = await getAllPosts(includeDrafts, includeWeekNotes)
    return allPosts.filter((post) => post.date.getFullYear() === year)
  }

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
      const allPosts = await getAllPosts(includeDrafts, includeWeekNotes)
      const postsToFetch = allPosts.slice(offset, offset + limit)
      const postsWithContent = await Promise.all(
        postsToFetch.map(async (post) => {
          const fullPost = await getPostBySlug(post.slug)
          return { ...post, ...fullPost }
        })
      )
      console.log(`Fetched ${postsWithContent.length} posts with content`)
      return postsWithContent
    } catch (error) {
      console.error('Error fetching posts with content:', error)
      throw error
    }
  }

  const getDrafts = async () => {
    const manifest = await getManifestLite()
    return manifest
      .filter((post) => post.slug.startsWith('drafts/'))
      .map((post) => ({
        ...post,
        date: getValidDate(post.date),
        modified: getValidDate(post.modified)
      }))
      .sort((a, b) => b.date.getTime() - a.date.getTime())
  }

  const getWeekNotes = async () => {
    const manifest = await getManifestLite()
    return manifest
      .filter((post) => post.slug.startsWith('week-notes/'))
      .map((post) => ({
        ...post,
        date: getValidDate(post.date),
        modified: getValidDate(post.modified)
      }))
      .sort((a, b) => b.date.getTime() - a.date.getTime())
  }

  const getReadingPosts = async () => {
    const manifest = await getManifestLite()
    return manifest
      .filter((post) => post.slug.startsWith('reading/'))
      .map((post) => ({
        ...post,
        date: getValidDate(post.date),
        modified: getValidDate(post.modified)
      }))
      .sort((a, b) => b.date.getTime() - a.date.getTime())
  }

  const getNextPrevPosts = async (currentSlug: string) => {
    console.log(`Getting next/prev posts for slug: "${currentSlug}"`)
    const allPosts = await getAllPosts(false, false) // Don't include drafts or week notes
    console.log(`Total posts retrieved: ${allPosts.length}`)

    if (allPosts.length === 0) {
      console.warn('No posts found in getAllPosts')
      return { next: null, prev: null }
    }

    console.log('First few posts:', allPosts.slice(0, 3))

    const currentIndex = allPosts.findIndex((post) => post.slug === currentSlug)
    console.log(`Current post index: ${currentIndex}`)

    if (currentIndex === -1) {
      console.warn(
        `Post with slug "${currentSlug}" not found in the list of posts.`
      )
      return { next: null, prev: null }
    }

    const next = currentIndex > 0 ? allPosts[currentIndex - 1] : null
    const prev =
      currentIndex < allPosts.length - 1 ? allPosts[currentIndex + 1] : null

    console.log('Next post:', next)
    console.log('Previous post:', prev)

    return {
      next: next
        ? { slug: next.slug, title: next.title, date: next.date }
        : null,
      prev: prev
        ? { slug: prev.slug, title: prev.title, date: prev.date }
        : null
    }
  }

  const getProjectPosts = async () => {
    const manifest = await getManifestLite()
    return manifest
      .filter((post) => post.slug.startsWith('projects/'))
      .map((post) => ({
        ...post,
        date: getValidDate(post.date),
        modified: getValidDate(post.modified)
      }))
      .sort((a, b) => b.date.getTime() - a.date.getTime())
  }

  function getValidDate(dateString: string | Date | undefined): Date {
    if (!dateString) {
      return new Date(0) // Return a default date if undefined
    }

    const date = new Date(dateString)

    if (isNaN(date.getTime())) {
      console.warn(`Invalid date: ${dateString}. Using default date.`)
      return new Date(0) // Return a default date if invalid
    }

    return date
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
    getProjectPosts // Add this new function to the returned object
  }
}
