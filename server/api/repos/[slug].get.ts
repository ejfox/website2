/**
 * @file repos/[slug].get.ts
 * @description Retrieves pre-generated GitHub repository data with stats, readme, and language information from cached JSON files
 * @endpoint GET /api/repos/{slug}
 * @params slug: string - Repository name (validated against whitelist)
 * @returns Complete repository data including stars, forks, languages, readme HTML, and timestamps
 */
import { defineEventHandler, createError } from 'h3'
import { readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'

interface RepoStats {
  stars: number
  forks: number
  watchers: number
  openIssues: number
}

interface RepoReadme {
  html: string
  raw: string
  excerpt: string
}

interface CommitEntry {
  sha: string
  message: string
  date: string
  repo: string
  repoUrl: string
}

interface RecentCommit {
  sha: string
  message: string
  date: string
  url: string
}

interface WeekBucket {
  weekStart: string
  count: number
}

interface TypeCount {
  type: string
  count: number
}

interface CommitMeta {
  totalCommits: number
  firstCommitAt: string | null
  lastCommitAt: string | null
  recent: RecentCommit[]
  byWeek: WeekBucket[]
  byType: TypeCount[]
}

interface NetworkNode {
  id: string
  label: string
  type: string
  lines: string
  file: string
  filePath?: string
  filePaths?: string[]
}

interface NetworkEdge {
  source: string
  target: string
  type: string
}

interface NetworkPayload {
  meta: {
    pushedAt: string
    generatedAt: string
    nodeCount: number
    edgeCount: number
  }
  nodes: NetworkNode[]
  edges: NetworkEdge[]
}

interface RepoData {
  name: string
  description: string
  url: string
  homepage: string | null
  stats: RepoStats
  language: string
  languageColor: string
  languages: Record<string, number>
  diskUsage: number
  topics: string[]
  readme: RepoReadme
  createdAt: string
  updatedAt: string
  pushedAt: string
  commits?: CommitMeta
  network?: NetworkPayload | null
}

// Load index once at module level for validation
const INDEX_PATH = join(process.cwd(), 'data/github-repos-index.json')
let validRepos: string[] = []

try {
  if (existsSync(INDEX_PATH)) {
    validRepos = JSON.parse(readFileSync(INDEX_PATH, 'utf-8'))
  }
} catch (error) {
  console.error('Failed to load repo index:', error)
}

// Load all commits once at module level; group by repo for fast lookup
const COMMITS_PATH = join(process.cwd(), 'data/github-commits.json')
const commitsByRepo = new Map<string, CommitEntry[]>()

try {
  if (existsSync(COMMITS_PATH)) {
    const allCommits: CommitEntry[] = JSON.parse(
      readFileSync(COMMITS_PATH, 'utf-8')
    )
    for (const c of allCommits) {
      const list = commitsByRepo.get(c.repo) || []
      list.push(c)
      commitsByRepo.set(c.repo, list)
    }
    // Pre-sort each repo's commits descending by date
    for (const list of commitsByRepo.values()) {
      list.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))
    }
  }
} catch (error) {
  console.error('Failed to load commits index:', error)
}

// Bucket the last 52 weeks of commits for sparkline rendering
function buildWeeklyBuckets(commits: CommitEntry[]): WeekBucket[] {
  const WEEKS = 52
  const MS_PER_WEEK = 7 * 24 * 60 * 60 * 1000
  const now = new Date()
  // Snap to start of current week (Sunday UTC)
  const startOfWeek = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  )
  startOfWeek.setUTCDate(startOfWeek.getUTCDate() - startOfWeek.getUTCDay())

  const buckets: WeekBucket[] = []
  for (let i = WEEKS - 1; i >= 0; i--) {
    const weekStart = new Date(startOfWeek.getTime() - i * MS_PER_WEEK)
    buckets.push({ weekStart: weekStart.toISOString(), count: 0 })
  }

  const earliest = new Date(buckets[0].weekStart).getTime()
  for (const c of commits) {
    const t = new Date(c.date).getTime()
    if (t < earliest) continue
    const idx = Math.floor((t - earliest) / MS_PER_WEEK)
    if (idx >= 0 && idx < buckets.length) buckets[idx].count++
  }
  return buckets
}

