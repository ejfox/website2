#!/usr/bin/env node
/**
 * @file meta/frontmatter-sync-report.mjs
 * @description Read-only audit of frontmatter/body divergence between the Obsidian vault
 *              (`blog/<year>/`, `blog/projects/`) and the tracked repo copies in
 *              `content/blog/`. Answers: which keys drift, how often, and — the question
 *              that actually decides the sync strategy — whether any BODIES differ.
 * @usage node scripts/meta/frontmatter-sync-report.mjs [--verbose] [--limit N]
 *
 * WHY THIS EXISTS
 *   `scripts/blog/import.mjs` writes the vault file's raw bytes to `content/blog/`
 *   (`fs.writeFile(outputPath, content)`) — it never re-serializes the frontmatter it
 *   parses. So any repo-side frontmatter edit (e.g. commit 33b0879a, "frontmatter
 *   hygiene") is silently reverted by the next `yarn blog:import`. Before picking a
 *   reconciliation strategy we need to know whether the vault also carries body text
 *   the repo lacks — because if it does, "repo wins" is destructive.
 *
 * READ-ONLY BY CONSTRUCTION: this script opens files for reading and prints. It writes
 * nothing — not to the vault (someone's personal notes), not to content/, not to data/.
 */

import { promises as fs } from 'node:fs'
import path from 'node:path'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import matter from 'gray-matter'
import chalk from 'chalk'

const execFileAsync = promisify(execFile)

const ROOT = process.cwd()
const VAULT_ROOT =
  '/Users/ejfox/Library/Mobile Documents/iCloud~md~obsidian/Documents/ejfox'
// Only the two vault namespaces that map into content/blog/. `private/`, `robots/`,
// `reading/` etc. have different (or gitignored) destinations and aren't in scope.
const VAULT_SUBDIRS = ['blog']

const args = process.argv.slice(2)
const VERBOSE = args.includes('--verbose')
const LIMIT = (() => {
  const i = args.indexOf('--limit')
  return i === -1 ? 25 : Number(args[i + 1]) || 25
})()

/**
 * Vault `blog/2019/foo.md` → repo `2019/foo.md`. Mirrors `contentRelativePath()` in
 * scripts/blog/import.mjs — the leading `blog/` segment is stripped on import.
 */
const contentRelativePath = (relPath) =>
  relPath.startsWith(`blog${path.sep}`) ? relPath.slice(5) : relPath

async function walk(dir, acc = []) {
  let entries
  try {
    entries = await fs.readdir(dir, { withFileTypes: true })
  } catch {
    return acc
  }
  for (const entry of entries) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      if (entry.name.startsWith('.') || entry.name === 'node_modules') continue
      await walk(full, acc)
    } else if (
      entry.name.endsWith('.md') &&
      !entry.name.includes('.canvas.md')
    ) {
      acc.push(full)
    }
  }
  return acc
}

/**
 * Only files git actually tracks count as "the repo copy". Untracked scratch under
 * content/blog/ (week-notes, gitignored private/) would otherwise pollute the counts.
 */
async function trackedRepoPosts() {
  const { stdout } = await execFileAsync(
    'git',
    ['ls-files', '-z', 'content/blog'],
    { cwd: ROOT, maxBuffer: 1024 * 1024 * 32 }
  )
  return new Set(
    stdout
      .split('\0')
      .filter((f) => f.endsWith('.md'))
      .map((f) => path.relative('content/blog', f))
  )
}

/**
 * Canonical value form for comparison. gray-matter turns YAML dates into Date objects
 * and object key order is incidental, so compare through a sorted-key JSON serializer:
 * Dates become ISO strings, {a,b} and {b,a} collapse to the same string.
 */
function canonical(value) {
  return JSON.stringify(value, (_k, v) => {
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      return Object.fromEntries(
        Object.keys(v)
          .sort()
          .map((k) => [k, v[k]])
      )
    }
    return v
  })
}

/** Body normalization: line endings + trailing whitespace only, so a stray final
 *  newline never gets reported as "the vault has newer writing". */
const normalizeBody = (s) => s.replace(/\r\n/g, '\n').replace(/\s+$/, '')

/**
 * Collapse the known MECHANICAL repo-side transforms so that whatever still differs
 * afterwards is actual prose drift — the only kind of body difference that would make
 * a repo→vault push destructive. The transforms, all repo-side pipelines:
 *   - dead-wikilink stripping (`[[a|b]]` → `b`) — repo renders dead links as spans,
 *     and links to drafts/PII slugs were removed outright
 *   - alt-text generation + Cloudinary rehosting (scripts/generate-alt-text.mjs,
 *     sync-alt-to-cloudinary.mjs) — vault keeps bare iCloud attachment filenames
 *   - Obsidian embeds `![[local.png]]` → hosted `![alt](https://res.cloudinary…)`
 *   - inline directive insertion (`::gear{…}`) and prose de-linking
 */
