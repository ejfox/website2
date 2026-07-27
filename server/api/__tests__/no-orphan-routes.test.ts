/**
 * @file no-orphan-routes.test.ts
 * @description Health check that fails when a server API route exists with no
 * caller. "Caller" = the route's URL appears somewhere in the app OR its handler
 * is imported directly (e.g. stats.get.ts imports ./discogs.get). Routes that are
 * intentionally external (uptime monitors, iOS Shortcuts, webhooks, the AI agent
 * API) are listed in ALLOWLIST with a reason. When you add a route, either wire a
 * caller or add it to the allowlist — otherwise this test tells you it's invisible.
 *
 * See server/README.md for the full route inventory.
 */
import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = fileURLToPath(new URL('../../../', import.meta.url))
const API_DIR = join(ROOT, 'server/api')

// Routes with no internal caller BY DESIGN. Keep the reason honest — this list is
// the map of "things you'd otherwise forget exist."
const ALLOWLIST: Record<string, string> = {
  '/api/healthcheck': 'external — uptime monitor curls this',
  '/api/stats-lite': 'external — iOS Shortcuts / widgets',
  '/api/webhooks/calcom': 'external — Cal.com POSTs booking events here',
  '/api/agent/meta': 'external — API discovery doc for AI agents',
  '/api/agent/timeline': 'external — chronological feed for AI agents',
  '/api/cal/availability':
    'kept — superseded by cal/available-slots, retained deliberately',
  // Pending EJ review (see server/README.md "Open questions"). Allowlisted so the
  // test guards against NEW orphans; remove the entry if the route is deleted.
  '/api/search': 'review — BM25 search endpoint, no UI wired yet',
  '/api/scraps/tags': 'review — scrap tag vocabulary, no current caller',
  '/api/umami/auth':
    'review — HTTP-API umami path, maybe superseded by reach/website-stats',
  '/api/umami/stats':
    'review — HTTP-API umami path, maybe superseded by reach/website-stats',
  '/api/weekly-summary':
    'review — aggregates 9 sources, no internal caller (external digest?)',
}

// Dirs whose source counts as "using" a route.
const CALLER_DIRS = [
  'pages',
  'components',
  'composables',
  'utils',
  'plugins',
  'layouts',
  'middleware',
  'server',
]

function walk(dir: string, exts: string[]): string[] {
  const out: string[] = []
  let entries: string[]
  try {
    entries = readdirSync(dir)
  } catch {
    return out
  }
  for (const name of entries) {
    const full = join(dir, name)
    const st = statSync(full)
    if (st.isDirectory()) {
      if (name === '__tests__' || name === 'node_modules') continue
      out.push(...walk(full, exts))
    } else if (exts.some((e) => name.endsWith(e))) {
      out.push(full)
    }
  }
  return out
}

// Turn a route file path into its URL path: foo/bar.get.ts -> /api/foo/bar
function routeUrl(file: string): string {
  let p = relative(API_DIR, file).replace(/\\/g, '/')
  p = p.replace(/\.(get|post|put|patch|delete)\.ts$/, '').replace(/\.ts$/, '')
  return '/api/' + p
}

describe('no orphan API routes', () => {
  // Build the corpus once: every caller-dir source file's contents.
  const corpusFiles = CALLER_DIRS.flatMap((d) =>
    walk(join(ROOT, d), ['.vue', '.ts', '.js', '.mjs'])
  )
  const corpus = new Map(corpusFiles.map((f) => [f, readFileSync(f, 'utf8')]))

  const routeFiles = walk(API_DIR, ['.ts']).filter(
    (f) => !f.includes('__tests__')
  )

  it('finds route files to check', () => {
    expect(routeFiles.length).toBeGreaterThan(20)
  })

  for (const file of routeFiles) {
    const url = routeUrl(file)
    const base = url.split('/').pop() as string
    // URL search token stops at the first dynamic segment: /api/gear/[slug] -> /api/gear
    const urlToken = url.split('/[')[0]

    it(`${url} has a caller (or is allowlisted)`, () => {
      if (url in ALLOWLIST) {
        expect(ALLOWLIST[url]).toBeTruthy()
        return
      }
      const importRe = new RegExp(
        `from ['"][^'"]*/${base}(\\.get|\\.post)?['"]`
      )
      let referenced = false
      for (const [f, text] of corpus) {
        if (f === file) continue
        if (text.includes(urlToken) || importRe.test(text)) {
          referenced = true
          break
        }
      }
      expect(
        referenced,
        `${url} has no caller and is not in ALLOWLIST. Wire a caller, delete it, or add it to ALLOWLIST in this test with a reason.`
      ).toBe(true)
    })
  }
})
