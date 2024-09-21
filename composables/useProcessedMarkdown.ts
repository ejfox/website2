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
        title: result.title,
        date: result.date,
        contentLength: result.content ? result.content.length : 'N/A'
      })
      return result
    } catch (error) {
      console.error(`Error fetching post with slug "${slug}":`, error)
      throw error
    }
  }

  const getAllPosts = async () => {
    const manifest = await getManifestLite()
    return manifest
      .map((post) => ({
        ...post,
        date: getValidDate(post.date),
        modified: getValidDate(post.modified)
      }))
      .sort((a, b) => b.date.getTime() - a.date.getTime())
  }

  const getPostsWithContent = async (limit = 10, offset = 0) => {
    console.log(
      `Fetching posts with content. Limit: ${limit}, Offset: ${offset}`
    )
    try {
      const allPosts = await getAllPosts()
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

  const getPostsByYear = async (year: number) => {
    console.log(`Fetching posts for year: ${year}`)
    try {
      const manifestLite = await getManifestLite()
      const filteredPosts = manifestLite.filter(
        (post) => new Date(post.date).getFullYear() === year
      )
      console.log(`Posts filtered for year ${year}. Results:`, {
        totalPosts: filteredPosts.length,
        percentage:
          ((filteredPosts.length / manifestLite.length) * 100).toFixed(2) + '%',
        monthDistribution: filteredPosts.reduce((acc, post) => {
          const month = new Date(post.date).getMonth() + 1
          acc[month] = (acc[month] || 0) + 1
          return acc
        }, {}),
        slugs: filteredPosts.map((p) => p.slug).join(', ')
      })
      return filteredPosts
    } catch (error) {
      console.error(`Error fetching posts for year ${year}:`, error)
      throw error
    }
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
    getPostsWithContent
  }
}
