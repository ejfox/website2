#!/usr/bin/env node
/**
 * @file export-github-repos.mjs
 * @description Export GitHub repository data including READMEs, language breakdown, file trees, and metadata with smart caching
 * @usage node scripts/export-github-repos.mjs
 * @env GITHUB_TOKEN - GitHub personal access token (required)
 * @env githubToken - Alternative env var name for GitHub token (optional)
 */

/* eslint-disable no-console */

import { writeFileSync, mkdirSync, existsSync, readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkGfm from 'remark-gfm'
import remarkRehype from 'remark-rehype'
import rehypeRaw from 'rehype-raw'
import rehypeStringify from 'rehype-stringify'
import rehypeSlug from 'rehype-slug'
import sanitizeHtml from 'sanitize-html'
import dotenv from 'dotenv'

dotenv.config()

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUTPUT_DIR = join(__dirname, '../data/github-repos')
const INDEX_FILE = join(__dirname, '../data/github-repos-index.json')
const LIST_FILE = join(__dirname, '../data/github-repos-list.json')

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

async function fetchLanguageBreakdown(owner, repoName) {
  try {
    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repoName}/languages`,
      {
        headers: {
          Authorization: `bearer ${GITHUB_TOKEN}`,
          'User-Agent': 'EJFox-Website/1.0',
        },
      }
    )

    if (!response.ok) {
      console.warn(`  ⚠️  Failed to fetch languages for ${repoName}`)
      return {}
    }

    const languages = await response.json()
    return languages // Returns { "JavaScript": 12345, "Vue": 6789, ... }
  } catch (error) {
    console.warn(
      `  ⚠️  Error fetching languages for ${repoName}:`,
      error.message
    )
    return {}
  }
}

async function fetchFileTree(owner, repoName) {
  try {
    // Get default branch first
    const repoResponse = await fetch(
      `https://api.github.com/repos/${owner}/${repoName}`,
      {
        headers: {
          Authorization: `bearer ${GITHUB_TOKEN}`,
          'User-Agent': 'EJFox-Website/1.0',
        },
      }
    )

    if (!repoResponse.ok) {
      console.warn(`  ⚠️  Failed to fetch repo info for ${repoName}`)
      return null
    }

    const repoInfo = await repoResponse.json()
    const defaultBranch = repoInfo.default_branch

    // Get tree recursively
    const treeResponse = await fetch(
      `https://api.github.com/repos/${owner}/${repoName}/git/trees/${defaultBranch}?recursive=1`,
      {
        headers: {
          Authorization: `bearer ${GITHUB_TOKEN}`,
          'User-Agent': 'EJFox-Website/1.0',
        },
      }
    )

    if (!treeResponse.ok) {
      console.warn(`  ⚠️  Failed to fetch tree for ${repoName}`)
      return null
    }

    const treeData = await treeResponse.json()

    // Build hierarchical structure for treemap
    const root = {
      name: repoName,
      children: [],
      path: '',
    }

    const pathMap = { '': root }

    // First pass: create all directories
    treeData.tree
      .filter((item) => item.type === 'tree')
      .forEach((dir) => {
        const parts = dir.path.split('/')
        let currentPath = ''

        parts.forEach((part, _idx) => {
          const parentPath = currentPath
          currentPath = currentPath ? `${currentPath}/${part}` : part

          if (!pathMap[currentPath]) {
            const node = {
              name: part,
              children: [],
              path: currentPath,
            }
            pathMap[currentPath] = node

            // Add to parent
            const parent = pathMap[parentPath]
            if (parent) {
              parent.children.push(node)
            }
          }
        })
      })

    // Second pass: add files
    const files = []
    treeData.tree
      .filter((item) => item.type === 'blob')
      .forEach((file) => {
        const size = file.size || 0
        files.push({
          path: file.path,
          size,
        })

        // Add to tree structure
        const parts = file.path.split('/')
        const filename = parts.pop()
        const dirPath = parts.join('/')

        const parent = pathMap[dirPath] || root
        parent.children.push({
          name: filename,
          size,
          path: file.path,
        })
      })

    return {
      files, // Flat list for simple viz
      tree: root, // Hierarchical for treemap
      totalFiles: files.length,
      totalSize: files.reduce((sum, f) => sum + f.size, 0),
    }
  } catch (error) {
    console.warn(
      `  ⚠️  Error fetching file tree for ${repoName}:`,
      error.message
    )
    return null
  }
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
            diskUsage
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
    let html = String(result)

    // Sanitize HTML to prevent XSS attacks
    html = sanitizeHtml(html, {
      allowedTags: sanitizeHtml.defaults.allowedTags.concat([
        'img',
        'h1',
        'h2',
        'h3',
        'h4',
        'h5',
        'h6',
        'details',
        'summary',
      ]),
      allowedAttributes: {
        ...sanitizeHtml.defaults.allowedAttributes,
        '*': ['id', 'class'],
        img: ['src', 'alt', 'title', 'width', 'height'],
        a: ['href', 'name', 'target', 'rel'],
        code: ['class'],
        pre: ['class'],
      },
      allowedSchemes: ['http', 'https', 'mailto'],
      allowProtocolRelative: false,
    })

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

