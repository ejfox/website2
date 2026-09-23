import { execFileSync } from 'node:child_process'

/**
 * Dev-only "what changed" endpoint. Runs git in the repo, maps changed content
 * files to their live routes, and returns per-file status, line counts, and a
 * few added-line snippets. Powers components/dev/ChangedRoutesHud.client.vue.
 *
 * NEVER served in production — it shells out to git and leaks source paths.
 *
 *   GET /api/_dev/changes?base=session   (default) — uncommitted working tree
 *   GET /api/_dev/changes?base=branch    — everything different from `main`
 */

interface ChangedFile {
  file: string
  status: 'M' | 'A' | 'D' | 'R' | '?'
  additions: number
  deletions: number
  route: string | null
  title: string | null
  addedSnippets: string[]
}

function git(args: string[]): string {
  return execFileSync('git', args, {
    encoding: 'utf8',
    cwd: process.cwd(),
    maxBuffer: 10 * 1024 * 1024,
  }).trim()
}

// Like git(), but returns stdout even when git exits non-zero — needed for
// `diff --no-index`, which exits 1 whenever the files differ (i.e. always,
// for an untracked file vs /dev/null).
function gitAllowFail(args: string[]): string {
  try {
    return git(args)
  } catch (e: any) {
    return typeof e?.stdout === 'string' ? e.stdout.trim() : ''
  }
}

// content/blog/projects/foo.md -> /projects/foo
// content/blog/2025/foo.md     -> /blog/2025/foo
// content/blog/drafts/foo.md   -> /blog/drafts/foo (dev-visible)
// pages/gear/index.vue         -> /gear   (best-effort)
// pages/threads.vue            -> /threads
function fileToRoute(file: string): string | null {
  const proj = file.match(/^content\/blog\/projects\/([^/]+)\.md$/)
  if (proj) return `/projects/${proj[1]}`

  const blog = file.match(/^content\/blog\/(.+)\.md$/)
  if (blog) return `/blog/${blog[1]}`

  const page = file.match(/^pages\/(.+)\.vue$/)
  if (page) {
    let r = page[1]
      .replace(/\/index$/, '')
      .replace(/\/\[\.\.\.slug\]$/, '')
      .replace(/\/\[slug\]$/, '')
    if (r === 'index') r = ''
    // dynamic-only routes ([slug]) can't be linked without a param
    if (/\[/.test(r)) return null
    return `/${r}`
  }
  return null
}

// Pull the frontmatter title out of a markdown file (best-effort).
function titleFor(file: string): string | null {
  if (!file.endsWith('.md')) return null
  try {
    const head = git(['show', `:${file}`]).slice(0, 800)
    const m = head.match(/^title:\s*["']?(.+?)["']?\s*$/m)
    return m ? m[1] : null
  } catch {
    // untracked / deleted — fall back to filename
    return null
  }
}

export default defineEventHandler((event) => {
  if (!import.meta.dev) {
    setResponseStatus(event, 404)
    return { error: 'not found' }
  }

  const base = (getQuery(event).base as string) === 'branch' ? 'branch' : 'session'

  // name-status + numstat give us status and line counts in two cheap calls.
  const diffArgs =
    base === 'branch'
      ? ['diff', '--no-color', 'main', '--']
      : ['diff', '--no-color', 'HEAD', '--']

  let nameStatus = ''
  let numStat = ''
  let untracked: string[] = []
  try {
    nameStatus = git([...diffArgs.slice(0, -1), '--name-status', '--'])
    numStat = git([...diffArgs.slice(0, -1), '--numstat', '--'])
    if (base === 'session') {
      untracked = git(['ls-files', '--others', '--exclude-standard'])
        .split('\n')
        .filter(Boolean)
    }
  } catch (e: any) {
    return { base, error: e?.message || 'git failed', files: [] }
  }

  // status letter per file
  const statusMap = new Map<string, ChangedFile['status']>()
  for (const line of nameStatus.split('\n').filter(Boolean)) {
    const [code, ...rest] = line.split('\t')
    const letter = code[0] as ChangedFile['status']
    statusMap.set(rest[rest.length - 1], letter)
  }

  // line counts per file
  const counts = new Map<string, { add: number; del: number }>()
  for (const line of numStat.split('\n').filter(Boolean)) {
    const [add, del, file] = line.split('\t')
    counts.set(file, {
      add: add === '-' ? 0 : parseInt(add, 10),
      del: del === '-' ? 0 : parseInt(del, 10),
    })
  }

  const allFiles = new Set<string>([...statusMap.keys(), ...untracked])

  const files: ChangedFile[] = []
  for (const file of allFiles) {
    const status = untracked.includes(file) ? '?' : statusMap.get(file) || 'M'

    // grab a handful of added lines for preview + highlight
    const diff =
      status === '?'
        ? gitAllowFail(['diff', '--no-color', '--no-index', '/dev/null', file])
        : gitAllowFail([...diffArgs, file])
    const addedSnippets = diff
      .split('\n')
      .filter((l) => l.startsWith('+') && !l.startsWith('+++'))
      .map((l) => l.slice(1).trim())
      .filter((l) => l && !l.startsWith('<!--')) // skip TODO/html comments
      .slice(0, 8)

    files.push({
      file,
      status,
      additions: counts.get(file)?.add ?? 0,
      deletions: counts.get(file)?.del ?? 0,
      route: fileToRoute(file),
      title: titleFor(file),
      addedSnippets,
    })
  }

  // Routable content first, then everything else; each group by most-changed.
  files.sort((a, b) => {
    if (!!a.route !== !!b.route) return a.route ? -1 : 1
    return b.additions + b.deletions - (a.additions + a.deletions)
  })

  return {
    base,
    generatedAt: new Date().toISOString(),
    count: files.length,
    routableCount: files.filter((f) => f.route).length,
    files,
  }
})
