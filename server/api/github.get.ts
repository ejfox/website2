import { defineEventHandler, createError } from 'h3'

interface GitHubStats {
  stats: {
    totalRepos: number
    totalContributions: number
    followers: number
    following: number
  }
  contributions: number[]
  dates: string[]
}

const query = `
  query {
    viewer {
      followers {
        totalCount
      }
      following {
        totalCount
      }
      contributionsCollection {
        contributionCalendar {
          totalContributions
          weeks {
            contributionDays {
              contributionCount
              date
            }
          }
        }
      }
      repositories(first: 100, privacy: PUBLIC) {
        totalCount
      }
    }
  }
`

export default defineEventHandler(async (event): Promise<GitHubStats> => {
  try {
    const config = useRuntimeConfig()
    const token = config.githubToken || config.GITHUB_TOKEN

    if (!token) {
      console.error('No GitHub token found')
      throw createError({
        statusCode: 500,
        message: 'GitHub token not configured'
      })
    }

    const response = await $fetch<any>('https://api.github.com/graphql', {
      method: 'POST',
      headers: {
        Authorization: `bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: { query }
    })

    const viewer = response.data.viewer
    const contributions =
      viewer.contributionsCollection.contributionCalendar.weeks
        .flatMap((week: any) => week.contributionDays)
        .sort(
          (a: any, b: any) =>
            new Date(a.date).getTime() - new Date(b.date).getTime()
        )

    return {
      stats: {
        totalRepos: viewer.repositories.totalCount,
        totalContributions:
          viewer.contributionsCollection.contributionCalendar
            .totalContributions,
        followers: viewer.followers.totalCount,
        following: viewer.following.totalCount
      },
      contributions: contributions.map((day: any) => day.contributionCount),
      dates: contributions.map((day: any) => day.date)
    }
  } catch (error: any) {
    console.error('GitHub API error details:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || 'Failed to fetch GitHub data'
    })
  }
})
