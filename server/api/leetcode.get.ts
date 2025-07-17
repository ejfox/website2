import { defineEventHandler, createError } from 'h3'

interface ContestRanking {
  attendedContestsCount: number
  rating: number
  globalRanking: number
  totalParticipants: number
  topPercentage: number
}

interface SubmissionStats {
  difficulty: string
  count: number
  submissions: number
}

interface RecentSubmission {
  title: string
  titleSlug: string
  timestamp: string
  statusDisplay: string
  lang: string
}

interface LeetCodeResponse {
  contestStats: ContestRanking | null
  recentSubmissions: RecentSubmission[]
  submissionStats: {
    easy: SubmissionStats
    medium: SubmissionStats
    hard: SubmissionStats
  }
  lastUpdated: string
}

export default defineEventHandler(async () => {
  const username = 'ejfox'

  const makeRequest = async <T>(_url: string): Promise<T> => {
    const query = `
    {
      userContestRanking(username: "${username}") {
        attendedContestsCount
        rating
        globalRanking
        totalParticipants
        topPercentage
      }
      recentSubmissionList(username: "${username}") {
        title
        titleSlug
        timestamp
        statusDisplay
        lang
      }
      matchedUser(username: "${username}") {
        submitStats: submitStatsGlobal {
          acSubmissionNum {
            difficulty
            count
            submissions
          }
        }
      }
    }`

    const response = await fetch('https://leetcode.com/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        query: query
      })
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        message: 'Unknown error'
      }))
      throw createError({
        statusCode: response.status,
        message: error.message || `LeetCode API error: ${response.statusText}`
      })
    }

    const data = await response.json()
    return data as T
  }

  try {
    const data = await makeRequest<any>('https://leetcode.com/graphql')

    const response = {
      contestStats: data.data.userContestRanking || null,
      recentSubmissions:
        data.data.recentSubmissionList?.map((submission: any) => ({
          title: submission.title,
          titleSlug: submission.titleSlug,
          timestamp: submission.timestamp,
          statusDisplay: submission.statusDisplay,
          lang: submission.lang
        })) || [],
      submissionStats: {
        easy: { count: 0, submissions: 0 },
        medium: { count: 0, submissions: 0 },
        hard: { count: 0, submissions: 0 }
      },
      lastUpdated: new Date().toISOString()
    }

    if (data.data.matchedUser?.submitStats?.acSubmissionNum) {
      data.data.matchedUser.submitStats.acSubmissionNum.forEach((stat: any) => {
        const difficulty = stat.difficulty.toLowerCase()
        if (difficulty in response.submissionStats) {
          response.submissionStats[
            difficulty as keyof typeof response.submissionStats
          ] = {
            count: stat.count,
            submissions: stat.submissions
          }
        }
      })
    }

    return response
  } catch (error: any) {
    console.error('LeetCode API error:', error)
    throw createError({
      statusCode: 500,
      message: `LeetCode API error: ${error.message}`
    })
  }
})
