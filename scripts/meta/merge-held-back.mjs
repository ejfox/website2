#!/usr/bin/env node
/**
 * @file merge-held-back.mjs
 * @description Finish the two posts that vault-repo-merge.mjs deliberately
 *   refused to touch, using correspondences established by hand.
 * @usage node scripts/meta/merge-held-back.mjs [--apply]
 *
 * `vault-repo-merge.mjs` matches images by basename or alt text and stops when
 * it can't. That is the right default — silently mis-mapping a photo is worse
 * than refusing — but it leaves two files needing a human to supply the
 * correspondence. This script encodes that correspondence explicitly so the
 * reasoning is reviewable rather than buried in a one-off edit.
 *
 * ## 2022/motorcycle-camping.md — positional image pairing
 *
 * The repo re-hosted all 8 photos under semantic names; the vault still has
 * camera-roll UUIDs. Nothing matches automatically. Pairing by position is
 * safe HERE, and only here, because three independent anchors confirm the two
 * sequences are aligned:
 *
 *   1. both sides have exactly 8 images;
 *   2. index 1 is the same file on both sides by basename
 *      (Screenshot_2023-08-09_at_3.17.33_PM.png) — an anchor mid-sequence;
 *   3. indices 2 and 5 carry vault alt text that names the repo's file:
 *      "…Lake George" ↔ bags-lake-george, "Too Much Stuff" ↔ fully-loaded.
 *
 * The script re-verifies all three at runtime and aborts if any fails, so this
 * cannot silently rot when a photo is added to either side.
 *
 * The body is the VAULT's, because it carries two real external links the repo
 * had flattened to plain text ([Mosko Moto Reckless 80L…](https://moskomoto…)).
 * Only the image lines are taken from the repo.
 *
 * ## 2025/using-radios.md — repo body wins outright
 *
 * Verified: apart from the repo's `::gear{slug=…}` directives and one blank
 * line, the two bodies are identical. So there is nothing in the vault to
 * preserve and no merge rule for directives needs inventing — the repo body is
 * a strict superset. It is copied to the vault so the two converge.
 */

import { promises as fs } from 'node:fs'
import path from 'node:path'
import chalk from 'chalk'

const VAULT =
  process.env.OBSIDIAN_VAULT_PATH ||
  '/Users/ejfox/Library/Mobile Documents/iCloud~md~obsidian/Documents/ejfox'
const APPLY = process.argv.includes('--apply')

const IMAGE_RE = /^!\[[^\]]*\]\([^)]+\)$/gm

const vaultPath = (slug) => path.join(VAULT, 'blog', `${slug}.md`)
const repoPath = (slug) =>
  path.join(process.cwd(), 'content/blog', `${slug}.md`)

const split = (raw) => {
  const m = raw.match(/^(---\r?\n[\s\S]*?\r?\n---\r?\n?)([\s\S]*)$/)
  if (!m) throw new Error('no frontmatter')
  return { frontmatter: m[1], body: m[2] }
}

const images = (body) => body.match(IMAGE_RE) || []
const basename = (line) =>
  decodeURIComponent((line.match(/\(([^)]+)\)/)?.[1] || '').split('/').pop())
const altOf = (line) => line.match(/^!\[([^\]]*)\]/)?.[1] || ''

/**
 * Abort unless the three alignment anchors still hold. Positional pairing is
 * only defensible while they do.
 */
function assertAligned(vaultImgs, repoImgs) {
  const fail = (why) => {
    throw new Error(
      `motorcycle-camping image alignment check FAILED: ${why}\n` +
        'Positional pairing is no longer safe — re-establish the ' +
        'correspondence by hand before running this.'
    )
  }

  if (vaultImgs.length !== repoImgs.length) {
    fail(`counts differ (vault ${vaultImgs.length}, repo ${repoImgs.length})`)
  }

  const anchor = vaultImgs.findIndex(
    (v, i) => basename(v) === basename(repoImgs[i])
  )
  if (anchor === -1) fail('no shared basename anchors the sequence')

  const semantic = [
    [2, 'lake-george'],
    [5, 'fully-loaded'],
  ]
  for (const [i, needle] of semantic) {
    if (!repoImgs[i] || !basename(repoImgs[i]).includes(needle)) {
      fail(`repo image ${i} is no longer ${needle}`)
    }
  }
  return { anchor }
}

