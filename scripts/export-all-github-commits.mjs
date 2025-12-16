#!/usr/bin/env node
/**
 * @file export-all-github-commits.mjs
 * @description Export ALL GitHub commits by iterating through each repository (bypasses 1000 result limit)
 * @usage node scripts/export-all-github-commits.mjs
 * @env None required - uses gh CLI and requires github-repos-list.json
 */

/* eslint-disable no-console */

import { execSync } from 'node:child_process'
import { writeFileSync, readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUTPUT_FILE = join(__dirname, '../data/github-commits.json')
const REPOS_FILE = join(__dirname, '../data/github-repos-list.json')
const USERNAME = 'ejfox'

async function fetchRepoCommits(repoName) {
  const commits = []
  let page = 1
  let hasMore = true

  while (hasMore) {
    try {
      const apiCmd =
        `gh api '/repos/${USERNAME}/${repoName}/commits` +
        `?per_page=100&page=${page}&author=${USERNAME}' 2>/dev/null`

      const result = execSync(apiCmd, {
        encoding: 'utf-8',
        maxBuffer: 50 * 1024 * 1024,
      })

      const data = JSON.parse(result)

      if (!Array.isArray(data) || data.length === 0) {
        hasMore = false
        break
      }

      for (const item of data) {
        const date = new Date(item.commit.author.date)
        commits.push({
          sha: item.sha.substring(0, 7),
          message: item.commit.message.split('\n')[0],
          date: item.commit.author.date,
          year: date.getFullYear(),
          month: date.getMonth() + 1,
          day: date.getDate(),
          repo: repoName,
          repoUrl: `https://github.com/${USERNAME}/${repoName}`,
        })
      }

      if (data.length < 100) {
        hasMore = false
      }

      page++

      // Rate limit protection
      await new Promise((r) => setTimeout(r, 100))
    } catch (error) {
      console.error(`  Error on page ${page}: ${error.message}`)
      hasMore = false
    }
  }

  return commits
}

async function main() {
  console.log('GitHub ALL Commits Export')
  console.log('=========================\n')

  // Load repo list
  const repos = JSON.parse(readFileSync(REPOS_FILE, 'utf-8'))
  console.log(`Found ${repos.length} repositories\n`)

  const allCommits = []
  let processed = 0

  for (const repo of repos) {
    processed++
    process.stdout.write(
      `[${processed}/${repos.length}] ${repo.name.padEnd(40)}`
    )

    try {
      const commits = await fetchRepoCommits(repo.name)
      allCommits.push(...commits)
      console.log(`✓ ${commits.length} commits`)
    } catch (error) {
      console.log(`✗ ${error.message}`)
    }
  }

  // Sort by date
  allCommits.sort((a, b) => new Date(b.date) - new Date(a.date))

  // Write to file
  writeFileSync(OUTPUT_FILE, JSON.stringify(allCommits, null, 2))

  // Stats
  const years = [...new Set(allCommits.map((c) => c.year))].sort(
    (a, b) => b - a
  )
  const repos_with_commits = [...new Set(allCommits.map((c) => c.repo))]

  console.log(`\n✅ Exported ${allCommits.length} commits`)
  console.log(`Years: ${years.join(', ')}`)
  console.log(`Repos with commits: ${repos_with_commits.length}`)
  console.log(`Output: ${OUTPUT_FILE}`)
}

main().catch(console.error)
