#!/usr/bin/env node
/**
 * Export GitHub commits to JSON for on-this-day feature
 * Uses GitHub Search API to fetch all commits by author
 *
 * Usage: node scripts/export-github-commits.mjs
 */

import { execSync } from 'node:child_process'
import { writeFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUTPUT_FILE = join(__dirname, '../data/github-commits.json')
const USERNAME = 'ejfox'
const PER_PAGE = 100

async function fetchCommits() {
  const allCommits = []
  let page = 1
  let hasMore = true

  console.log(`Fetching commits for ${USERNAME}...`)

  while (hasMore) {
    try {
      const apiCmd =
        "gh api '/search/commits?q=author:" +
        `${USERNAME}` +
        `&per_page=${PER_PAGE}&page=${page}` +
        "&sort=author-date&order=desc' 2>/dev/null"

      const result = execSync(apiCmd, {
        encoding: 'utf-8',
        maxBuffer: 50 * 1024 * 1024,
      })

      const data = JSON.parse(result)
      const commits = data.items || []

      if (commits.length === 0) {
        hasMore = false
        break
      }

      for (const item of commits) {
        const date = new Date(item.commit.author.date)
        allCommits.push({
          sha: item.sha.substring(0, 7),
          message: item.commit.message.split('\n')[0], // First line only
          date: item.commit.author.date,
          year: date.getFullYear(),
          month: date.getMonth() + 1,
          day: date.getDate(),
          repo: item.repository.name,
          repoUrl: item.repository.html_url,
        })
      }

      const pageMsg = `  Page ${page}: ${commits.length} commits`
      console.log(`${pageMsg} (total: ${allCommits.length})`)

      // GitHub Search API has 1000 result limit
      if (allCommits.length >= 1000 || commits.length < PER_PAGE) {
        hasMore = false
      }

      page++

      // Rate limit: 30 requests per minute for search API
      await new Promise((r) => setTimeout(r, 2500))
    } catch (error) {
      console.error(`Error on page ${page}:`, error.message)
      hasMore = false
    }
  }

  return allCommits
}

async function main() {
  console.log('GitHub Commit Export')
  console.log('====================\n')

  const commits = await fetchCommits()

  // Sort by date
  commits.sort((a, b) => new Date(b.date) - new Date(a.date))

  // Write to file
  writeFileSync(OUTPUT_FILE, JSON.stringify(commits, null, 2))

  // Stats
  const years = [...new Set(commits.map((c) => c.year))].sort((a, b) => b - a)
  const repos = [...new Set(commits.map((c) => c.repo))]

  console.log(`\nExported ${commits.length} commits`)
  console.log(`Years: ${years.join(', ')}`)
  console.log(`Repos: ${repos.length}`)
  console.log(`Output: ${OUTPUT_FILE}`)
}

main().catch(console.error)
