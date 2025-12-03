#!/usr/bin/env node
/**
 * Export GitHub repositories to JSON for /github/[repo] pages
 * Fetches all public repos, processes READMEs, generates static data
 *
 * Usage: node scripts/export-github-repos.mjs
 */

import { writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkGfm from 'remark-gfm'
import remarkRehype from 'remark-rehype'
import rehypeRaw from 'rehype-raw'
import rehypeStringify from 'rehype-stringify'
import rehypeSlug from 'rehype-slug'
import dotenv from 'dotenv'

dotenv.config()

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUTPUT_DIR = join(__dirname, '../data/github-repos')
const INDEX_FILE = join(__dirname, '../data/github-repos-index.json')

const GITHUB_TOKEN = process.env.GITHUB_TOKEN || process.env.githubToken
const GITHUB_OWNER = 'ejfox'

if (!GITHUB_TOKEN) {
  console.error('Error: GITHUB_TOKEN environment variable is required')
  process.exit(1)
}

// Ensure output directory exists
if (!existsSync(OUTPUT_DIR)) {
  mkdirSync(OUTPUT_DIR, { recursive: true })
}

// Markdown processor for READMEs
const markdownProcessor = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkRehype, { allowDangerousHtml: true })
  .use(rehypeRaw)
  .use(rehypeSlug)
  .use(rehypeStringify, { allowDangerousHtml: true })

async function makeGitHubRequest(query, variables = {}) {
  const response = await fetch('https://api.github.com/graphql', {
    method: 'POST',
    headers: {
      Authorization: `bearer ${GITHUB_TOKEN}`,
      'Content-Type': 'application/json',
      'User-Agent': 'EJFox-Website/1.0',
    },
    body: JSON.stringify({ query, variables }),
  })

  const data = await response.json()

  if (data.errors) {
    throw new Error(`GitHub API Error: ${data.errors[0]?.message}`)
  }

  return data.data
}

async function fetchRepositories() {
  console.log(`Fetching repositories for ${GITHUB_OWNER}...`)

  const query = `
    query($owner: String!, $cursor: String) {
      user(login: $owner) {
        repositories(
          first: 100,
          after: $cursor,
          privacy: PUBLIC,
          orderBy: {field: UPDATED_AT, direction: DESC}
        ) {
          pageInfo {
            hasNextPage
            endCursor
          }
          nodes {
            name
            description
            url
            homepageUrl
            stargazerCount
            forkCount
            watchers {
              totalCount
            }
            issues(states: OPEN) {
              totalCount
            }
            primaryLanguage {
              name
              color
            }
            repositoryTopics(first: 10) {
              nodes {
                topic {
                  name
                }
              }
            }
            createdAt
            updatedAt
            pushedAt
            object(expression: "HEAD:README.md") {
              ... on Blob {
                text
              }
            }
          }
        }
      }
    }
  `

  const allRepos = []
  let hasNextPage = true
  let cursor = null

  while (hasNextPage) {
    const data = await makeGitHubRequest(query, { owner: GITHUB_OWNER, cursor })
    const repos = data.user.repositories.nodes

    allRepos.push(...repos)

    hasNextPage = data.user.repositories.pageInfo.hasNextPage
    cursor = data.user.repositories.pageInfo.endCursor

    console.log(`  Fetched ${allRepos.length} repositories...`)

    // Rate limit: be nice to GitHub
    await new Promise((r) => setTimeout(r, 500))
  }

  return allRepos
}

async function processReadme(readmeText) {
  if (!readmeText) {
    return {
      html: '<p><em>No README available</em></p>',
      raw: '',
      excerpt: 'No description available',
    }
  }

  try {
    // Process markdown to HTML
    const result = await markdownProcessor.process(readmeText)
    const html = String(result)

    // Extract excerpt (first 160 chars of plain text)
    const plainText = readmeText
      .replace(/^#+ .+$/gm, '') // Remove headers
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Remove links
      .replace(/[*_`]/g, '') // Remove formatting
      .trim()
    const excerpt = plainText.slice(0, 160).trim() + '...'

    return {
      html,
      raw: readmeText,
      excerpt,
    }
  } catch (error) {
    console.error(`Error processing README:`, error.message)
    return {
      html: '<p><em>Error processing README</em></p>',
      raw: readmeText,
      excerpt: 'Error processing README',
    }
  }
}

async function exportRepository(repo) {
  console.log(`  Processing ${repo.name}...`)

  const readme = await processReadme(repo.object?.text)

  const repoData = {
    name: repo.name,
    description: repo.description || 'No description provided',
    url: repo.url,
    homepage: repo.homepageUrl || null,
    stats: {
      stars: repo.stargazerCount,
      forks: repo.forkCount,
      watchers: repo.watchers.totalCount,
      openIssues: repo.issues.totalCount,
    },
    language: repo.primaryLanguage?.name || 'Unknown',
    languageColor: repo.primaryLanguage?.color || '#666666',
    topics: repo.repositoryTopics.nodes.map((t) => t.topic.name),
    readme,
    createdAt: repo.createdAt,
    updatedAt: repo.updatedAt,
    pushedAt: repo.pushedAt,
  }

  const outputFile = join(OUTPUT_DIR, `${repo.name}.json`)
  writeFileSync(outputFile, JSON.stringify(repoData, null, 2))

  return repo.name
}

async function main() {
  console.log('GitHub Repository Export')
  console.log('========================\n')

  try {
    const repos = await fetchRepositories()
    console.log(`\nProcessing ${repos.length} repositories...\n`)

    const repoNames = []
    for (const repo of repos) {
      const name = await exportRepository(repo)
      repoNames.push(name)
    }

    // Write index file
    writeFileSync(INDEX_FILE, JSON.stringify(repoNames, null, 2))

    // Stats
    const languages = [...new Set(repos.map((r) => r.primaryLanguage?.name).filter(Boolean))]
    const totalStars = repos.reduce((sum, r) => sum + r.stargazerCount, 0)

    console.log(`\n✅ Done!`)
    console.log(`\nExported ${repos.length} repositories`)
    console.log(`Languages: ${languages.join(', ')}`)
    console.log(`Total stars: ${totalStars}`)
    console.log(`Output: ${OUTPUT_DIR}`)
    console.log(`Index: ${INDEX_FILE}`)
  } catch (error) {
    console.error(`\n❌ Error:`, error.message)
    process.exit(1)
  }
}

main().catch(console.error)
