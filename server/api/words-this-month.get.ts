import { defineEventHandler } from 'h3'
import { readFile } from 'fs/promises'
import path from 'path'

interface BlogPost {
  slug: string
  title: string
  date: string
  metadata: {
    words?: number
    date?: string
    hidden?: boolean
  }
}

export default defineEventHandler(async () => {
  try {
    // Read the manifest-lite file which contains all blog posts
    const manifestPath = path.join(
      process.cwd(),
      'content/processed/manifest-lite.json'
    )

    const rawData = await readFile(manifestPath, 'utf-8')
    const allPosts = JSON.parse(rawData) as BlogPost[]

    // Get current month and year
    const now = new Date()
    const currentMonth = now.getMonth() // 0-11
    const currentYear = now.getFullYear()

    // Filter posts by current month and year and not hidden
    const postsThisMonth = allPosts.filter((post) => {
      if (!post.date || post.metadata?.hidden === true) return false

      const postDate = new Date(post.date)
      return (
        postDate.getMonth() === currentMonth &&
        postDate.getFullYear() === currentYear
      )
    })

    // Calculate total words
    const totalWords = postsThisMonth.reduce((sum, post) => {
      return sum + (post.metadata?.words || 0)
    }, 0)

    // Get post count
    const postCount = postsThisMonth.length

    // Get average words per post
    const avgWordsPerPost =
      postCount > 0 ? Math.round(totalWords / postCount) : 0

    // Format month name for response
    const monthNames = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December'
    ]

    return {
      month: monthNames[currentMonth],
      year: currentYear,
      totalWords,
      postCount,
      avgWordsPerPost,
      posts: postsThisMonth.map((post) => ({
        title: post.title,
        slug: post.slug,
        date: post.date,
        words: post.metadata?.words || 0
      }))
    }
  } catch (error) {
    console.error('Error calculating words this month:', error)
    return {
      error: 'Failed to calculate words this month',
      details: error instanceof Error ? error.message : String(error)
    }
  }
})