const stripMechanical = (s) =>
  s
    .replace(/!\[\[[^\]]*\]\]/g, 'IMG')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, 'IMG')
    .replace(/::\w+\{[^}]*\}/g, '')
    .replace(/\[\[[^\]|]*\|([^\]]*)\]\]/g, '$1')
    .replace(/\[\[([^\]]*)\]\]/g, '$1')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/\s+/g, ' ')
    .trim()

function diffFrontmatter(vaultFm, repoFm) {
  const keys = new Set([...Object.keys(vaultFm), ...Object.keys(repoFm)])
  const changes = []
  for (const key of keys) {
    const inVault = key in vaultFm
    const inRepo = key in repoFm
    if (inVault && !inRepo) {
      changes.push({ key, kind: 'vault-only', vault: vaultFm[key] })
    } else if (!inVault && inRepo) {
      changes.push({ key, kind: 'repo-only', repo: repoFm[key] })
    } else if (canonical(vaultFm[key]) !== canonical(repoFm[key])) {
      changes.push({
        key,
        kind: 'value-changed',
        vault: vaultFm[key],
        repo: repoFm[key],
      })
    }
  }
  return changes
}

const short = (v) => {
  const s = typeof v === 'string' ? v : canonical(v)
  return s === undefined
    ? 'undefined'
    : s.length > 40
      ? s.slice(0, 37) + '…'
      : s
}

