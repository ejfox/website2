/**
 * @file changelog.get.ts
 * @description GET /api/changelog?limit=50&since=ISO-date. The site's git log for
 *   pages/changelog from data/changelog.json, generated at build time so no
 *   request shells out to git: { meta, commits: [{ hash, author, email, date,
 *   message, type }], grouped: { byDate, byType }, stats }. limit max 500.
 *   The file is read once and memoized for the life of the process.
 *   Throws 500 if the file is missing.
 */

import { promises as fs } from 'node:fs'
import { join } from 'node:path'

interface RawCommit {
  hash: string
  author: string
  email: string
  timestamp: number
  message: string
}

interface Commit {
  hash: string
  author: string
  email: string
  date: string
  message: string
  type: string
}

interface ChangelogFile {
  generatedAt: string
  commits: RawCommit[]
}

let cached: ChangelogFile | null = null

async function loadChangelog(): Promise<ChangelogFile> {
  if (cached) return cached
  const path = join(process.cwd(), 'data', 'changelog.json')
  const content = await fs.readFile(path, 'utf-8')
  cached = JSON.parse(content) as ChangelogFile
  return cached
}

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const limit = Math.min(Number.parseInt(query.limit as string) || 50, 500)
  const since = query.since as string | undefined
  const sinceTime = since ? Date.parse(since) : null

  let file: ChangelogFile
  try {
    file = await loadChangelog()
  } catch (error) {
    console.error('Failed to read changelog:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to read changelog',
    })
  }

  const commits: Commit[] = file.commits
    .filter((c) =>
      sinceTime
        ? !Number.isNaN(sinceTime) && c.timestamp * 1000 >= sinceTime
        : true
    )
    .slice(0, limit)
    .map((c) => ({
      hash: c.hash.substring(0, 7),
      author: c.author,
      email: c.email,
      date: new Date(c.timestamp * 1000).toISOString(),
      message: c.message,
      type: parseCommitType(c.message),
    }))

  const byDate = commits.reduce((acc: Record<string, Commit[]>, commit) => {
    const date = commit.date.split('T')[0]
    if (!acc[date]) acc[date] = []
    acc[date].push(commit)
    return acc
  }, {})

  const byType = commits.reduce((acc: Record<string, Commit[]>, commit) => {
    if (!acc[commit.type]) acc[commit.type] = []
    acc[commit.type].push(commit)
    return acc
  }, {})

  return {
    meta: {
      endpoint: '/api/changelog',
      timestamp: new Date().toISOString(),
      generatedAt: file.generatedAt,
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
          acc[type] = typeCommits.length
          return acc
        },
        {}
      ),
    },
  }
})

// Conventional-commit prefix if present, else a guess from the first word.
function parseCommitType(message: string): string {
  const match = message.match(/^(\w+)(\(.+\))?:/)
  if (match) return match[1]
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
