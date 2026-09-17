#!/usr/bin/env node
/**
 * @file meta/vault-repo-merge.mjs
 * @description Three-way-ish merge of the Obsidian vault copy and the repo copy of each
 *              blog post into ONE canonical document, written back to BOTH sides so they
 *              converge and stay converged. DRY RUN BY DEFAULT — writes nothing without
 *              an explicit `--apply`.
 * @usage node scripts/meta/vault-repo-merge.mjs            # dry run (default)
 *        node scripts/meta/vault-repo-merge.mjs --apply    # actually write both sides
 *        node scripts/meta/vault-repo-merge.mjs --only 2022/art-setup
 *        node scripts/meta/vault-repo-merge.mjs --diff 2022/art-setup   # print unified diff
 *
 * WHY THIS EXISTS
 *   `scripts/blog/import.mjs` copies vault→repo as RAW BYTES, so every repo-side edit is
 *   reverted by the next import. The two copies have diverged, and — this is the whole
 *   problem — each side is better in DIFFERENT, mechanically-identifiable ways. Neither
 *   wholesale direction is safe:
 *
 *     VAULT is better at: Obsidian wikilinks woven into prose (`[[blog/2022/the-studio]]`,
 *       `[[drafts/soapmaking]]`), which the repo stripped. remarkObsidianSupport resolves
 *       these, and dead ones render as a non-clickable `internal-link-dead` span, so
 *       restoring them is safe. Also the frontmatter keys `unlisted` and `about`.
 *
 *     REPO is better at: Cloudinary image URLs + generated alt text (the vault keeps bare
 *       iCloud attachment filenames, and `![[x.png]]` has NO build-time handling at all —
 *       it parses as a wikilink and the image simply does not render); archive.org
 *       link-rot repair from `yarn blog:fix-links`; and frontmatter hygiene
 *       (`aiInvolvement`→`ai-involvement`, dropped `hidden: false`, correct `type`).
 *
 *   So: frontmatter from the repo, body from the vault, then re-apply the repo's superior
 *   body transformations on top.
 *
 * WHY THE FRONTMATTER IS SPLICED TEXTUALLY, NOT RE-SERIALIZED
 *   `matter.stringify()` runs the parsed object back through js-yaml, which reformats
 *   every `dek: >-` folded block and every date across 163 files. The result would be a
 *   diff nobody can review. Instead we take the repo's RAW frontmatter text as the base
 *   and edit individual lines, so an untouched key comes out byte-identical and key order
 *   is preserved for free.
 *
 * SAFETY
 *   - Dry run is the default. `--apply` is the only thing that writes.
 *   - `--apply` first copies every vault file it will touch into
 *     `.vault-backup-<ISO>/` inside the repo (gitignored). These are someone's personal
 *     notes; the operation has to be trivially reversible.
 *   - A post can NEVER lose `draft: true`. `draft` is merged as a UNION of both sides —
 *     starting from repo frontmatter alone would erase a vault-only `draft: true`, and
 *     since we write back to the vault too, that would publish a private post with no
 *     copy left to recover it from. Asserted against both originals before writing.
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
// Only the vault namespace that maps into content/blog/. `private/`, `reading/` etc.
// have different (or gitignored) destinations and aren't in scope.
const VAULT_SUBDIRS = ['blog']

const args = process.argv.slice(2)
const APPLY = args.includes('--apply')
const VERBOSE = args.includes('--verbose')
const argValue = (flag) => {
  const i = args.indexOf(flag)
  return i === -1 ? null : args[i + 1] || null
}
const ONLY = argValue('--only')
const DIFF_TARGET = argValue('--diff')

/** Normalize `--only 2022/art-setup` / `2022/art-setup.md` / `content/blog/2022/…`. */
const normalizeRel = (s) => {
  if (!s) return null
  let r = s.replace(/^\.?\/*/, '').replace(/^content\/blog\//, '')
  if (!r.endsWith('.md')) r += '.md'
  return r
}

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

// ─────────────────────────────────────────────────────────────────────────────
// Raw document splitting
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Split a markdown file into raw frontmatter text and raw body, WITHOUT round-tripping
 * through YAML. `fmText` is the exact bytes between the `---` fences, so anything we
 * don't deliberately touch survives byte-identical.
 */
function splitDoc(raw) {
  const text = raw.replace(/^\uFEFF/, '')
  const m = /^---\r?\n([\s\S]*?)\r?\n---[ \t]*(\r?\n\r?\n|\r?\n|$)/.exec(text)
  if (!m) return { fmText: null, sep: '\n\n', body: text, trailing: '\n' }
  const body = text.slice(m[0].length)
  return {
    fmText: m[1],
    // The exact bytes between the closing fence and the body. 148 repo files use a
    // single newline and 15 use a blank line; forcing either one would inject cosmetic
    // churn into ~150 files and drown out the real merge signal.
    sep: m[2] || '\n',
    body,
    trailing: /\n$/.test(text) ? '\n' : '',
  }
}

const joinDoc = (fmText, body, sep, trailing) =>
  fmText === null
    ? body
    : `---\n${fmText}\n---${sep}${body.replace(/^\n+/, '')}`.replace(
        /\s*$/,
        trailing
      )

// ─────────────────────────────────────────────────────────────────────────────
// Frontmatter merge (textual splice over the repo's raw YAML)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Find the raw line range of a top-level YAML key: the `key:` line plus every following
 * continuation line (indented, or a `- ` list item, or blank inside the block). Stops at
 * the next line that starts in column 0 with a non-space. Needed because `about` and
 * `tags` can be multi-line and a naive single-line grab would corrupt them.
 */
function keyBlockRange(lines, key) {
  const head = lines.findIndex((l) =>
    new RegExp(`^${key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*:`).test(l)
  )
  if (head === -1) return null
  let end = head + 1
  while (end < lines.length) {
    const l = lines[end]
    if (l.trim() === '') {
      // A blank line only continues the block if an indented line follows it.
      const next = lines.slice(end + 1).find((x) => x.trim() !== '')
      if (next && /^\s/.test(next)) {
        end++
        continue
      }
      break
    }
    if (/^\s/.test(l) || /^-\s/.test(l)) {
      end++
      continue
    }
    break
  }
  return [head, end]
}

const getKeyBlock = (fmText, key) => {
  const lines = fmText.split('\n')
  const range = keyBlockRange(lines, key)
  return range ? lines.slice(range[0], range[1]) : null
}

/**
 * Merge frontmatter. Base = repo (it carries the hygiene work: `ai-involvement`, no
 * `hidden: false`, correct `type`, normalized tags). Then:
 *   - pull `unlisted` / `about` over from the vault (repo lost them)
 *   - drop any surviving `hidden: false` and rename any surviving `aiInvolvement`
 *   - UNION `draft: true` — see the file header for why this one is not repo-wins
 */
function mergeFrontmatter(repoFmText, vaultFmText, repoData, vaultData) {
  const changes = []
  if (repoFmText === null) return { fmText: vaultFmText, changes }
  let lines = repoFmText.split('\n')

  // -- hygiene guards. The repo has almost always done these already; these lines are
  //    the belt-and-braces so a merged doc can never carry the bad form.
  const before = lines.length
  lines = lines.filter((l) => !/^hidden:\s*false\s*$/.test(l.trim()))
  if (lines.length !== before) changes.push('drop hidden:false')

  lines = lines.map((l) => {
    if (/^aiInvolvement\s*:/.test(l)) {
      changes.push('aiInvolvement→ai-involvement')
      return l.replace(/^aiInvolvement\s*:/, 'ai-involvement:')
    }
    return l
  })

  // -- vault-only keys the repo dropped. Splice the RAW vault block so multi-line
  //    values (`about: >-` folded text) come over intact.
  for (const key of ['unlisted', 'about']) {
    if (vaultFmText === null) break
    const block = getKeyBlock(vaultFmText, key)
    if (!block) continue
    const existing = keyBlockRange(lines, key)
    if (existing) {
      // Vault wins per the merge spec; only report if the text actually differs.
      const cur = lines.slice(existing[0], existing[1]).join('\n')
      if (cur !== block.join('\n')) changes.push(`${key} (vault wins)`)
      lines.splice(existing[0], existing[1] - existing[0], ...block)
    } else {
      changes.push(`+${key} from vault`)
      lines.push(...block)
    }
  }

  // -- draft UNION. Never, ever lose `draft: true`.
  const draftEither = vaultData?.draft === true || repoData?.draft === true
  if (draftEither) {
    const range = keyBlockRange(lines, 'draft')
    if (range) {
      if (!/^draft\s*:\s*true\s*$/.test(lines[range[0]].trim())) {
        changes.push('draft:true (union w/ vault)')
        lines.splice(range[0], range[1] - range[0], 'draft: true')
      }
    } else {
      changes.push('+draft:true from vault')
      lines.unshift('draft: true')
    }
  }

  // Trim stray blank lines introduced by filtering, but keep interior structure.
  while (lines.length && lines[lines.length - 1].trim() === '') lines.pop()
  return { fmText: lines.join('\n'), changes }
}

// ─────────────────────────────────────────────────────────────────────────────
// Body merge
// ─────────────────────────────────────────────────────────────────────────────

const MD_IMAGE = /!\[([^\]]*)\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g
const EMBED = /!\[\[([^\]]+)\]\]/g

/** Absolute enough to render as-is: protocol URLs, protocol-relative, or site-root. */
const isAbsolute = (url) =>
  /^(?:https?:)?\/\//i.test(url) || url.startsWith('/')

const baseOf = (url) => {
  const clean = url.split(/[?#]/)[0]
  let last = clean.split('/').pop() || ''
  try {
    last = decodeURIComponent(last)
  } catch {
    /* malformed %-escape: compare the raw form */
  }
  return last
}
const stripExt = (s) => s.replace(/\.[a-z0-9]{2,5}$/i, '')

/**
 * Do two image filenames refer to the same asset? Exact match first, then a PREFIX
 * match: Cloudinary truncates long public IDs, so a vault attachment named
 * `4168054398_Isometric_3D_…_cabinets__shelving.png` can be hosted as
 * `…_cabinets__sh.png`. The 12-char floor stops `IMG_1.png`-style stubs from
 * colliding with everything.
 */
function filenamesMatch(a, b) {
  const x = stripExt(a).toLowerCase()
  const y = stripExt(b).toLowerCase()
  if (!x || !y) return false
  if (x === y) return true
  const [short, long] = x.length <= y.length ? [x, y] : [y, x]
  return short.length >= 12 && long.startsWith(short)
}

/** Every hosted markdown image in the repo body — our substitution dictionary. */
function repoImageIndex(repoBody) {
  const out = []
  for (const m of repoBody.matchAll(MD_IMAGE)) {
    out.push({
      alt: m[1],
      url: m[2],
      base: baseOf(m[2]),
      raw: m[0],
      used: false,
    })
  }
  return out
}

/** Prefer an unconsumed candidate so N embeds don't all collapse onto image #1. */
function pickImage(index, { alt, base }) {
  const tries = [
    (c) => base && filenamesMatch(c.base, base),
    (c) => alt && c.alt && c.alt.trim() === alt.trim(),
  ]
  for (const test of tries) {
    const hit =
      index.find((c) => !c.used && test(c)) || index.find((c) => test(c))
    if (hit) return hit
  }
  return null
}

/**
 * Body merge: vault body is the base (it has the wikilinks), then re-apply the repo's
 * superior transforms — hosted image URLs, generated alt text, archive.org repairs.
 */
function mergeBody(vaultBody, repoBody) {
  const index = repoImageIndex(repoBody)
  const stats = {
    embedsConverted: 0,
    relativeImagesFixed: 0,
    altUpgraded: 0,
    archiveLinks: 0,
  }
  const problems = []
  let body = vaultBody

  // 1. `![[file.png]]` Obsidian embeds. These are the dangerous ones: there is NO
  //    build-time handling for them, so an unconverted embed renders as nothing at all.
  body = body.replace(EMBED, (raw, inner) => {
    const target = inner.split('|')[0].trim()
    const hit = pickImage(index, { alt: null, base: baseOf(target) })
    if (!hit) {
      problems.push({
        kind: 'unmatched-embed',
        detail: raw,
      })
      return raw // never silently emit something that won't render
    }
    hit.used = true
    stats.embedsConverted++
    return `![${hit.alt}](${hit.url})`
  })

  // 2. Markdown images whose URL is a bare filename — same substitution, plus take the
  //    repo's alt text when it's richer (generate-alt-text.mjs wrote those).
  body = body.replace(MD_IMAGE, (raw, alt, url) => {
    if (isAbsolute(url)) return raw
    const hit = pickImage(index, { alt, base: baseOf(url) })
    if (!hit) {
      problems.push({ kind: 'unmatched-image', detail: raw })
      return raw
    }
    hit.used = true
    stats.relativeImagesFixed++
    let finalAlt = alt
    if (hit.alt && hit.alt.trim().length > (alt || '').trim().length) {
      finalAlt = hit.alt
      stats.altUpgraded++
    }
    return `![${finalAlt}](${hit.url})`
  })

  // 3. archive.org link-rot repair. `yarn blog:fix-links` rewrote dead bare URLs in the
  //    repo only. For each archive URL the repo carries, swap the original for it in the
  //    merged body. The vault body contains no archive URLs, so there's no risk of
  //    re-wrapping an already-wrapped link — the `includes` guard makes that explicit.
  const ARCHIVE =
    /https?:\/\/web\.archive\.org\/web\/[\w*]+\/(https?:\/\/[^\s)<>"']+)/gi
  for (const m of repoBody.matchAll(ARCHIVE)) {
    const archiveUrl = m[0]
    const original = m[1]
    if (body.includes(archiveUrl)) continue
    if (!body.includes(original)) continue
    body = body.split(original).join(archiveUrl)
    stats.archiveLinks++
  }

  return { body, stats, problems }
}

// ─────────────────────────────────────────────────────────────────────────────
// Analysis helpers (reporting only)
// ─────────────────────────────────────────────────────────────────────────────

const WIKILINK = /\[\[([^\]]+)\]\]/g
const countWikilinks = (s) =>
  [...s.matchAll(WIKILINK)].filter(
    (m) => !s.slice(m.index - 1, m.index).endsWith('!')
  ).length

const DIRECTIVE = /::\w+\{[^}]*\}/g

/** Same normalization as frontmatter-sync-report.mjs: collapse every known mechanical
 *  transform, so whatever still differs afterwards is real PROSE drift. */
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

/**
 * DIRECTIONAL drift check.
 *
 * A raw "merged body != repo body after normalization" test is useless here, because it
 * fires on the thing we are deliberately doing: the repo didn't merely strip `[[…]]`
 * syntax, it DELETED the whole line or clause that carried the link (`### Dinner` and
 * its link in food.md; four bullets in art-setup.md; a parenthetical mid-sentence in
 * hidden-networks-of-warmth.md). Restoring that text is the point of the merge, not a
 * loss.
 *
 * The only genuinely lossy direction is repo text that does NOT survive into the merged
 * body. So: normalize line by line, and for each repo line missing from the merged body,
 * check whether a merged line still covers ≥90% of its words — that catches the
 * "vault re-expanded a sentence the repo had trimmed" case and keeps it out of the
 * alarm list. Whatever is left is real content only the repo has.
 */
function repoOnlyContent(mergedBody, repoBody) {
  const lines = (s) =>
    s
      .split('\n')
      .map((l) => stripMechanical(l))
      .filter((l) => l.length > 3)
  const mergedLines = lines(mergedBody)
  const mergedSet = new Set(mergedLines)
  const mergedWordSets = mergedLines.map(
    (l) => new Set(l.toLowerCase().split(/\W+/).filter(Boolean))
  )
  const out = []
  for (const line of lines(repoBody)) {
    if (mergedSet.has(line)) continue
    const words = line.toLowerCase().split(/\W+/).filter(Boolean)
    if (!words.length) continue
    const best = Math.max(
      0,
      ...mergedWordSets.map(
        (set) => words.filter((w) => set.has(w)).length / words.length
      )
    )
    if (best < 0.9) out.push(line)
  }
  return out
}

// ─────────────────────────────────────────────────────────────────────────────
// Per-file merge
// ─────────────────────────────────────────────────────────────────────────────

function mergeOne(rel, vaultRaw, repoRaw) {
  const v = splitDoc(vaultRaw)
  const r = splitDoc(repoRaw)
  const vData = matter(vaultRaw).data
  const rData = matter(repoRaw).data

  const fm = mergeFrontmatter(r.fmText, v.fmText, rData, vData)
  const bodyMerge = mergeBody(v.body, r.body)
  // Frontmatter fence spacing and the trailing newline follow the REPO's existing
  // convention — the repo copy is the one that gets code-reviewed, so merge noise there
  // is expensive; the vault file is rewritten anyway.
  const merged = joinDoc(fm.fmText, bodyMerge.body, r.sep, r.trailing)

  // --- assertions ---------------------------------------------------------
  const assertions = []
  // A textual splice can in principle emit YAML that no longer parses, or silently drop
  // a key whose block range we mis-measured. Both would be invisible in a byte diff of
  // 163 files, so check every merged doc structurally.
  let mergedData = {}
  try {
    mergedData = matter(merged).data
  } catch (e) {
    assertions.push(`merged frontmatter does not parse: ${e.message}`)
  }
  for (const k of Object.keys(rData)) {
    if (k === 'hidden' && rData.hidden === false) continue // deliberately dropped
    if (k === 'aiInvolvement') continue // deliberately renamed
    if (!(k in mergedData)) assertions.push(`lost repo key '${k}'`)
  }
  if (
    (vData.draft === true || rData.draft === true) &&
    mergedData.draft !== true
  )
    assertions.push('LOST draft:true')
  if (/^aiInvolvement\s*:/m.test(fm.fmText || ''))
    assertions.push('emitted aiInvolvement')
  if (/^hidden:\s*false\s*$/m.test(fm.fmText || ''))
    assertions.push('emitted hidden:false')
  if ('type' in mergedData && !('type' in rData))
    assertions.push(`emitted type not in repo (${mergedData.type})`)

  // --- what was gained/lost ------------------------------------------------
  const wikilinksRestored = Math.max(
    0,
    countWikilinks(bodyMerge.body) - countWikilinks(r.body)
  )
  const repoDirectives = [...r.body.matchAll(DIRECTIVE)].map((m) => m[0])
  const lostDirectives = repoDirectives.filter(
    (d) => !bodyMerge.body.includes(d)
  )
  const repoOnlyLines = repoOnlyContent(bodyMerge.body, r.body)

  // Positional fallback SUGGESTION for images we couldn't match. motorcycle-camping.md
  // is the motivating case: the repo re-hosted every photo under a new semantic name
  // (`motorcycle-camping-hero.jpg`) while the vault still has the camera-roll UUID, so
  // neither basename nor alt text can ever match. Image order is identical, so the
  // correspondence is obvious to a human — but applying it automatically would silently
  // mis-pair the moment a photo is added or removed on one side. Suggest, never apply.
  const repoImgs = [...r.body.matchAll(MD_IMAGE)]
  const mergedImgs = [...bodyMerge.body.matchAll(MD_IMAGE)]
  for (const p of bodyMerge.problems) {
    const ord = mergedImgs.findIndex((m) => m[0] === p.detail)
    if (ord !== -1 && repoImgs[ord] && repoImgs.length === mergedImgs.length)
      p.suggestion = repoImgs[ord][0]
  }

  return {
    rel,
    merged,
    fmChanges: fm.changes,
    ...bodyMerge.stats,
    wikilinksRestored,
    problems: bodyMerge.problems,
    lostDirectives,
    repoOnlyLines,
    assertions,
    vaultChanges: merged !== vaultRaw,
    repoChanges: merged !== repoRaw,
    vaultRaw,
    repoRaw,
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────────────────────

async function main() {
  const tracked = await trackedRepoPosts()
  const vaultFiles = []
  for (const sub of VAULT_SUBDIRS)
    await walk(path.join(VAULT_ROOT, sub), vaultFiles)

  const only = normalizeRel(ONLY)
  const results = []

  for (const vaultPath of vaultFiles) {
    const rel = contentRelativePath(path.relative(VAULT_ROOT, vaultPath))
    if (!tracked.has(rel)) continue
    if (only && rel !== only) continue
    const repoPath = path.join(ROOT, 'content', 'blog', rel)
    const [vaultRaw, repoRaw] = await Promise.all([
      fs.readFile(vaultPath, 'utf8'),
      fs.readFile(repoPath, 'utf8'),
    ])
    const res = mergeOne(rel, vaultRaw, repoRaw)
    res.vaultPath = vaultPath
    res.repoPath = repoPath
    results.push(res)
  }

  if (only && !results.length) {
    console.error(chalk.red(`--only ${only}: no matched vault/repo pair`))
    process.exit(1)
  }

  // --- idempotency self-test: merging a merged doc with itself must be a no-op.
  //     Catches most substitution bugs (runaway replaces, alt churn, fm re-splicing).
  const nonIdempotent = results.filter(
    (r) => mergeOne(r.rel, r.merged, r.merged).merged !== r.merged
  )

  const changedVault = results.filter((r) => r.vaultChanges)
  const changedRepo = results.filter((r) => r.repoChanges)
  const lostDraft = results.filter((r) =>
    r.assertions.some((a) => a.startsWith('LOST draft'))
  )
  const otherAssertions = results.filter((r) =>
    r.assertions.some((a) => !a.startsWith('LOST draft'))
  )

  // ── report ────────────────────────────────────────────────────────────────
  const h = (s) => console.log('\n' + chalk.bold.underline(s))
  const sum = (k) => results.reduce((a, r) => a + (r[k] || 0), 0)

  console.log(
    chalk.bold.cyan('\n  Vault ↔ repo MERGE ') +
      (APPLY ? chalk.bgRed.white(' APPLY ') : chalk.bgGreen.black(' DRY RUN '))
  )
  console.log(chalk.gray(`  vault: ${VAULT_ROOT}/blog`))
  console.log(chalk.gray(`  repo:  ${path.join(ROOT, 'content/blog')}`))

  // Files the merge knows it would degrade are never written, even under --apply.
  const unsafe = results.filter(
    (r) => r.problems.length || r.lostDirectives.length
  )
  const wouldWriteVault = changedVault.filter((r) => !unsafe.includes(r))
  const wouldWriteRepo = changedRepo.filter((r) => !unsafe.includes(r))

  h('Corpus')
  console.log(`  matched vault/repo pairs:   ${chalk.bold(results.length)}`)
  console.log(
    `  would change VAULT file:    ${chalk.bold.cyan(changedVault.length)}`
  )
  console.log(
    `  would change REPO file:     ${chalk.bold.magenta(changedRepo.length)}`
  )
  console.log(
    `  byte-identical already:     ${chalk.green(results.filter((r) => !r.vaultChanges && !r.repoChanges).length)}`
  )
  console.log(
    `  held back as unsafe:        ${chalk.yellow(unsafe.length)} ${chalk.gray('(never written, even with --apply — see AMBIGUOUS below)')}`
  )
  console.log(
    chalk.gray(
      `  → --apply would write ${wouldWriteVault.length} vault / ${wouldWriteRepo.length} repo files`
    )
  )

  h('What the merge did, by category')
  const filesWith = (k) => results.filter((r) => (r[k] || 0) > 0).length
  const row = (label, n, files, note = '') =>
    console.log(
      `  ${label.padEnd(30)} ${String(n).padStart(5)}  ${chalk.gray(`in ${files} files`)} ${chalk.gray(note)}`
    )
  row(
    'wikilinks restored',
    sum('wikilinksRestored'),
    filesWith('wikilinksRestored'),
    '(vault prose → repo)'
  )
  row(
    '![[embeds]] → hosted image',
    sum('embedsConverted'),
    filesWith('embedsConverted')
  )
  row(
    'relative images → Cloudinary',
    sum('relativeImagesFixed'),
    filesWith('relativeImagesFixed')
  )
  row('alt text upgraded', sum('altUpgraded'), filesWith('altUpgraded'))
  row('archive.org links kept', sum('archiveLinks'), filesWith('archiveLinks'))

  const fmByKind = new Map()
  for (const r of results)
    for (const c of r.fmChanges) fmByKind.set(c, (fmByKind.get(c) || 0) + 1)
  h('Frontmatter keys changed')
  if (!fmByKind.size) console.log(chalk.gray('  none'))
  for (const [k, n] of [...fmByKind].sort((a, b) => b[1] - a[1]))
    console.log(`  ${k.padEnd(30)} ${String(n).padStart(5)} files`)

  // ── the assertion the brief demands ───────────────────────────────────────
  h('ASSERTION: zero files lose draft:true')
  const draftSources = results.filter(
    (r) =>
      matter(r.vaultRaw).data.draft === true ||
      matter(r.repoRaw).data.draft === true
  )
  console.log(
    `  files with draft:true on either side: ${chalk.bold(draftSources.length)}`
  )
  console.log(
    `  merged output still draft:true:       ${chalk.bold(draftSources.length - lostDraft.length)}`
  )
  console.log(
    lostDraft.length
      ? chalk.bgRed.white(
          `  ✗ FAIL — ${lostDraft.length} would lose draft:true`
        )
      : chalk.bold.green('  ✓ PASS — zero files lose draft:true')
  )
  lostDraft.forEach((r) => console.log(chalk.red(`    ${r.rel}`)))

  h('Other invariants')
  console.log(
    otherAssertions.length
      ? chalk.red(`  ✗ ${otherAssertions.length} violations`)
      : chalk.green(
          '  ✓ no aiInvolvement, no hidden:false, no repo-absent type emitted'
        )
  )
  otherAssertions.forEach((r) =>
    console.log(chalk.red(`    ${r.rel}: ${r.assertions.join(', ')}`))
  )
  console.log(
    nonIdempotent.length
      ? chalk.red(
          `  ✗ ${nonIdempotent.length} files not idempotent under re-merge`
        )
      : chalk.green(
          '  ✓ merge is idempotent (re-merging a merged doc is a no-op)'
        )
  )
  nonIdempotent.forEach((r) => console.log(chalk.red(`    ${r.rel}`)))

  // ── ambiguous / lossy ─────────────────────────────────────────────────────
  h('AMBIGUOUS OR LOSSY — needs manual attention')
  const flagged = results.filter(
    (r) =>
      r.problems.length || r.lostDirectives.length || r.repoOnlyLines.length
  )
  if (!flagged.length) {
    console.log(chalk.green('  none'))
  } else {
    for (const r of flagged) {
      console.log('  ' + chalk.bold.yellow(r.rel))
      for (const p of r.problems) {
        console.log(
          chalk.red(`    ⚠ ${p.kind}: ${p.detail}`) +
            chalk.gray(
              '  ← WILL NOT RENDER; no repo counterpart by basename or alt'
            )
        )
        if (p.suggestion)
          console.log(
            chalk.gray('        positional suggestion (NOT applied): ') +
              p.suggestion
          )
      }
      for (const d of r.lostDirectives)
        console.log(
          chalk.red(`    ⚠ repo directive dropped by vault body: ${d}`)
        )
      for (const l of r.repoOnlyLines)
        console.log(
          chalk.yellow('    ⚠ repo-only text absent from merged body: ') +
            chalk.gray(l.length > 110 ? l.slice(0, 107) + '…' : l)
        )
    }
  }

  if (VERBOSE) {
    h('Per-file changes')
    for (const r of results.filter((x) => x.vaultChanges || x.repoChanges)) {
      const bits = [
        r.wikilinksRestored && `+${r.wikilinksRestored} wikilinks`,
        r.embedsConverted && `${r.embedsConverted} embeds`,
        r.relativeImagesFixed && `${r.relativeImagesFixed} imgs`,
        r.archiveLinks && `${r.archiveLinks} archive`,
        r.fmChanges.length && `fm: ${r.fmChanges.join('; ')}`,
      ].filter(Boolean)
      console.log(
        `  ${r.rel.padEnd(52)} ${chalk.gray(bits.join(', ') || 'body/fm reflow')}`
      )
    }
  }

  // ── unified diff for one file ─────────────────────────────────────────────
  const diffRel = normalizeRel(DIFF_TARGET) || (only ? only : null)
  if (diffRel) {
    const r = results.find((x) => x.rel === diffRel)
    if (r) {
      const tmp = path.join(ROOT, '.merge-diff-tmp')
      await fs.mkdir(tmp, { recursive: true })
      const files = {
        vault: path.join(tmp, 'vault.md'),
        repo: path.join(tmp, 'repo.md'),
        merged: path.join(tmp, 'merged.md'),
      }
      await fs.writeFile(files.vault, r.vaultRaw)
      await fs.writeFile(files.repo, r.repoRaw)
      await fs.writeFile(files.merged, r.merged)
      for (const [label, from] of [
        ['VAULT → MERGED', files.vault],
        ['REPO  → MERGED', files.repo],
      ]) {
        h(`Diff ${r.rel}: ${label}`)
        const { stdout } = await execFileAsync(
          'git',
          ['diff', '--no-index', '--no-color', '-U3', from, files.merged],
          { cwd: ROOT }
        ).catch((e) => ({ stdout: e.stdout || '' }))
        console.log(stdout.trim() || chalk.green('  (identical)'))
      }
      await fs.rm(tmp, { recursive: true, force: true })
    }
  }

  // ── write ─────────────────────────────────────────────────────────────────
  if (!APPLY) {
    console.log(
      chalk.gray(
        '\n  DRY RUN — nothing was written. Re-run with --apply to write both sides.\n'
      )
    )
    return
  }

  if (lostDraft.length || otherAssertions.length) {
    console.error(
      chalk.bgRed.white('\n  REFUSING TO APPLY: invariant violations above.\n')
    )
    process.exit(1)
  }

  // A flagged file is one the merge KNOWS it would degrade: an image with no repo
  // counterpart stays a bare filename (the repo copy currently has a working hosted
  // URL), or a repo-side `::gear{…}` directive is absent from the vault body. Writing
  // those would trade a rendering post for a broken one — "report it loudly" has to mean
  // "and don't write it", or the loud report is just a changelog of the damage.
  // Resolve them by hand (the positional suggestions above are a starting point), then
  // re-run; the skip disappears once the file merges cleanly.
  const writable = results.filter(
    (r) => !r.problems.length && !r.lostDirectives.length
  )
  const skipped = results.filter(
    (r) => r.problems.length || r.lostDirectives.length
  )
  if (skipped.length) {
    console.log(
      chalk.bold.yellow(
        `\n  SKIPPED ${skipped.length} file(s) — resolve manually first:`
      )
    )
    skipped.forEach((r) => console.log(chalk.yellow(`    ${r.rel}`)))
  }

  // Back up EVERY vault file we're about to touch, before touching any of them.
  const toWriteVault = writable.filter((r) => r.vaultChanges)
  const toWriteRepo = writable.filter((r) => r.repoChanges)
  const stamp = new Date().toISOString().replace(/[:.]/g, '-')
  const backupDir = path.join(ROOT, `.vault-backup-${stamp}`)
  for (const r of toWriteVault) {
    const dest = path.join(backupDir, r.rel)
    await fs.mkdir(path.dirname(dest), { recursive: true })
    await fs.copyFile(r.vaultPath, dest)
  }
  console.log(
    chalk.bold(`\n  Vault backup: ${backupDir}  (${toWriteVault.length} files)`)
  )

  for (const r of writable) {
    if (r.vaultChanges) await fs.writeFile(r.vaultPath, r.merged)
    if (r.repoChanges) await fs.writeFile(r.repoPath, r.merged)
  }
  console.log(
    chalk.green(
      `  wrote ${toWriteVault.length} vault files, ${toWriteRepo.length} repo files\n`
    )
  )
}

main().catch((err) => {
  console.error(chalk.red('vault-repo-merge failed:'), err)
  process.exit(1)
})
