#!/usr/bin/env node
/**
 * @file import-sealed.mjs
 * @description Copy sealed posts from the Obsidian vault's `private/` folder
 *   into `content/blog/private/`. Nothing else, and nothing destructive.
 * @usage yarn seal:import  (or `yarn seal`, which also processes)
 * @env DRY_RUN - list what would be copied, write nothing
 * @env OBSIDIAN_VAULT_PATH - override the vault location
 *
 * ## Why this exists instead of `yarn blog:import`
 *
 * `blog:import` does `fs.rm(content/blog, {recursive:true})` and rebuilds the
 * whole tree from the vault. That is fine in principle — the vault is meant to
 * be the source of truth — but as of 2026-09 the two have drifted badly: the
 * vault keeps posts under `blog/<year>/`, so the importer's
 * `path.join('content/blog', 'blog/2022/x.md')` writes `content/blog/blog/2022/`,
 * one level deeper than the 366 files actually committed. Running it today
 * deletes every `reading/` note and most years, then rebuilds ~169 files in the
 * wrong shape.
 *
 * Publishing a sealed post must not require fixing that first. This script
 * touches exactly one directory, never deletes a post it did not just consider,
 * and cannot affect any public content — so the sealed workflow is safe to use
 * while `blog:import` stays broken.
 *
 * `content/blog/private/` is gitignored, so everything written here stays out
 * of the public repo. Only the sealed envelope in `content/processed/private/`
 * is ever committed.
 */

import { promises as fs } from 'node:fs'
import path from 'node:path'
import chalk from 'chalk'
import { dirs } from '../config.mjs'

const VAULT =
  process.env.OBSIDIAN_VAULT_PATH ||
  '/Users/ejfox/Library/Mobile Documents/iCloud~md~obsidian/Documents/ejfox'

const SOURCE = path.join(VAULT, 'private')
const DEST = path.join(dirs.content, 'private')
const isDryRun = process.env.DRY_RUN === 'true'

async function markdownFilesIn(dir, base = '') {
  const out = []
  let entries
  try {
    entries = await fs.readdir(dir, { withFileTypes: true })
  } catch {
    return out
  }
  for (const entry of entries) {
    const full = path.join(dir, entry.name)
    const rel = base ? path.join(base, entry.name) : entry.name
    if (entry.isDirectory()) {
      if (entry.name.startsWith('.')) continue
      out.push(...(await markdownFilesIn(full, rel)))
    } else if (
      entry.name.endsWith('.md') &&
      !entry.name.includes('.canvas.md')
    ) {
      out.push({ full, rel })
    }
  }
  return out
}

async function main() {
  console.log(chalk.bold('\n🔐 Importing sealed posts from the vault\n'))

  try {
    await fs.access(SOURCE)
  } catch {
    console.log(chalk.yellow(`No sealed posts: ${SOURCE} does not exist.`))
    console.log(
      chalk.gray(
        'Create a `private/` folder in the vault and write a post in it.\n'
      )
    )
    return
  }

  const files = await markdownFilesIn(SOURCE)

  // Prune stale copies BEFORE the empty-vault early return, not after. Deleting
  // your last sealed post lands in exactly that case, and an early return there
  // would leave the plaintext sitting in the working tree to be re-sealed
  // forever — the one moment the prune matters most is the one it would skip.
  // Scoped to this single gitignored directory; it can never touch a public post.
  const keep = new Set(files.map((f) => f.rel))
  for (const { rel, full } of await markdownFilesIn(DEST)) {
    if (keep.has(rel)) continue
    console.log(chalk.red(`- ${rel}`) + chalk.gray('  (gone from vault)'))
    if (!isDryRun) await fs.rm(full)
  }

  if (!files.length) {
    console.log(chalk.yellow('\nNo .md files in the vault’s private/ folder.'))
    console.log(
      chalk.gray(
        'If you just deleted one, also remove its envelope from\n' +
          'content/processed/private/ and its key from .postkeys.json —\n' +
          'orphan cleanup deliberately leaves sealed envelopes alone.\n'
      )
    )
    return
  }

  for (const { full, rel } of files) {
    const dest = path.join(DEST, rel)
    const isNew = !(await fs
      .access(dest)
      .then(() => true)
      .catch(() => false))
    console.log(isNew ? chalk.green(`+ ${rel}`) : chalk.blue(`~ ${rel}`))
    if (!isDryRun) {
      await fs.mkdir(path.dirname(dest), { recursive: true })
      await fs.copyFile(full, dest)
    }
  }

  console.log(
    chalk.gray(
      `\n${isDryRun ? '[DRY] ' : ''}${files.length} sealed post(s) → ` +
        `${path.relative(process.cwd(), DEST)}/ (gitignored)\n` +
        'Next: yarn blog:process — it seals them and prints the links.\n'
    )
  )
}

main().catch((err) => {
  console.error(chalk.red(err.stack || err.message))
  process.exit(1)
})
