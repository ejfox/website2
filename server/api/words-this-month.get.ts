/**
 * @file words-this-month.get.ts
 * @description Calculates monthly writing statistics from manifest including word count, post count, and averages
 * @endpoint GET /api/words-this-month
 * @returns Current month's writing stats with total words, post count, average words per post, and post details
 */
import { defineEventHandler } from 'h3'
import { readFile } from 'node:fs/promises'
import path from 'node:path'

interface BlogPost {
  slug: string
  title: string
  date: string
  draft?: boolean
  hidden?: boolean
  unlisted?: boolean
  password?: string
  passwordHash?: string
  metadata: {
    words?: number
    date?: string
    hidden?: boolean
    draft?: boolean
    unlisted?: boolean
    password?: string
    passwordHash?: string
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

    // Filter out drafts, hidden, unlisted, and password-protected posts for total count
    // Only count actual blog posts (yearly folders, not projects/reading/etc)
    const allPublishedPosts = allPosts.filter((post) => {
      if (!post.date) return false
      // Exclude hidden posts
      if (post.hidden || post.metadata?.hidden) return false
      // Exclude draft posts
      if (post.draft || post.metadata?.draft) return false
      // Exclude unlisted posts
      if (post.unlisted || post.metadata?.unlisted) return false
      // Exclude password-protected posts
      const hasPassword = !!(post.password || post.passwordHash || post.metadata?.password || post.metadata?.passwordHash)
      if (hasPassword) return false
      if (post.slug.startsWith('drafts/')) return false
      // Only count posts in yearly folders (2018/, 2019/, etc.) as blog posts
      if (!post.slug.match(/^\d{4}\//)) return false
      return true
    })

    // Filter posts by current month and year, excluding drafts and hidden posts
    const postsThisMonth = allPublishedPosts.filter((post) => {
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
      'December',
    ]

    return {
      month: monthNames[currentMonth],
      year: currentYear,
      totalWords,
      postCount,
      totalPosts: allPublishedPosts.length, // Total published posts count
      avgWordsPerPost,
      posts: postsThisMonth.map((post) => ({
        title: post.title,
        slug: post.slug,
        date: post.date,
        words: post.metadata?.words || 0,
      })),
    }
  } catch (error) {
    console.error('Error calculating words this month:', error)
    return {
      error: 'Failed to calculate words this month',
      details: error instanceof Error ? error.message : String(error),
    }
  }
})
