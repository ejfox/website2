#!/usr/bin/env node
/**
 * @file check-urls.mjs
 * @description Fails when a public URL stops resolving, or a wikilink meant
 *   for a post points at a tag page. The rules live in
 *   scripts/utils/url-stability.mjs. Reads content/blog via git (ref, index or
 *   worktree), data/published-urls.json (seed, see seed-published-urls.mjs) and
 *   data/gone-urls.json. Read-only, no network. Exit 1 = broken, 2 = crashed.
 *
 *   yarn check:urls                                     # = --base origin/main
 *   node scripts/meta/check-urls.mjs                    # working tree vs Wayback seed
 *   node scripts/meta/check-urls.mjs --base origin/main # + everything public at that ref
 *   node scripts/meta/check-urls.mjs --staged --base HEAD   # pre-commit
 *
 * Run by .githooks/pre-commit (staged tree vs HEAD) and by lint.yml (the
 * change vs its base). The hook is the layer that stops it before it lands:
 * on main, CI only checks each push against its parent, so a break that gets
 * through is flagged once, on that push, and is quiet after.
 */

import { execFileSync } from 'node:child_process'
import { promises as fs } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createJiti } from 'jiti'
import {
  findBareWikilinksToPosts,
  findBrokenUrls,
  parseEntries,
  publicRoutes,
} from '../utils/url-stability.mjs'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const CONTENT = 'content/blog'

const args = process.argv.slice(2)
const flag = (name) => args.includes(name)
const opt = (name) => {
  const i = args.indexOf(name)
  return i === -1 ? null : args[i + 1]
}

const git = (argv, input) =>
  execFileSync('git', argv, {
    cwd: ROOT,
    input,
    maxBuffer: 256 * 1024 * 1024,
  })

/**
 * Read blobs by sha in one `git cat-file --batch` call. One process instead
 * of one `git show` per post is what keeps the pre-commit hook fast. Output
 * is "<sha> blob <size>\n<content>\n" per item, in request order.
 */
function readBlobs(items) {
  if (!items.length) return []
  const out = git(['cat-file', '--batch'], items.map((i) => i.sha).join('\n'))
  const entries = []
  let pos = 0
  for (const { rel } of items) {
    const nl = out.indexOf(10, pos)
    const size = Number(out.toString('utf8', pos, nl).split(' ')[2])
    entries.push({ rel, text: out.toString('utf8', nl + 1, nl + 1 + size) })
    pos = nl + 1 + size + 1
  }
  return entries
}

const relOf = (p) => path.posix.relative(CONTENT, p)
const isMd = (p) => p.endsWith('.md')

/** content/blog/**.md as of a git ref. */
function entriesAtRef(ref) {
  const items = git(['ls-tree', '-r', '-z', ref, '--', CONTENT])
    .toString()
    .split('\0')
    .filter(Boolean)
    .map((line) => {
      const [meta, p] = line.split('\t')
      return { sha: meta.split(' ')[2], rel: relOf(p) }
    })
    .filter((i) => isMd(i.rel))
  return readBlobs(items)
}

/** content/blog/**.md as staged in the index. */
function entriesStaged() {
  const items = git(['ls-files', '-s', '-z', '--', CONTENT])
    .toString()
    .split('\0')
    .filter(Boolean)
    .map((line) => {
      const [meta, p] = line.split('\t')
      return { sha: meta.split(' ')[1], rel: relOf(p) }
    })
    .filter((i) => isMd(i.rel))
  return readBlobs(items)
}

/** content/blog/**.md tracked by git, read from the working tree. */
async function entriesWorktree() {
  const files = git(['ls-files', '-z', '--', CONTENT])
    .toString()
    .split('\0')
    .filter((p) => p && isMd(p))
  const entries = []
  for (const p of files) {
    try {
      entries.push({
        rel: relOf(p),
        text: await fs.readFile(path.join(ROOT, p), 'utf8'),
      })
    } catch {
      // deleted in the working tree but not yet staged: it's gone
    }
  }
  return entries
}

function refExists(ref) {
  try {
    git(['rev-parse', '--verify', '--quiet', `${ref}^{commit}`])
    return true
  } catch {
    return false
  }
}

const readJson = async (rel) =>
  JSON.parse(await fs.readFile(path.join(ROOT, rel), 'utf8'))

async function main() {
  // Load the app's real TS rules (not copies), so this can't drift from what
  // prod does with a redirect or a scheduled post.
  const jiti = createJiti(import.meta.url, { alias: { '~': ROOT } })
  const legacy = await jiti.import(
    path.join(ROOT, 'server/utils/legacyRedirect.ts')
  )
  const { isScheduled } = await jiti.import(
    path.join(ROOT, 'utils/postFilters.ts')
  )
  const opts = {
    legacy,
    isScheduled,
    gone: await readJson('data/gone-urls.json'),
  }

  const head = parseEntries(
    flag('--staged') ? entriesStaged() : await entriesWorktree()
  )

  const required = new Map()
  for (const { url, seen } of (await readJson('data/published-urls.json'))
    .urls) {
    required.set(url, `seen live by the Wayback Machine ${seen}`)
  }
  const base = opt('--base')
  if (base && refExists(base)) {
    const label = git(['rev-parse', '--short', base]).toString().trim()
    for (const route of publicRoutes(
      parseEntries(entriesAtRef(base)),
      opts
    ).keys()) {
      required.set(route, `public at ${base} (${label})`)
    }
  } else if (base) {
    console.log(`check-urls: base ${base} not found, checking the seed only`)
  }

  const broken = findBrokenUrls(required, head, opts)
  const bare = findBareWikilinksToPosts(head, opts)

  if (broken.length) {
    console.error(`\n✗ ${broken.length} public URL(s) would stop resolving:\n`)
    for (const b of broken) {
      console.error(`  ${b.route}`)
      console.error(`    was: ${b.origin}`)
      console.error(
        `    now: 404, because ${b.why}${b.source ? ` (${b.source})` : ''}`
      )
    }
    console.error(`
  People link to these. Unpublishing is fine, silently is not. Either:
    • undo it (republish / restore the file), or
    • move it and let the legacy redirect find it (same filename, one match), or
    • record it in data/gone-urls.json: { "<route>": "why it's gone" }`)
  }
  if (bare.length) {
    console.error(
      `\n✗ ${bare.length} wikilink(s) name a post but will link to a tag page:\n`
    )
    for (const b of bare) {
      console.error(`  ${b.source}:${b.line}  ${b.found}  →  ${b.fix}`)
    }
    console.error(
      `\n  A wikilink with no folder routes to /tag/<name>. Use the post's path.`
    )
  }
  if (broken.length || bare.length) process.exit(1)

  if (!flag('--quiet')) {
    console.log(
      `✓ check-urls: ${required.size} URLs resolve, no bare wikilinks to posts`
    )
  }
}

main().catch((err) => {
  console.error('check-urls crashed:', err)
  process.exit(2)
})