function sanitizeFilename(filename) {
  // Only allow alphanumeric, hyphens, underscores, dots (GitHub repo names)
  // Remove any path traversal attempts
  return filename.replace(/[^\w.-]/g, '_')
}

async function exportRepository(repo) {
  // Validate repo name (prevent path traversal)
  const safeName = sanitizeFilename(repo.name)
  if (safeName !== repo.name) {
    console.warn(`  ⚠️  Sanitized repo name: ${repo.name} -> ${safeName}`)
  }

  const outputFile = join(OUTPUT_DIR, `${safeName}.json`)

  // 🚀 SMART CACHING: Check if repo unchanged since last export
  if (existsSync(outputFile)) {
    try {
      const cached = JSON.parse(readFileSync(outputFile, 'utf-8'))
      if (cached.pushedAt === repo.pushedAt) {
        console.log(
          `  ✓ ${safeName} (cached, unchanged since ${repo.pushedAt})`
        )
        return {
          name: safeName,
          languages: cached.languages,
          diskUsage: cached.diskUsage || 0,
          cached: true,
        }
      }
    } catch (_err) {
      // Corrupted cache, re-fetch
      console.log(`  ⚠️  ${safeName} cache corrupted, re-fetching...`)
    }
  }

  console.log(`  Processing ${safeName}...`)

  const readme = await processReadme(repo.object?.text)
  const languages = await fetchLanguageBreakdown(GITHUB_OWNER, repo.name)
  const fileTree = await fetchFileTree(GITHUB_OWNER, repo.name)

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
    languages, // Language breakdown by bytes
    diskUsage: repo.diskUsage || 0, // Total KB
    fileTree, // File tree with sizes
    topics: repo.repositoryTopics.nodes.map((t) => t.topic.name),
    readme,
    createdAt: repo.createdAt,
    updatedAt: repo.updatedAt,
    pushedAt: repo.pushedAt,
  }

  writeFileSync(outputFile, JSON.stringify(repoData, null, 2))

  return {
    name: safeName,
    languages,
    diskUsage: repo.diskUsage || 0,
    cached: false,
  }
}

async function main() {
  console.log('GitHub Repository Export')
  console.log('========================\n')

  try {
    const repos = await fetchRepositories()
    console.log(`\nProcessing ${repos.length} repositories...\n`)

    const repoNames = []
    const reposList = [] // Lightweight list for index page
    let cachedCount = 0
    let fetchedCount = 0

    for (const repo of repos) {
      const { name, languages, diskUsage, cached } =
        await exportRepository(repo)

      if (cached) cachedCount++
      else fetchedCount++

      repoNames.push(name)

      // Create lightweight entry (no README, includes language data)
      reposList.push({
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
        languages, // Language breakdown for force layout
        diskUsage, // Total KB for node sizing
        topics: repo.repositoryTopics.nodes.map((t) => t.topic.name),
        excerpt: repo.description || 'No description provided',
        createdAt: repo.createdAt,
        updatedAt: repo.updatedAt,
        pushedAt: repo.pushedAt,
      })
    }

    // Write index file (just names)
    writeFileSync(INDEX_FILE, JSON.stringify(repoNames, null, 2))

    // Write lightweight list file (for index page)
    writeFileSync(LIST_FILE, JSON.stringify(reposList, null, 2))

    // Stats
    const languages = [
      ...new Set(repos.map((r) => r.primaryLanguage?.name).filter(Boolean)),
    ]
    const totalStars = repos.reduce((sum, r) => sum + r.stargazerCount, 0)

    console.log(`\n✅ Done!`)
    console.log(`\nExported ${repos.length} repositories`)
    const cacheHitPct = Math.round((cachedCount / repos.length) * 100)
    console.log(
      `🚀 ${cachedCount} cached, ${fetchedCount} fetched (${cacheHitPct}%)`
    )
    console.log(`Languages: ${languages.join(', ')}`)
    console.log(`Total stars: ${totalStars}`)
    console.log(`Output: ${OUTPUT_DIR}`)
    console.log(`Index: ${INDEX_FILE}`)
    console.log(`List: ${LIST_FILE}`)
  } catch (error) {
    console.error(`\n❌ Error:`, error.message)
    process.exit(1)
  }
}

main().catch(console.error)
