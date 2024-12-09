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

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const token = config.githubToken || config.public.GITHUB_TOKEN

  if (!token) {
    throw createError({
      statusCode: 401,
      message: 'GitHub token not configured'
    })
  }

  // Return mock data if something goes wrong
  const fallbackData = {
    languages: [],
    stats: {
      totalRepos: 0,
      totalPRs: 0,
      mergedPRs: 0,
      followers: 0,
      following: 0,
      totalLinesChanged: 0,
      totalFilesChanged: 0
    },
    repositories: [],
    mergedPRs: [],
    contributions: [],
    dates: [],
    currentStreak: 0,
    longestStreak: 0,
    totalContributions: 0
  }

  try {
    const response = await $fetch<{ data: { viewer: GitHubViewer } }>(
      'https://api.github.com/graphql',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: {
          query: `
          query {
            viewer {
              followers { totalCount }
              following { totalCount }
              contributionsCollection(from: "${new Date(
                Date.now() - 365 * 24 * 60 * 60 * 1000
              ).toISOString()}", to: "${new Date().toISOString()}") {
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
              repositories(first: 100, orderBy: {field: STARGAZERS, direction: DESC}, privacy: PUBLIC) {
                nodes {
                  name
                  description
                  stargazerCount
                  forkCount
                  primaryLanguage {
                    name
                    color
                  }
                }
              }
            }
          }
        `
        }
      }
    )

    if (!response?.data?.viewer) return fallbackData

    const viewer = response.data.viewer
    const contributions =
      viewer.contributionsCollection.contributionCalendar.weeks
        .flatMap((week) => week.contributionDays)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

    return {
      languages: [], // Simplified since we removed language query
      stats: {
        totalRepos: viewer.repositories.nodes.length,
        totalPRs: 0, // Simplified since we removed PR query
        mergedPRs: 0,
        followers: viewer.followers.totalCount,
        following: viewer.following.totalCount,
        totalLinesChanged: 0,
        totalFilesChanged: 0
      },
      repositories: viewer.repositories.nodes.map((repo) => ({
        name: repo.name,
        description: repo.description,
        stars: repo.stargazerCount,
        forks: repo.forkCount,
        primaryLanguage: repo.primaryLanguage
      })),
      mergedPRs: [], // Simplified since we removed PR query
      contributions: contributions.map((day) => day.contributionCount),
      dates: contributions.map((day) => day.date),
      currentStreak: calculateStreak(contributions),
      longestStreak: calculateLongestStreak(contributions),
      totalContributions:
        viewer.contributionsCollection.contributionCalendar.totalContributions
    }
  } catch (error) {
    console.error('GitHub API error:', error)
    return fallbackData
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
