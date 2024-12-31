/* eslint-disable @typescript-eslint/no-explicit-any */

import { defineEventHandler, createError } from 'h3'

interface GitHubContribution {
  contributionCount: number
  date: string
}

interface GitHubCommit {
  message: string
  committedDate: string
}

interface GitHubStats {
  languages: Array<{
    name: string
    color: string
    size: number
    count: number
  }>
  stats: {
    totalRepos: number
    totalPRs: number
    mergedPRs: number
    followers: number
    following: number
    totalLinesChanged: number
    totalFilesChanged: number
  }
  repositories: Array<{
    name: string
    description: string
    stars: number
    forks: number
    primaryLanguage?: {
      name: string
      color: string
    }
  }>
  mergedPRs: Array<{
    title: string
    mergedAt: string
    additions: number
    deletions: number
    repository: string
  }>
  contributions: number[]
  dates: string[]
  currentStreak: number
  longestStreak: number
  totalContributions: number
}

interface GitHubWeek {
  contributionDays: GitHubContribution[]
}

interface GitHubLanguageNode {
  name: string
  color: string
}

interface GitHubLanguageEdge {
  size: number
  node: GitHubLanguageNode
}

interface GitHubRepository {
  name: string
  description: string
  stargazerCount: number
  forkCount: number
  primaryLanguage?: {
    name: string
    color: string
  }
  languages?: {
    edges: GitHubLanguageEdge[]
  }
}

interface GitHubPullRequest {
  title: string
  mergedAt: string
  additions: number
  deletions: number
  repository: {
    name: string
  }
}

interface GitHubViewer {
  followers: {
    totalCount: number
  }
  following: {
    totalCount: number
  }
  contributionsCollection: {
    contributionCalendar: {
      totalContributions: number
      weeks: GitHubWeek[]
    }
  }
  repositories: {
    nodes: GitHubRepository[]
  }
  pullRequests: {
    nodes: GitHubPullRequest[]
    totalCount: number
  }
}

async function makeRequest(query: string) {
  const config = useRuntimeConfig()
  const token = config.githubToken || config.GITHUB_TOKEN

  if (!token) {
    console.error('No GitHub token found')
    throw createError({
      statusCode: 500,
      message: 'GitHub token not configured'
    })
  }

  console.log('Using GitHub token:', token.slice(0, 4) + '...')

  const response = await $fetch<{ data: { viewer: GitHubViewer } }>(
    'https://api.github.com/graphql',
    {
      method: 'POST',
      headers: {
        Authorization: `bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: {
        query: `
          query {
            viewer {
              login
              repositories(first: 10, privacy: PUBLIC) {
                nodes {
                  name
                }
              }
            }
          }
        `
      }
    }
  )

  console.log('GitHub API response:', JSON.stringify(response, null, 2))

  if (!response?.data?.viewer) {
    console.error('Invalid GitHub response:', response)
    throw createError({
      statusCode: 500,
      message: 'Invalid GitHub API response'
    })
  }

  return response.data.viewer
}

async function fetchAllRepositories(token: string) {
  let hasNextPage = true
  let endCursor: string | null = null
  let allRepositories: any[] = []

  while (hasNextPage) {
    const paginatedQuery = `
      query {
        viewer {
          repositories(first: 100, privacy: PUBLIC, orderBy: {field: CREATED_AT, direction: DESC}, after: ${
            endCursor ? `"${endCursor}"` : 'null'
          }) {
            pageInfo {
              hasNextPage
              endCursor
            }
            nodes {
              name
              description
              stargazerCount
              forkCount
              primaryLanguage {
                name
                color
              }
              updatedAt
              createdAt
            }
          }
        }
      }
    `

    const response = await $fetch<any>('https://api.github.com/graphql', {
      method: 'POST',
      headers: {
        Authorization: `bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: { query: paginatedQuery }
    })

    const repos = response.data.viewer.repositories
    allRepositories = [...allRepositories, ...repos.nodes]
    hasNextPage = repos.pageInfo.hasNextPage
    endCursor = repos.pageInfo.endCursor
  }

  return allRepositories
}

export default defineEventHandler(async (event) => {
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

    // Fetch all data in parallel
    const [basicData, allRepositories] = await Promise.all([
      $fetch<any>('https://api.github.com/graphql', {
        method: 'POST',
        headers: {
          Authorization: `bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: { query }
      }),
      fetchAllRepositories(token)
    ])

    const viewer = basicData.data.viewer
    const contributions =
      viewer.contributionsCollection.contributionCalendar.weeks
        .flatMap((week) => week.contributionDays)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

    return {
      stats: {
        totalRepos: allRepositories.length,
        totalPRs: viewer.pullRequests.totalCount,
        mergedPRs: viewer.pullRequests.nodes.filter((pr) => pr?.mergedAt)
          .length,
        followers: viewer.followers.totalCount,
        following: viewer.following.totalCount,
        totalLinesChanged: viewer.pullRequests.nodes.reduce(
          (sum, pr) => sum + (pr?.additions || 0) + (pr?.deletions || 0),
          0
        ),
        totalFilesChanged: 0
      },
      repositories: allRepositories.map((repo) => ({
        name: repo.name,
        description: repo.description || '',
        stars: repo.stargazerCount,
        forks: repo.forkCount,
        primaryLanguage: repo.primaryLanguage,
        updatedAt: repo.updatedAt,
        createdAt: repo.createdAt
      })),
      contributions: contributions.map((day) => day.contributionCount),
      dates: contributions.map((day) => day.date),
      currentStreak: calculateStreak(contributions),
      longestStreak: calculateLongestStreak(contributions),
      totalContributions:
        viewer.contributionsCollection.contributionCalendar.totalContributions
    }
  } catch (error: any) {
    console.error('GitHub API error:', error.message)
    throw createError({
      statusCode: 500,
      message: `GitHub API error: ${error.message}`
    })
  }
})

function calculateLongestStreak(contributions: GitHubContribution[]): number {
  let longestStreak = 0
  let currentStreak = 0

  for (const contribution of contributions) {
    if (contribution.contributionCount > 0) {
      currentStreak++
      longestStreak = Math.max(longestStreak, currentStreak)
    } else {
      currentStreak = 0
    }
  }

  return longestStreak
}

function calculateStreak(contributions: GitHubContribution[]): number {
  let streak = 0
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  for (let i = contributions.length - 1; i >= 0; i--) {
    const contribution = contributions[i]
    const date = new Date(contribution.date)
    date.setHours(0, 0, 0, 0)

    // Break if we find a day with no contributions
    if (contribution.contributionCount === 0) {
      break
    }

    // Break if there's a gap in dates
    if (i < contributions.length - 1) {
      const nextDate = new Date(contributions[i + 1].date)
      nextDate.setHours(0, 0, 0, 0)
      const diffDays = Math.floor(
        (nextDate.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
      )
      if (diffDays > 1) {
        break
      }
    }

    streak++
  }

  return streak
}
