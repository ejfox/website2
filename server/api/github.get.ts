/**
 * @file github.get.ts
 * @description Fetches GitHub user statistics including contributions, repositories, followers, and recent commits with conventional commit type parsing
 * @endpoint GET /api/github
 * @returns GitHubStats with user stats, contribution history, commit details, and commit type distribution
 */
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
      totalCommitContributions: number
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

interface GitHubGraphQLResponse<T> {
  data: T
  errors?: Array<{ message: string }>
}

interface RateLimitResponse {
  rateLimit?: {
    remaining: number
    resetAt: string
  }
}

async function makeGitHubRequest<T>(
  token: string,
  query: string,
  variables?: Record<string, unknown>
): Promise<T> {
  const maxRetries = 3
  const timeout = 10000 // 10 seconds
  let attempt = 0

  while (attempt < maxRetries) {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), timeout)

      const response = await $fetch<GitHubGraphQLResponse<T>>(
        'https://api.github.com/graphql',
        {
          method: 'POST',
          headers: {
            Authorization: `bearer ${token}`,
            'Content-Type': 'application/json',
            'User-Agent': 'EJFox-Website/1.0',
          },
          body: { query, variables },
          signal: controller.signal,
        }
      )

      clearTimeout(timeoutId)

      if (response.errors) {
        throw createError({
          statusCode: 500,
          message: `GitHub API Error: ${
            response.errors[0]?.message || 'Unknown error'
          }`,
        })
      }

      return response.data
    } catch (error) {
      attempt++
      const err = error as Error

      if (err.name === 'AbortError') {
        console.warn(`GitHub request timeout, attempt ${attempt}/${maxRetries}`)
      } else {
        console.error(
          `Error making GitHub request, attempt ${attempt}/${maxRetries}:`,
          error
        )
      }

      if (attempt === maxRetries) {
        throw error
      }

      // Exponential backoff with jitter
      const backoffTime = Math.min(
        1000 * Math.pow(2, attempt) + Math.random() * 1000,
        10000
      )
      await new Promise((resolve) => setTimeout(resolve, backoffTime))
    }
  }

  throw new Error('Should not reach here')
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

  return makeGitHubRequest<GitHubUserStats>(token, query)
}

