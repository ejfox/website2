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
    recentActivity?: {
      commits: {
        repository: {
          name: string
          description: string | null
          url: string
          primaryLanguage?: {
            name: string
            color: string
          }
        }
        totalCount: number
      }[]
      pullRequests: {
        title: string
        url: string
        state: string
        createdAt: string
        closedAt?: string
        merged: boolean
        mergedAt?: string
        additions: number
        deletions: number
        changedFiles: number
        repository: {
          name: string
          url: string
        }
      }[]
    }
  }
}

const baseQuery = `
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

const detailedQuery = `
  query($lastWeek: DateTime!, $today: DateTime!) {
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
      contributionsCollection(from: $lastWeek, to: $today) {
        contributionCalendar {
          totalContributions
          weeks {
            contributionDays {
              contributionCount
              date
            }
          }
        }
        commitContributionsByRepository {
          repository {
            name
            description
            url
            primaryLanguage {
              name
              color
            }
          }
          contributions {
            totalCount
          }
        }
        pullRequestContributions(first: 100) {
          nodes {
            pullRequest {
              title
              url
              state
              createdAt
              closedAt
              merged
              mergedAt
              additions
              deletions
              changedFiles
              repository {
                name
                url
              }
            }
          }
        }
      }
    }
  }
`

export default defineEventHandler(async (event): Promise<GitHubStats> => {
  try {
    const config = useRuntimeConfig()
    const token = config.githubToken || config.GITHUB_TOKEN
    const query = getQuery(event)
    const isDetailedView = query.detail === 'full'

    if (!token) {
      console.error('No GitHub token found in runtime config')
      throw createError({
        statusCode: 500,
        message: 'GitHub token not configured'
      })
    }

    // Calculate date range for detailed view
    const today = new Date()
    const lastWeek = new Date(today)
    lastWeek.setDate(lastWeek.getDate() - 7)

    const requestBody = isDetailedView
      ? {
          query: detailedQuery,
          variables: {
            lastWeek: lastWeek.toISOString(),
            today: today.toISOString()
          }
        }
      : { query: baseQuery }

    console.log('GitHub API Request:', {
      url: 'https://api.github.com/graphql',
      token: token ? 'present' : 'missing',
      isDetailedView,
      hasVariables: !!requestBody.variables,
      queryLength: requestBody.query.length
    })

    const response = await $fetch<any>('https://api.github.com/graphql', {
      method: 'POST',
      headers: {
        Authorization: `bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: requestBody
    })

    console.log('GitHub API Response:', {
      hasData: !!response?.data,
      hasViewer: !!response?.data?.viewer,
      errors: response?.errors
    })

    if (!response?.data?.viewer) {
      console.error('Invalid GitHub API response:', response)
      throw createError({
        statusCode: 500,
        message: 'Invalid GitHub API response',
        cause: response?.errors || 'No viewer data returned'
      })
    }

    const viewer = response.data.viewer
    const contributions =
      viewer.contributionsCollection.contributionCalendar.weeks
        .flatMap((week: any) => week.contributionDays)
        .sort(
          (a: any, b: any) =>
            new Date(a.date).getTime() - new Date(b.date).getTime()
        )

    const baseStats: GitHubStats = {
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

    // Add detailed stats if requested
    if (isDetailedView && viewer.contributionsCollection) {
      const recentContributions = viewer.contributionsCollection

      baseStats.detail = {
        recentActivity: {
          commits: recentContributions.commitContributionsByRepository.map(
            (repo: any) => ({
              repository: {
                name: repo.repository.name,
                description: repo.repository.description,
                url: repo.repository.url,
                primaryLanguage: repo.repository.primaryLanguage
              },
              totalCount: repo.contributions.totalCount
            })
          ),
          pullRequests: recentContributions.pullRequestContributions.nodes.map(
            (node: any) => ({
              title: node.pullRequest.title,
              url: node.pullRequest.url,
              state: node.pullRequest.state,
              createdAt: node.pullRequest.createdAt,
              closedAt: node.pullRequest.closedAt,
              merged: node.pullRequest.merged,
              mergedAt: node.pullRequest.mergedAt,
              additions: node.pullRequest.additions,
              deletions: node.pullRequest.deletions,
              changedFiles: node.pullRequest.changedFiles,
              repository: {
                name: node.pullRequest.repository.name,
                url: node.pullRequest.repository.url
              }
            })
          )
        }
      }
    }

    return baseStats
  } catch (error: any) {
    console.error('GitHub API error details:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || 'Failed to fetch GitHub data'
    })
  }
})
