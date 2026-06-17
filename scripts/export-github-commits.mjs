#!/usr/bin/env node
/**
 * @file export-all-contributions.mjs
 * @description Fetch ALL GitHub contributions using GraphQL API - includes commits to personal, org, and forked repos
 * @usage node scripts/export-all-contributions.mjs
 * @env None required - uses gh CLI which must be authenticated
 */

/* eslint-disable no-console */

import { execSync } from 'node:child_process'
import { writeFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUTPUT_FILE = join(__dirname, '../data/github-commits.json')
const USERNAME = 'ejfox'

function fetchContributionYears() {
  const query = `
    query {
      user(login: "${USERNAME}") {
        contributionsCollection {
          contributionYears
        }
      }
    }
  `

  const result = execSync(`gh api graphql -f query='${query}'`, {
    encoding: 'utf-8',
  })

  return JSON.parse(result).data.user.contributionsCollection.contributionYears
}

function fetchYearContributions(year) {
  const fromDate = `${year}-01-01T00:00:00Z`
  const toDate = `${year}-12-31T23:59:59Z`

  const query = `
    query {
      user(login: "${USERNAME}") {
        contributionsCollection(from: "${fromDate}", to: "${toDate}") {
          commitContributionsByRepository {
            repository {
              name
              owner {
                login
              }
            }
            contributions(first: 100) {
              nodes {
                commitCount
                occurredAt
                commitCount
              }
            }
          }
        }
      }
    }
  `

  try {
    const result = execSync(`gh api graphql -f query='${query}'`, {
      encoding: 'utf-8',
      maxBuffer: 50 * 1024 * 1024,
    })

    const data = JSON.parse(result)
    return data.data.user.contributionsCollection
      .commitContributionsByRepository
  } catch (error) {
    console.error(`  Error fetching ${year}:`, error.message)
    return []
  }
}

async function main() {
  console.log('GitHub ALL Contributions Export')
  console.log('===============================\n')

  const years = fetchContributionYears()
  console.log(`Found contribution years: ${years.join(', ')}\n`)

  const allCommits = []

  for (const year of years) {
    process.stdout.write(`[${year}] Fetching... `)

    const repos = fetchYearContributions(year)
    let yearCommits = 0

    for (const repoData of repos) {
      const repoName = repoData.repository.name
      const repoOwner = repoData.repository.owner.login

      for (const contribution of repoData.contributions.nodes) {
        const date = new Date(contribution.occurredAt)

        // Each contribution can have multiple commits
        for (let i = 0; i < contribution.commitCount; i++) {
          allCommits.push({
            sha: `${date.getTime()}-${i}`,
            message: `Contribution to ${repoName}`,
            date: contribution.occurredAt,
            year: date.getFullYear(),
            month: date.getMonth() + 1,
            day: date.getDate(),
            repo: repoName,
            repoUrl: `https://github.com/${repoOwner}/${repoName}`,
          })
          yearCommits++
        }
      }
    }

    console.log(`✓ ${yearCommits} commits`)

    // Rate limit protection
    await new Promise((r) => setTimeout(r, 1000))
  }

  // Sort by date
  allCommits.sort((a, b) => new Date(b.date) - new Date(a.date))

  // Write to file
  writeFileSync(OUTPUT_FILE, JSON.stringify(allCommits, null, 2))

  console.log(`\n✅ Exported ${allCommits.length} total contributions`)
  console.log(`Output: ${OUTPUT_FILE}`)
}

main().catch(console.error)