async function fetchContributions(
  token: string,
  lastMonth: string,
  today: string
): Promise<GitHubContributions> {
  const query = `query($lastMonth: DateTime!, $today: DateTime!) {
    viewer {
      contributionsCollection(from: $lastMonth, to: $today) {
        totalCommitContributions
        commitContributionsByRepository(maxRepositories: 100) {
          repository {
            name
            url
            isPrivate
            defaultBranchRef {
              target {
                ... on Commit {
                  history(first: 15) {
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

  return makeGitHubRequest<GitHubContributions>(token, query, {
    lastMonth,
    today,
  })
}

async function checkRateLimit(token: string) {
  const query = `query {
    rateLimit {
      remaining
      resetAt
    }
  }`

  const response = await makeGitHubRequest<RateLimitResponse>(token, query)

  if (response.rateLimit?.remaining === 0) {
    throw createError({
      statusCode: 429,
      message:
        'GitHub API rate limit exceeded. Resets at ' +
        `${response.rateLimit.resetAt}`,
    })
  }
}

export default defineEventHandler(async (): Promise<GitHubStats> => {
  // console.log('🚀 GitHub handler called')
  const config = useRuntimeConfig()

  // Add more detailed logging
  // console.log('Runtime config keys:', Object.keys(config))
  // console.log('githubToken value type:', typeof config.githubToken)
  // console.log('GITHUB_TOKEN value type:', typeof config.GITHUB_TOKEN)
  // console.log('githubToken length:', config.githubToken?.length)
  // console.log('GITHUB_TOKEN length:', config.GITHUB_TOKEN?.length)

  // Get token and handle potential whitespace issues
  let token = (config.githubToken || config.GITHUB_TOKEN) as string

  // Check if we have the placeholder token instead of the real one
  if (token === 'your_token_here') {
    console.warn(
      '⚠️ Detected placeholder token - this suggests .env is not being loaded correctly'
    )
    // Log all available environment variables for debugging (excluding values)
    // console.log('Available env vars:', Object.keys(process.env))
    // Try loading directly from process.env as a fallback
    const directEnvToken = process.env.GITHUB_TOKEN
    if (directEnvToken && directEnvToken !== 'your_token_here') {
      // console.log('Found token directly in process.env, using that instead')
      token = directEnvToken
    }
  }

  // Very important: Check if there are any whitespace issues with the token
  if (token) {
    const trimmedToken = token.trim()
    if (trimmedToken !== token) {
      console.warn('⚠️ GitHub token contains whitespace! Trimming...')
      token = trimmedToken
    }

    // Check if token has the correct prefix
    if (!token.startsWith('ghp_')) {
      console.warn('⚠️ GitHub token does not start with expected prefix "ghp_"')
    }
  }

  // console.log('🔑 GitHub token available:', !!token)
  // console.log('🔑 GitHub token length:', token?.length)
  // console.log('🔑 GitHub token first 10 chars:', token?.substring(0, 10))

  if (!token) {
    console.error('❌ No GitHub token found!')
    throw createError({
      statusCode: 500,
      message: 'GitHub token not configured',
    })
  }

  try {
    await checkRateLimit(token)
    // console.log('✅ Rate limit check passed')

    const today = new Date()
    const lastMonth = new Date(today)
    lastMonth.setDate(lastMonth.getDate() - 30)

    const results = await Promise.allSettled([
      fetchUserStats(token),
      fetchContributions(token, lastMonth.toISOString(), today.toISOString()),
    ])

    const userStats =
      results[0].status === 'fulfilled' ? results[0].value : null
    const contributions =
      results[1].status === 'fulfilled' ? results[1].value : null

    // console.log('📊 GitHub API responses:', {
    //   userStats: !!userStats,
    //   contributions: !!contributions
    // })

    if (!userStats?.viewer || !contributions?.viewer) {
      throw createError({
        statusCode: 500,
        message: 'Invalid response from GitHub API',
      })
    }

    const contributionCollection = contributions.viewer.contributionsCollection
    type ContribRepos =
      typeof contributionCollection.commitContributionsByRepository
    type RepoContribution = ContribRepos[number] & {
      repository: { isPrivate?: boolean }
    }
    const repoList = contributionCollection.commitContributionsByRepository
    const commits = (repoList as RepoContribution[])
      .filter((repo) => !repo.repository.isPrivate)
      .flatMap((repo) => {
        const branch = repo.repository.defaultBranchRef
        const nodes = branch?.target?.history?.nodes
        if (!nodes) {
          return []
        }

        return repo.repository.defaultBranchRef.target.history.nodes
          .filter((commit) => commit)
          .map((commit) => {
            const message = commit.message || ''
            const types =
              'feat|fix|docs|style|refactor|test|chore|' +
              'build|ci|perf|revert|blog|scaffold'
            const match = message.match(new RegExp(`^(${types})(\\(.+?\\))?:`))

            return {
              repository: {
                name: repo.repository.name,
                url: repo.repository.url,
              },
              message,
              occurredAt: commit.committedDate,
              url: commit.url,
              type: match?.[1] || 'other',
            }
          })
      })
      .filter(Boolean)

    const typeCount = commits.reduce(
      (acc, commit) => {
        acc[commit.type] = (acc[commit.type] || 0) + 1
        return acc
      },
      {} as Record<string, number>
    )

    const total = Object.values(typeCount).reduce(
      (sum, count) => sum + count,
      0
    )
    const commitTypes = Object.entries(typeCount)
      .map(([type, count]) => ({
        type,
        count,
        percentage: (count / total) * 100,
      }))
      .sort((a, b) => b.count - a.count)

    // console.log('GitHub API Response:', {
    //   userStats,
    //   contributions,
    //   commits,
    //   commitTypes
    // })

    const baseStats: GitHubStats = {
      stats: {
        totalRepos: userStats.viewer.repositories.totalCount || 0,
        totalContributions:
          contributions.viewer.contributionsCollection
            .totalCommitContributions || 0,
        followers: userStats.viewer.followers.totalCount || 0,
        following: userStats.viewer.following.totalCount || 0,
      },
      contributions: [],
      dates: [],
      detail: {
        commits: commits || [],
        commitTypes: commitTypes || [],
      },
    }

    return baseStats
  } catch (error) {
    const gitHubError = error as GitHubError
    console.error('GitHub API Error:', gitHubError)

    // Add specific guidance for 401 Unauthorized errors
    if (gitHubError.statusCode === 401) {
      console.error(
        'GitHub token invalid or expired. Regenerate with scopes: repo, read:user, user:email.'
      )
    }

    throw createError({
      statusCode: gitHubError.statusCode || 500,
      statusMessage:
        gitHubError.response?.errors?.[0]?.message ||
        gitHubError.message ||
        'Failed to fetch GitHub data',
    })
  }
})
