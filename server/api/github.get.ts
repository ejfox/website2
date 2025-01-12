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
  detail?: {
    commits?: {
      repository: {
        name: string
        url: string
      }
      message: string
      occurredAt: string
      url: string
    }[]
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
        }
        contributions: {
          nodes: Array<{
            commitCount: number
            repository: {
              name: string
              url: string
            }
            commit: {
              message: string
              committedDate: string
              url: string
            }
          }>
        }
      }>
    }
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
      message: `GitHub API Error: ${response.errors[0]?.message || 'Unknown error'}`
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
        commitContributionsByRepository {
          repository {
            name
            url
          }
          contributions(first: 100) {
            nodes {
              ... on CommitContribution {
                commitCount
                repository {
                  name
                  url
                }
                commit {
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
      message: `GitHub API Error: ${response.errors[0]?.message || 'Unknown error'}`
    })
  }

  return response.data
}

export default defineEventHandler(async (event): Promise<GitHubStats> => {
  const config = useRuntimeConfig()
  const token = config.githubToken || config.GITHUB_TOKEN

  if (!token) {
    throw createError({
      statusCode: 500,
      message: 'GitHub token not configured'
    })
  }

  try {
    const today = new Date()
    const lastWeek = new Date(today)
    lastWeek.setDate(lastWeek.getDate() - 7)

    const [userStats, contributions] = await Promise.all([
      fetchUserStats(token),
      fetchContributions(token, lastWeek.toISOString(), today.toISOString())
    ])

    if (!userStats?.viewer || !contributions?.viewer) {
      throw createError({
        statusCode: 500,
        message: 'Invalid response from GitHub API'
      })
    }

    const baseStats: GitHubStats = {
      stats: {
        totalRepos: userStats.viewer.repositories.totalCount || 0,
        totalContributions: 0,
        followers: userStats.viewer.followers.totalCount || 0,
        following: userStats.viewer.following.totalCount || 0
      },
      contributions: [],
      dates: [],
      detail: {
        commits: contributions.viewer.contributionsCollection
          .commitContributionsByRepository.flatMap((repo) =>
            repo.contributions.nodes.map((node) => ({
              repository: {
                name: node.repository.name,
                url: node.repository.url
              },
              message: node.commit.message,
              occurredAt: node.commit.committedDate,
              url: node.commit.url
            }))
          )
      }
    }

    return baseStats
  } catch (error) {
    console.error('GitHub API Error:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || 'Failed to fetch GitHub data'
    })
  }
})
