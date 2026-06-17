/**
 * @file blog-stats.get.ts
 * @description Aggregates blog writing statistics from words-this-month endpoint into a stats-friendly format
 * @endpoint GET /api/blog-stats
 * @returns Blog statistics with post count, word count, recent posts, and monthly writing metrics
 */
interface RecentPost {
  title?: string
  slug?: string
  date?: string
  words?: number
}

interface WordsThisMonthResponse {
  postCount?: number
  totalPosts?: number
  totalWords?: number
  avgWordsPerPost?: number
  posts?: RecentPost[]
  month?: string
  year?: number
  error?: string
  details?: string
}

export default defineEventHandler(async () => {
  try {
    // Get this month's data
    const wordsData = await $fetch<WordsThisMonthResponse>(
      '/api/words-this-month'
    )

    // Return in a more stats-friendly format
    return {
      posts: {
        thisMonth: wordsData.postCount || 0,
        total: wordsData.totalPosts || 0, // Get from enhanced API
      },
      words: {
        thisMonth: wordsData.totalWords || 0,
        avgPerPost: wordsData.avgWordsPerPost || 0,
      },
      recentPosts: wordsData.posts || [],
      month: wordsData.month,
      year: wordsData.year,
    }
  } catch (error) {
    console.error('Error fetching blog stats:', error)
    return {
      posts: { thisMonth: 0, total: 0 },
      words: { thisMonth: 0, avgPerPost: 0 },
      recentPosts: [],
      month: new Date().toLocaleDateString('en-US', { month: 'long' }),
      year: new Date().getFullYear(),
    }
  }
})
