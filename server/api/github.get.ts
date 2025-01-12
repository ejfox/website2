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
  detail: {
    commits: Array<{
      repository: {
        name: string
        url: string
      }
      message: string
      occurredAt: string
      url: string
      type: string
    }>
    commitTypes: Array<{
      type: string
      count: number
      percentage: number
    }>
  }
}

interface GitHubUserStats {
  viewer: {
    followers: {
      totalCount: number
    }
    following: {
      totalCount: number
    }
    repositories: {
      totalCount: number
    }
  }
}

interface GitHubContributions {
  viewer: {
    contributionsCollection: {
      commitContributionsByRepository: Array<{
        repository: {
          name: string
          url: string
          defaultBranchRef: {
            target: {
              history: {
                nodes: Array<{
                  message: string
                  committedDate: string
                  url: string
                }>
              }
            }
          }
        }
      }>
    }
  }
}

interface GitHubError extends Error {
  statusCode?: number
  response?: {
    errors?: Array<{
      message: string
      type: string
    }>
  }
}

async function fetchUserStats(token: string): Promise<GitHubUserStats> {
  const query = `query {
    viewer {
      followers {
        totalCount
      }
      following {
        totalCount
      }
      repositories(first: 100, privacy: PUBLIC) {
        totalCount
      }
    }
  }`

  const response = await $fetch<any>('https://api.github.com/graphql', {
    method: 'POST',
    headers: {
      Authorization: `bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: { query }
  })

  if (response.errors) {
    throw createError({
      statusCode: 500,
      message: `GitHub API Error: ${
        response.errors[0]?.message || 'Unknown error'
      }`
    })
  }

  return response.data
}

async function fetchContributions(
  token: string,
  lastWeek: string,
  today: string
): Promise<GitHubContributions> {
  const query = `query($lastWeek: DateTime!, $today: DateTime!) {
    viewer {
      contributionsCollection(from: $lastWeek, to: $today) {
        totalCommitContributions
        commitContributionsByRepository {
          repository {
            name
            url
            defaultBranchRef {
              target {
                ... on Commit {
                  history(first: 100) {
                    nodes {
                      message
                      committedDate
                      url
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }`

  const response = await $fetch<any>('https://api.github.com/graphql', {
    method: 'POST',
    headers: {
      Authorization: `bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: { query, variables: { lastWeek, today } }
  })

  if (response.errors) {
    throw createError({
      statusCode: 500,
      message: `GitHub API Error: ${
        response.errors[0]?.message || 'Unknown error'
      }`
    })
  }

  return response.data
}

async function checkRateLimit(token: string) {
  const query = `query {
    rateLimit {
      remaining
      resetAt
    }
  }`

  const response = await $fetch<any>('https://api.github.com/graphql', {
    method: 'POST',
    headers: {
      Authorization: `bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: { query }
  })

  if (response.data?.rateLimit?.remaining === 0) {
    throw createError({
      statusCode: 429,
      message: `GitHub API rate limit exceeded. Resets at ${response.data.rateLimit.resetAt}`
    })
  }
}

export default defineEventHandler(async (event): Promise<GitHubStats> => {
  console.log('🚀 GitHub handler called')
  const config = useRuntimeConfig()
  const token = config.githubToken || config.GITHUB_TOKEN

  console.log('🔑 GitHub token available:', !!token)

  if (!token) {
    console.error('❌ No GitHub token found!')
    throw createError({
      statusCode: 500,
      message: 'GitHub token not configured'
    })
  }

  try {
    await checkRateLimit(token)
    console.log('✅ Rate limit check passed')

    const today = new Date()
    const lastWeek = new Date(today)
    lastWeek.setDate(lastWeek.getDate() - 7)

    const [userStats, contributions] = await Promise.all([
      fetchUserStats(token),
      fetchContributions(token, lastWeek.toISOString(), today.toISOString())
    ])

    console.log('📊 GitHub API responses:', {
      userStats: !!userStats,
      contributions: !!contributions
    })

    if (!userStats?.viewer || !contributions?.viewer) {
      throw createError({
        statusCode: 500,
        message: 'Invalid response from GitHub API'
      })
    }

    const commits =
      contributions.viewer.contributionsCollection.commitContributionsByRepository
        .flatMap((repo) => {
          if (!repo.repository.defaultBranchRef?.target?.history?.nodes) {
            return []
          }

          return repo.repository.defaultBranchRef.target.history.nodes
            .filter((commit) => commit)
            .map((commit) => {
              const message = commit.message || ''
              const match = message.match(
                /^(feat|fix|docs|style|refactor|test|chore|build|ci|perf|revert|blog|scaffold)(\(.+?\))?:/
              )

              return {
                repository: {
                  name: repo.repository.name,
                  url: repo.repository.url
                },
                message,
                occurredAt: commit.committedDate,
                url: commit.url,
                type: match?.[1] || 'other'
              }
            })
        })
        .filter(Boolean)

    const typeCount = commits.reduce((acc, commit) => {
      acc[commit.type] = (acc[commit.type] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const total = Object.values(typeCount).reduce(
      (sum, count) => sum + count,
      0
    )
    const commitTypes = Object.entries(typeCount)
      .map(([type, count]) => ({
        type,
        count,
        percentage: (count / total) * 100
      }))
      .sort((a, b) => b.count - a.count)

    console.log('GitHub API Response:', {
      userStats,
      contributions,
      commits,
      commitTypes
    })

    const baseStats: GitHubStats = {
      stats: {
        totalRepos: userStats.viewer.repositories.totalCount || 0,
        totalContributions:
          contributions.viewer.contributionsCollection
            .totalCommitContributions || 0,
        followers: userStats.viewer.followers.totalCount || 0,
        following: userStats.viewer.following.totalCount || 0
      },
      contributions: [],
      dates: [],
      detail: {
        commits: commits || [],
        commitTypes: commitTypes || []
      }
    }

    return baseStats
  } catch (error) {
    const gitHubError = error as GitHubError
    console.error('GitHub API Error:', gitHubError)

    throw createError({
      statusCode: gitHubError.statusCode || 500,
      message:
        gitHubError.response?.errors?.[0]?.message ||
        gitHubError.message ||
        'Failed to fetch GitHub data'
    })
  }
})