async function main() {
  const tracked = await trackedRepoPosts()

  const vaultFiles = []
  for (const sub of VAULT_SUBDIRS) {
    await walk(path.join(VAULT_ROOT, sub), vaultFiles)
  }

  const results = []
  const vaultOrphans = []
  const matchedRepoRel = new Set()

  for (const vaultPath of vaultFiles) {
    const rel = contentRelativePath(path.relative(VAULT_ROOT, vaultPath))
    if (!tracked.has(rel)) {
      vaultOrphans.push(rel)
      continue
    }
    matchedRepoRel.add(rel)

    const [vaultRaw, repoRaw] = await Promise.all([
      fs.readFile(vaultPath, 'utf8'),
      fs.readFile(path.join(ROOT, 'content', 'blog', rel), 'utf8'),
    ])
    const v = matter(vaultRaw)
    const r = matter(repoRaw)

    const fmChanges = diffFrontmatter(v.data, r.data)
    const vBody = normalizeBody(v.content)
    const rBody = normalizeBody(r.content)
    const bodyDiffers = vBody !== rBody
    const bodyWhitespaceOnly = !bodyDiffers && v.content !== r.content // raw differs, normalized doesn't
    // Prose drift = a body difference that survives the known mechanical transforms.
    const proseDrift =
      bodyDiffers && stripMechanical(vBody) !== stripMechanical(rBody)

    // NOTE: vault mtimes are deliberately NOT used as a recency signal — iCloud
    // rewrites them all to the same sync timestamp, so they carry no information.
    results.push({
      rel,
      fmChanges,
      bodyDiffers,
      bodyWhitespaceOnly,
      proseDrift,
      vaultBodyLen: vBody.length,
      repoBodyLen: rBody.length,
    })
  }

  const repoOrphans = [...tracked].filter((f) => !matchedRepoRel.has(f)).sort()

  // ---- aggregate ----------------------------------------------------------
  const fmDiffering = results.filter((r) => r.fmChanges.length)
  const bodyDiffering = results.filter((r) => r.bodyDiffers)
  const wsOnly = results.filter((r) => r.bodyWhitespaceOnly)
  const both = results.filter((r) => r.bodyDiffers && r.fmChanges.length)

  const byKey = new Map()
  for (const r of results) {
    for (const c of r.fmChanges) {
      const k = `${c.key} ${c.kind}`
      if (!byKey.has(k)) byKey.set(k, { ...c, count: 0, samples: [] })
      const entry = byKey.get(k)
      entry.count++
      if (entry.samples.length < 3) entry.samples.push({ file: r.rel, ...c })
    }
  }

  // "Vault looks newer/better": it carries a key the repo lacks, or more body text.
  const vaultAhead = results.filter(
    (r) =>
      r.fmChanges.some((c) => c.kind === 'vault-only') ||
      (r.bodyDiffers && r.vaultBodyLen > r.repoBodyLen)
  )

  // ---- print --------------------------------------------------------------
  const h = (s) => console.log('\n' + chalk.bold.underline(s))

  console.log(chalk.bold.cyan('\n  Vault ↔ repo frontmatter sync report'))
  console.log(chalk.gray(`  vault: ${VAULT_ROOT}/blog`))
  console.log(
    chalk.gray(`  repo:  ${path.join(ROOT, 'content/blog')} (git-tracked only)`)
  )

  h('Corpus')
  console.log(`  vault posts scanned:        ${chalk.bold(vaultFiles.length)}`)
  console.log(`  matched to tracked repo:    ${chalk.bold(results.length)}`)
  console.log(
    `  vault-only (no repo file):  ${chalk.yellow(vaultOrphans.length)}`
  )
  console.log(
    `  repo-only (not in vault):   ${chalk.yellow(repoOrphans.length)}`
  )

  h('Divergence')
  const pct = (n) => chalk.gray(`(${((n / results.length) * 100).toFixed(1)}%)`)
  console.log(
    `  frontmatter differs:        ${chalk.bold.red(fmDiffering.length)} ${pct(fmDiffering.length)}`
  )
  console.log(
    `  body differs (normalized):  ${chalk[bodyDiffering.length ? 'bold' : 'green'](bodyDiffering.length)} ${pct(bodyDiffering.length)}`
  )
  console.log(`  body whitespace-only diff:  ${chalk.gray(wsOnly.length)}`)
  const drift = results.filter((r) => r.proseDrift)
  console.log(
    `    ├─ mechanical only:        ${chalk.green(bodyDiffering.length - drift.length)} ${chalk.gray('(alt-text/Cloudinary/wikilink rewrites)')}`
  )
  console.log(
    `    └─ survives normalization: ${chalk[drift.length ? 'yellow' : 'green'](drift.length)} ${chalk.gray('← inspect these by hand')}`
  )
  console.log(
    `  BOTH fm + body differ:      ${chalk[both.length ? 'bold' : 'green'](both.length)}`
  )
  console.log(
    `  identical:                  ${chalk.green(results.length - fmDiffering.length - bodyDiffering.length + both.length)}`
  )

  h('Frontmatter changes by key')
  const rows = [...byKey.values()].sort((a, b) => b.count - a.count)
  const label = {
    'repo-only': chalk.magenta('repo-only  '),
    'vault-only': chalk.cyan('vault-only '),
    'value-changed': chalk.yellow('changed    '),
  }
  for (const row of rows) {
    const detail =
      row.kind === 'value-changed'
        ? chalk.gray(
            `vault=${short(row.samples[0].vault)} → repo=${short(row.samples[0].repo)}`
          )
        : row.kind === 'repo-only'
          ? chalk.gray(
              `repo has ${row.key}=${short(row.samples[0].repo)}, vault doesn't`
            )
          : chalk.gray(
              `vault has ${row.key}=${short(row.samples[0].vault)}, repo doesn't`
            )
    console.log(
      `  ${label[row.kind]} ${chalk.bold(row.key.padEnd(16))} ${String(row.count).padStart(4)}  ${detail}`
    )
  }

  // The headline finding. A body difference means a repo→vault push would overwrite
  // writing that only exists in the vault, so this list gets printed in full.
  h('Body differences (THE important list)')
  if (!bodyDiffering.length) {
    console.log(
      chalk.green('  none — every matched post has byte-identical prose')
    )
  } else {
    for (const r of bodyDiffering.sort(
      (a, b) =>
        b.vaultBodyLen - b.repoBodyLen - (a.vaultBodyLen - a.repoBodyLen)
    )) {
      const delta = r.vaultBodyLen - r.repoBodyLen
      const dir =
        delta > 0
          ? chalk.cyan(`vault +${delta}`)
          : delta < 0
            ? chalk.magenta(`repo +${-delta}`)
            : chalk.gray('same length')
      const tag = r.proseDrift
        ? chalk.yellow('survives normalization')
        : chalk.green('mechanical')
      console.log(`  ${r.rel.padEnd(52)} ${dir.padEnd(24)} ${tag}`)
    }
  }

  h('Files where the VAULT looks newer/better')
  if (!vaultAhead.length) {
    console.log(chalk.green('  none — the repo is a superset everywhere'))
  } else {
    for (const r of vaultAhead.slice(0, LIMIT)) {
      const why = [
        ...r.fmChanges
          .filter((c) => c.kind === 'vault-only')
          .map((c) => `+${c.key}`),
        r.bodyDiffers && r.vaultBodyLen > r.repoBodyLen
          ? `+${r.vaultBodyLen - r.repoBodyLen} body chars`
          : null,
      ].filter(Boolean)
      console.log(`  ${r.rel.padEnd(52)} ${chalk.cyan(why.join(', '))}`)
    }
    if (vaultAhead.length > LIMIT) {
      console.log(
        chalk.gray(`  … ${vaultAhead.length - LIMIT} more (--limit N)`)
      )
    }
  }

  if (VERBOSE) {
    h(`Vault posts with no tracked repo file (${vaultOrphans.length})`)
    vaultOrphans.sort().forEach((f) => console.log('  ' + chalk.gray(f)))
    h(`Tracked repo posts with no vault file (${repoOrphans.length})`)
    repoOrphans.forEach((f) => console.log('  ' + chalk.gray(f)))
    h('Per-file frontmatter changes')
    for (const r of fmDiffering) {
      console.log('  ' + chalk.bold(r.rel))
      for (const c of r.fmChanges) {
        console.log(
          `    ${label[c.kind]} ${c.key}  ${c.kind === 'value-changed' ? `${short(c.vault)} → ${short(c.repo)}` : short(c.vault ?? c.repo)}`
        )
      }
    }
  }

  console.log(
    chalk.gray(
      `\n  (read-only: nothing was written. --verbose for per-file detail)\n`
    )
  )
}

main().catch((err) => {
  console.error(chalk.red('frontmatter-sync-report failed:'), err)
  process.exit(1)
})
