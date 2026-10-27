/**
 * @file github/activity.get.ts
 * @description GET /api/github/activity. A year x week commit grid from
 *   data/github-commits.json: { years, weeks: [{ year, week, weekStart, commits,
 *   topRepo, topRepoLang }], totalCommits, totalRepos }. topRepo is the repo
 *   with the most commits that week; its language (from data/github-repos/*.json)
 *   lets the /github hero heatmap color cells. Weeks are Sunday-anchored UTC.
 *   Computed ONCE at module load, so new data needs a process reload.
 *   Never throws: missing or bad data returns an empty payload.
 */
import { readFileSync, existsSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

interface CommitRow {
  sha: string
  date: string
  year: number
  repo: string
}

interface RepoMeta {
  language?: string
  primaryLanguage?: string
}

interface WeekCell {
  year: number
  week: number // 0-indexed week-of-year (ISO-ish, anchored to Sunday)
  weekStart: string
  commits: number
  topRepo: string | null
  topRepoLang: string | null
}

interface ActivityPayload {
  years: number[]
  weeks: WeekCell[]
  totalCommits: number
  totalRepos: number
}

const REPOS_DIR = join(process.cwd(), 'data/github-repos')
const COMMITS_PATH = join(process.cwd(), 'data/github-commits.json')

// ── Week math ────────────────────────────────────────────
// Despite the name, weeks start on Sunday (matches the GitHub-style grid).
function isoWeekStart(d: Date): Date {
  // anchor to Sunday UTC
  const start = new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())
  )
  start.setUTCDate(start.getUTCDate() - start.getUTCDay())
  return start
}

function weekOfYear(weekStart: Date): number {
  const yearStart = new Date(Date.UTC(weekStart.getUTCFullYear(), 0, 1))
  const firstSunday = new Date(yearStart)
  firstSunday.setUTCDate(firstSunday.getUTCDate() - firstSunday.getUTCDay())
  const diffMs = weekStart.getTime() - firstSunday.getTime()
  return Math.floor(diffMs / (7 * 24 * 60 * 60 * 1000))
}

// Build a lookup of repo → language using the cached repo metadata.
function loadRepoLanguages(): Map<string, string> {
  const map = new Map<string, string>()
  try {
    for (const f of readdirSync(REPOS_DIR)) {
      if (!f.endsWith('.json') || f.endsWith('.network.json')) continue
      try {
        const r: RepoMeta & { name: string } = JSON.parse(
          readFileSync(join(REPOS_DIR, f), 'utf-8')
        )
        if (r.name && r.language) map.set(r.name, r.language)
      } catch {
        /* skip */
      }
    }
  } catch {
    /* dir missing */
  }
  return map
}

// ── Build once ───────────────────────────────────────────
const payload: ActivityPayload = (() => {
  const empty: ActivityPayload = {
    years: [],
    weeks: [],
    totalCommits: 0,
    totalRepos: 0,
  }
  if (!existsSync(COMMITS_PATH)) return empty

  let commits: CommitRow[]
  try {
    commits = JSON.parse(readFileSync(COMMITS_PATH, 'utf-8'))
  } catch {
    return empty
  }
  if (!commits.length) return empty

  const repoLangs = loadRepoLanguages()

  // bucket: key = `${year}-${weekIdx}`, value = { commits, repoCounts: Map<repo,count> }
  const buckets = new Map<
    string,
    {
      year: number
      week: number
      weekStart: string
      commits: number
      repoCounts: Map<string, number>
    }
  >()

  for (const c of commits) {
    const d = new Date(c.date)
    if (Number.isNaN(d.getTime())) continue
    const ws = isoWeekStart(d)
    const year = ws.getUTCFullYear()
    const week = weekOfYear(ws)
    const key = `${year}-${week}`
    let b = buckets.get(key)
    if (!b) {
      b = {
        year,
        week,
        weekStart: ws.toISOString(),
        commits: 0,
        repoCounts: new Map(),
      }
      buckets.set(key, b)
    }
    b.commits += 1
    b.repoCounts.set(c.repo, (b.repoCounts.get(c.repo) || 0) + 1)
  }

  const weeks: WeekCell[] = []
  for (const b of buckets.values()) {
    let topRepo: string | null = null
    let topCount = 0
    for (const [name, count] of b.repoCounts) {
      if (count > topCount) {
        topCount = count
        topRepo = name
      }
    }
    weeks.push({
      year: b.year,
      week: b.week,
      weekStart: b.weekStart,
      commits: b.commits,
      topRepo,
      topRepoLang: topRepo ? repoLangs.get(topRepo) || null : null,
    })
  }

  const yearSet = new Set(weeks.map((w) => w.year))
  const years = [...yearSet].sort((a, b) => a - b)
  const repoSet = new Set(commits.map((c) => c.repo))

  return {
    years,
    weeks: weeks.sort((a, b) => a.year - b.year || a.week - b.week),
    totalCommits: commits.length,
    totalRepos: repoSet.size,
  }
})()

export default defineEventHandler(() => payload)
