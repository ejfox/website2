/**
 * @file changelog.get.ts
 * @description Generates changelog from git commit history with conventional commit type parsing
 * @endpoint GET /api/changelog
 * @params limit: number - Number of commits (default: 50), since: string - Filter commits after date (e.g., "2024-01-01")
 * @returns Git commits grouped by date and type with stats including commit counts by type
 */

import { exec } from 'node:child_process'
import { promisify } from 'node:util'

const execAsync = promisify(exec)

interface Commit {
  hash: string
  author: string
  email: string
  date: string
  message: string
  type: string
}

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const limit = Number.parseInt(query.limit as string) || 50
  const since = query.since as string // e.g., "2024-01-01"

  try {
    // Build git log command
    let cmd = `git log --pretty=format:'%H|%an|%ae|%at|%s' --no-merges`
    if (since) {
      cmd += ` --since="${since}"`
    }
    cmd += ` -n ${limit}`

    const { stdout } = await execAsync(cmd, {
      cwd: process.cwd(),
    })

    const commits = stdout
      .split('\n')
      .filter((line) => line.trim())
      .map((line) => {
        const [hash, author, email, timestamp, message] = line.split('|')
        return {
          hash: hash.substring(0, 7), // Short hash
          author,
          email,
          date: new Date(Number.parseInt(timestamp) * 1000).toISOString(),
          message,
          // Parse conventional commit types
          type: parseCommitType(message),
        }
      })

    // Group by date
    const byDate = commits.reduce((acc: Record<string, Commit[]>, commit) => {
      const date = commit.date.split('T')[0]
      if (!acc[date]) {
        acc[date] = []
      }
      acc[date].push(commit)
      return acc
    }, {})

    // Group by type
    const byType = commits.reduce((acc: Record<string, Commit[]>, commit) => {
      const type = commit.type
      if (!acc[type]) {
        acc[type] = []
      }
      acc[type].push(commit)
      return acc
    }, {})

    return {
      meta: {
        endpoint: '/api/changelog',
        timestamp: new Date().toISOString(),
        count: commits.length,
        filters: { limit, since },
      },
      commits,
      grouped: {
        byDate,
        byType,
      },
      stats: {
        totalCommits: commits.length,
        dateRange: {
          earliest: commits[commits.length - 1]?.date,
          latest: commits[0]?.date,
        },
        byType: Object.entries(byType).reduce(
          (acc: Record<string, number>, [type, typeCommits]) => {
            acc[type] = (typeCommits as Commit[]).length
            return acc
          },
          {}
        ),
      },
    }
  } catch (error) {
    const err = error as Error
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to read git log',
      message: err.message,
    })
  }
})

function parseCommitType(message: string): string {
  // Parse conventional commits: feat:, fix:, docs:, etc.
  const match = message.match(/^(\w+)(\(.+\))?:/)
  if (match) {
    return match[1]
  }

  // Fallback heuristics
  if (message.match(/^(add|create|new)/i)) return 'feat'
  if (message.match(/^(fix|bug|patch)/i)) return 'fix'
  if (message.match(/^(update|change|modify)/i)) return 'chore'
  if (message.match(/^(remove|delete)/i)) return 'remove'
  if (message.match(/^(refactor|clean)/i)) return 'refactor'
  if (message.match(/^(doc|readme)/i)) return 'docs'
  if (message.match(/^(style|format)/i)) return 'style'
  if (message.match(/^(test|spec)/i)) return 'test'

  return 'other'
}