// Conventional-commit prefix detection. Accepts `feat:`, `fix(scope):`, `chore!:`, etc.
const CONVENTIONAL_RE = /^(\w+)(?:\([^)]+\))?!?:/
const KNOWN_TYPES = [
  'feat',
  'fix',
  'refactor',
  'docs',
  'chore',
  'style',
  'test',
  'build',
  'ci',
  'perf',
  'revert',
]
const KNOWN_SET = new Set(KNOWN_TYPES)

// Resolve basename → full repo path for each network node using fileTree.files.
// Lives outside the request handler to keep the handler at shallow nesting depth.
function annotateNetworkPaths(
  network: NetworkPayload,
  files: Array<{ path: string }>
) {
  const byBase = new Map<string, string[]>()
  for (const f of files) {
    if (!f?.path) continue
    const base = f.path.split('/').pop() || f.path
    const list = byBase.get(base) || []
    list.push(f.path)
    byBase.set(base, list)
  }
  for (const n of network.nodes) {
    const paths = byBase.get(n.file) || []
    if (paths.length === 1) n.filePath = paths[0]
    else if (paths.length > 1) n.filePaths = paths
  }
}

function buildTypeCounts(commits: CommitEntry[]): TypeCount[] {
  const counts = new Map<string, number>()
  for (const c of commits) {
    const m = CONVENTIONAL_RE.exec((c.message || '').trim())
    const type = m ? m[1].toLowerCase() : 'other'
    const key = KNOWN_SET.has(type) ? type : 'other'
    counts.set(key, (counts.get(key) || 0) + 1)
  }
  return [...counts.entries()]
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count)
}

function buildCommitMeta(repoName: string): CommitMeta {
  const list = commitsByRepo.get(repoName) || []
  const recent: RecentCommit[] = list.slice(0, 20).map((c) => ({
    sha: c.sha,
    message: c.message,
    date: c.date,
    url: `${c.repoUrl}/commit/${c.sha}`,
  }))
  return {
    totalCommits: list.length,
    firstCommitAt: list.length ? list[list.length - 1].date : null,
    lastCommitAt: list.length ? list[0].date : null,
    recent,
    byWeek: buildWeeklyBuckets(list),
    byType: buildTypeCounts(list),
  }
}

function isValidSlug(slug: string): boolean {
  // Only allow alphanumeric, hyphens, underscores, dots (GitHub repo names)
  return /^[\w.-]+$/.test(slug)
}

export default defineEventHandler(async (event): Promise<RepoData> => {
  const slug = event.context.params?.slug

  if (!slug) {
    throw createError({
      statusCode: 400,
      message: 'Repository slug is required',
    })
  }

  // Validate slug format (prevent path traversal)
  if (!isValidSlug(slug)) {
    throw createError({
      statusCode: 400,
      message: 'Invalid repository name format',
    })
  }

  // Validate slug is in whitelist (prevent arbitrary file access)
  if (validRepos.length > 0 && !validRepos.includes(slug)) {
    throw createError({
      statusCode: 404,
      statusMessage: `Repository '${slug}' not found`,
    })
  }

  // Read from pre-generated JSON file
  const filePath = join(process.cwd(), 'data', 'github-repos', `${slug}.json`)

  if (!existsSync(filePath)) {
    throw createError({
      statusCode: 404,
      statusMessage: `Repository '${slug}' not found`,
    })
  }

  try {
    const fileContent = readFileSync(filePath, 'utf-8')
    const repoData: RepoData = JSON.parse(fileContent)
    repoData.commits = buildCommitMeta(slug)

    const networkPath = join(
      process.cwd(),
      'data',
      'github-repos',
      `${slug}.network.json`
    )
    if (existsSync(networkPath)) {
      try {
        const network: NetworkPayload = JSON.parse(
          readFileSync(networkPath, 'utf-8')
        )
        // Resolve basenames to full paths (back-compat with older networks).
        annotateNetworkPaths(
          network,
          (repoData.fileTree?.files || []) as Array<{ path: string }>
        )
        repoData.network = network
      } catch {
        repoData.network = null
      }
    }

    return repoData
  } catch (error) {
    console.error(`Error reading repo data for ${slug}:`, error)
    throw createError({
      statusCode: 500,
      message: 'Failed to load repository data',
    })
  }
})