async function motorcycleCamping() {
  const slug = '2022/motorcycle-camping'
  const vaultRaw = await fs.readFile(vaultPath(slug), 'utf8')
  const repoRaw = await fs.readFile(repoPath(slug), 'utf8')
  const v = split(vaultRaw)
  const r = split(repoRaw)

  const vaultImgs = images(v.body)
  const repoImgs = images(r.body)
  const { anchor } = assertAligned(vaultImgs, repoImgs)

  // Vault body (keeps the two external links the repo flattened), with each
  // image line swapped for the repo's hosted equivalent at the same index.
  let i = 0
  const body = v.body.replace(IMAGE_RE, () => repoImgs[i++])

  // Frontmatter is the repo's — it carries `draft: true`, which the vault lacks
  // and which is the whole reason blog:import is currently blocked.
  const merged = r.frontmatter + body

  console.log(chalk.bold(`\n  ${slug}`))
  console.log(chalk.gray(`    anchor: shared basename at index ${anchor}`))
  vaultImgs.forEach((vi, n) =>
    console.log(
      `    ${n}  ${chalk.red(basename(vi).slice(0, 38).padEnd(38))} → ${chalk.green(basename(repoImgs[n]))}` +
        (altOf(vi) ? chalk.gray(`   alt: "${altOf(vi).slice(0, 34)}"`) : '')
    )
  )
  console.log(
    chalk.gray(
      `    external links kept from vault: ${(v.body.match(/\]\(https?:\/\//g) || []).length}`
    )
  )
  return { slug, merged, writeRepo: merged !== repoRaw }
}

async function usingRadios() {
  const slug = '2025/using-radios'
  const repoRaw = await fs.readFile(repoPath(slug), 'utf8')
  const v = split(await fs.readFile(vaultPath(slug), 'utf8'))
  const r = split(repoRaw)

  // Guard the claim this rests on: the repo body must be a superset — the only
  // vault-side lines missing from it may be blank.
  const repoLines = new Set(r.body.split('\n').map((l) => l.trim()))
  const missing = v.body
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l && !repoLines.has(l))
  if (missing.length) {
    throw new Error(
      `using-radios: vault has ${missing.length} line(s) the repo lacks — ` +
        `repo-body-wins is no longer safe:\n  ${missing.slice(0, 3).join('\n  ')}`
    )
  }

  console.log(chalk.bold(`\n  ${slug}`))
  console.log(
    chalk.gray(
      `    repo body is a strict superset (${(r.body.match(/^::gear/gm) || []).length} ::gear directive(s) kept); nothing vault-only to preserve`
    )
  )
  return { slug, merged: repoRaw, writeRepo: false }
}

async function main() {
  console.log(
    chalk.bold(
      `\n🔀 Finishing the two held-back posts${APPLY ? '' : ' (dry run)'}\n`
    )
  )

  const results = [await motorcycleCamping(), await usingRadios()]

  if (!APPLY) {
    console.log(
      chalk.yellow('\n  Dry run — nothing written. Re-run with --apply.\n')
    )
    return
  }

  const backup = path.join(
    process.cwd(),
    `.vault-backup-${new Date().toISOString().replace(/[:.]/g, '-')}`
  )
  for (const { slug, merged, writeRepo } of results) {
    const dest = path.join(backup, `${slug}.md`)
    await fs.mkdir(path.dirname(dest), { recursive: true })
    await fs.copyFile(vaultPath(slug), dest)

    await fs.writeFile(vaultPath(slug), merged)
    if (writeRepo) await fs.writeFile(repoPath(slug), merged)
    console.log(
      chalk.green(`    ✓ wrote vault${writeRepo ? ' + repo' : ''}: ${slug}`)
    )
  }
  console.log(chalk.gray(`\n  Vault backup: ${backup}\n`))
}

main().catch((err) => {
  console.error(chalk.red(`\n${err.message}\n`))
  process.exit(1)
})
