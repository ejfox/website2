/**
 * @file blog/import.mjs
 * @description Obsidian to blog content import pipeline - syncs whitelisted folders from Obsidian vault to blog content directory
 * @usage yarn blog:import OR node scripts/blog/import.mjs
 * @env DRY_RUN - Run without writing files (optional)
 */

// Obsidian → Blog Import Pipeline
import { promises as fs } from 'node:fs'
import path from 'node:path'
import matter from 'gray-matter'
import chalk from 'chalk'
import ora from 'ora'

import { dirs } from '../config.mjs'

const SOURCE_DIR =
  '/Users/ejfox/Library/Mobile Documents/iCloud~md~obsidian/Documents/ejfox/'
// SECURITY: Only folders that should be published go here
// drafts/ is INTENTIONALLY EXCLUDED - it's private thinking space
const WHITELISTED_FOLDERS = [
  'blog',
  // Sealed posts. Imported to content/blog/private/, which is GITIGNORED —
  // the plaintext reaches the renderer and stops there. Only the AES envelope
  // in content/processed/private/ is ever committed. This folder is the ONLY
  // switch that makes a post private: no frontmatter key does, so no typo in
  // one can publish a post. See utils/postSeal.mjs.
  'private',
  // 'week-notes', // DISABLED: Caused chilling effect - enable explicitly if needed
  'robots',
  'reading',
  'projects',
  'prompts',
  // 'drafts', // NEVER include - private by design
  '2025',
  '2024',
  '2023',
  '2022',
  '2021',
  '2020',
  '2019',
  '2018',
]

/**
 * Top-level vault FILES that may be imported. The folder whitelist only ever
 * gated directories, so every loose .md at the vault root — `inbox.md`,
 * `CLAUDE.md`, `Pamara-list.md` — was imported as a blog post regardless of
 * what the whitelist said.
 */
const WHITELISTED_ROOT_FILES = ['index.md']

/**
 * True if a vault-relative directory path is inside a whitelisted folder.
 * Compares path segments, so `private` matches `private/` and `private/sub/`
 * but never `private-drafts/` or `privateer/`.
 */
const isWhitelisted = (relPath) => {
  const segments = relPath.split(path.sep)
  return WHITELISTED_FOLDERS.includes(segments[0])
}

/**
 * Where a vault file lands under `content/blog/`.
 *
 * The vault keeps posts in `blog/<year>/` and `blog/projects/`, but the repo
 * serves them from `content/blog/<year>/`. Joining the vault-relative path
 * straight onto `content/blog` therefore produced `content/blog/blog/2022/…`
 * — one level too deep, matching nothing that was ever committed, and
 * silently giving every such post the wrong `type` as well, since
 * `getPostType` matches on a `projects/` prefix that `blog/projects/` doesn't
 * have.
 */
const contentRelativePath = (relPath) =>
  relPath.startsWith(`blog${path.sep}`) ? relPath.slice(5) : relPath

const stats = {
  filesProcessed: 0,
  filesAdded: [],
  filesSkipped: [],
  errors: [],
  filesByType: {},
  startTime: Date.now(),
}
const debug = (...args) =>
  process.env.DEBUG === 'true' && console.log(chalk.gray('[DEBUG]'), ...args)

const getPostType = (path) => {
  const typeMap = {
    'drafts/': 'draft',
    'robots/': 'robot',
    'week-notes/': 'weekNote',
    'reading/': 'reading',
    'projects/': 'project',
    'prompts/': 'prompt',
  }
  return (
    Object.entries(typeMap).find(([prefix]) => path.startsWith(prefix))?.[1] ||
    'post'
  )
}

const getWeekNoteDate = (slug) => {
  const match = slug.match(/(\d{4})-(\d{2})/)
  if (!match) return new Date().toISOString()
  const [, year, week] = match
  const date = new Date(+year, 0, 1 + (+week - 1) * 7)
  return date.toISOString()
}

async function processFile(filePath, isDryRun = false) {
  const relativePath = path.relative(SOURCE_DIR, filePath)

  // Skip the broken projects.md file
  if (relativePath === 'projects/projects.md') {
    console.log(chalk.yellow(`⚠ Skipping broken file: ${relativePath}`))
    stats.filesSkipped.push(filePath)
    return null
  }

  const content = await fs.readFile(filePath, 'utf8')
  const { data: frontmatter, content: markdown } = matter(content)

  // Everything downstream — the destination path, the post type, the slug —
  // keys off where the file lands in the repo, not where it sits in the vault.
  const contentPath = contentRelativePath(relativePath)

  const words = markdown.split(/\s+/).length
  const postType = getPostType(contentPath)
  const metadata = {
    ...frontmatter,
    slug: contentPath.replace(/\.md$/, ''),
    type: postType,
    date: frontmatter.date || getWeekNoteDate(relativePath),
    wordCount: words,
    readingTime: Math.ceil(words / 250),
    imageCount: (markdown.match(/!\[.*?\]\(.*?\)/g) || []).length,
    linkCount: (markdown.match(/\[.*?\]\(.*?\)/g) || []).length,
    share: postType === 'robot' ? frontmatter.share === true : true,
  }

  if (!metadata.share) {
    debug(`Skipping private: ${relativePath}`)
    stats.filesSkipped.push(relativePath)
    console.log(chalk.yellow(`Skipping private: ${relativePath}`))
    return null
  }

  if (!isDryRun) {
    const outputPath = path.join(dirs.content, contentPath)
    const isNew = !(await fs
      .access(outputPath)
      .then(() => true)
      .catch(() => false))

    await fs.mkdir(path.dirname(outputPath), { recursive: true })
    await fs.writeFile(outputPath, content)

    console.log(
      isNew
        ? chalk.green(`+ ${metadata.slug}`)
        : chalk.blue(`~ ${metadata.slug}`)
    )
    stats.filesAdded.push(outputPath)
  }

  stats.filesProcessed++
  stats.filesByType[metadata.type] = (stats.filesByType[metadata.type] || 0) + 1
  return metadata
}

async function findMarkdownFiles() {
  const allFiles = []

  async function scan(dir) {
    const entries = await fs.readdir(dir, { withFileTypes: true })

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name)

      // Never follow symlinks. readFile/cp follow them, so a symlinked .md
      // could import content from OUTSIDE the vault/whitelist into a public
      // repo; a symlinked dir would be silently skipped. Refuse both.
      if (entry.isSymbolicLink()) {
        console.warn(
          chalk.yellow(
            `  ↳ skipping symlink: ${path.relative(SOURCE_DIR, fullPath)}`
          )
        )
        continue
      }

      if (entry.isDirectory()) {
        if (entry.name.startsWith('.') || entry.name === 'node_modules')
          continue
        const relPath = path.relative(SOURCE_DIR, fullPath)
        // Whole path SEGMENTS, not a string prefix. `startsWith` let any
        // folder whose name merely begins with a whitelisted one through, so a
        // vault folder called `private-drafts/` would be imported to
        // `content/blog/private-drafts/` — which is neither gitignored nor
        // sealed (both key on exactly `private/`), i.e. published in full. Same
        // class of bug for `blogroll/` vs `blog/`. The whitelist is the only
        // thing standing between the vault and a public repo; it should mean
        // what it says.
        if (isWhitelisted(relPath)) await scan(fullPath)
      } else if (
        entry.name.endsWith('.md') &&
        !entry.name.includes('.canvas.md')
      ) {
        // A file at the vault ROOT is only imported if it's explicitly listed.
        // Files inside a directory are already covered: scan() only descends
        // into whitelisted ones.
        const atVaultRoot = path.relative(SOURCE_DIR, dir) === ''
        if (atVaultRoot && !WHITELISTED_ROOT_FILES.includes(entry.name)) {
          continue
        }
        allFiles.push(fullPath)
      }
    }
  }

  await scan(SOURCE_DIR)
  return allFiles
}

/**
 * Refuse to import if doing so would strip `draft: true` off a post that is
 * currently a draft in the repo.
 *
 * `processFile` writes the vault file's raw bytes — it never re-serialises the
 * frontmatter it parsed — so an import is a wholesale revert of every
 * repo-side edit, frontmatter included. 15 posts are `draft: true` in the repo
 * and carry no draft flag in the vault, which means one `yarn blog:import`
 * silently publishes all 15. Nothing downstream catches it: `blog:process`
 * happily renders them, the manifest lists them, and the only evidence is 15
 * lines in a `git status` that also shows ~160 other modified files.
 *
 * "Review the diff before committing" is not a control when the diff is that
 * noisy and the failure is that quiet. This is the repo's fail-closed-and-loud
 * rule applied to the one difference that publishes private writing.
 *
 * Deliberately NOT auto-fixed here: merging frontmatter per key is a real
 * design change with judgement calls about which side wins. This just stops
 * the bleeding, and it runs in DRY_RUN too so you can see the problem without
 * risking the tree.
 */
async function assertNoDraftWouldBePublished(files, spinner) {
  // Returns true (protected) / false (not) / null (unparseable). Because the
  // importer writes vault bytes verbatim, ANY protection flag the repo added
  // that the vault lacks would be silently stripped and published — not just
  // `draft`. Mirror server/api's isProtectedContent set.
  const protectionState = (raw) => {
    try {
      const d = matter(raw).data || {}
      return (
        d.draft === true ||
        d.hidden === true ||
        d.unlisted === true ||
        !!d.password ||
        !!d.passwordHash
      )
    } catch {
      return null // malformed frontmatter — can't assess
    }
  }

  const offenders = []
  for (const filePath of files) {
    const contentPath = contentRelativePath(path.relative(SOURCE_DIR, filePath))
    const repoPath = path.join(dirs.content, contentPath)

    const repoRaw = await fs.readFile(repoPath, 'utf8').catch(() => null)
    if (repoRaw === null) continue // not in the repo — nothing to overwrite
    const repoState = protectionState(repoRaw)
    if (repoState === false) continue // repo isn't protected → import can't strip protection

    // repo is protected (or unparseable). Flag unless the vault DEFINITELY keeps
    // it protected — an unparseable vault file counts as "can't confirm" → flag.
    const vaultRaw = await fs.readFile(filePath, 'utf8').catch(() => null)
    const vaultState = vaultRaw === null ? false : protectionState(vaultRaw)
    if (vaultState !== true) offenders.push(contentPath)
  }

  if (!offenders.length) return

  spinner.fail('Import aborted — would publish protected posts')
  console.error(
    chalk.red.bold(
      `\n🚨 ${offenders.length} post(s) are protected (draft/hidden/unlisted/password) in the repo but not in the vault\n`
    )
  )
  for (const slug of offenders) console.error(chalk.red(`  ${slug}`))
  console.error(
    chalk.yellow(
      '\nImporting overwrites each file with the vault copy verbatim, so every\n' +
        'one of these would lose its protection flag and publish on the next deploy.\n\n' +
        'Fix by making the vault agree — add the missing flag (draft/hidden/\n' +
        'unlisted/password) to those notes — or reconcile the two properly (see\n' +
        'the frontmatter divergence section in CLAUDE.md). Re-run when they match.\n'
    )
  )
  process.exit(1)
}

async function main() {
  const isDryRun = process.env.DRY_RUN === 'true'
  const spinner = ora('Starting import...').start()

  try {
    const files = await findMarkdownFiles()
    if (!files.length) throw new Error('No markdown files found')

    // Before writing a single byte.
    await assertNoDraftWouldBePublished(files, spinner)

    if (!isDryRun) {
      const contentExists = await fs
        .access(dirs.content)
        .then(() => true)
        .catch(() => false)
      if (contentExists) {
        // Snapshot content BEFORE touching it, WITHOUT destroying the previous
        // snapshot first. The old code rm'd the backup, then re-created it — so
        // a crash mid-backup (or simply re-running after a failed import) wiped
        // the only good copy. Build into a temp dir and swap it in atomically.
        // Manual restore if ever needed: rm -rf content/blog && mv content/backup content/blog
        const tmpBackup = `${dirs.backup}.tmp`
        await fs.rm(tmpBackup, { recursive: true, force: true })
        await fs.cp(dirs.content, tmpBackup, { recursive: true })
        await fs.rm(dirs.backup, { recursive: true, force: true })
        await fs.rename(tmpBackup, dirs.backup)
      }

      // This import deletes NOTHING. It only overwrites what it writes.
      //
      // The tempting middle ground — wipe just the top-level destinations this
      // run rebuilds — is still wrong, because a managed destination is not the
      // same thing as a vault-owned one. `robots/` is imported, but all 13 of
      // its vault files are `share: false`, so the 13 files actually living in
      // `content/blog/robots/{anytime,old,someday}/` came from nowhere the
      // import can see; `2026/the-knife.md` isn't in the vault at all. Scoped
      // or unscoped, a wipe can't tell "deleted in the vault" from "only ever
      // existed in the repo" — and guessing wrong destroys posts (202 of them,
      // counting the un-whitelisted `week-notes/` and the trashed `reading/`).
      //
      // The cost of deleting nothing is a stale copy left behind when a post is
      // renamed or deleted in the vault. That shows up in `git status` and is
      // one `git rm` away from fixed. Prefer the failure mode you can see.
      await fs.mkdir(dirs.content, { recursive: true })
    }

    spinner.text = `Processing ${files.length} files...`

    for (const file of files) {
      try {
        await processFile(file, isDryRun)
      } catch (error) {
        stats.errors.push({ file, error: error.message })
      }
    }

    spinner.succeed(
      `${isDryRun ? '[DRY] ' : ''}Processed ${stats.filesProcessed} files`
    )

    console.log('\n📊 Summary')
    console.log(
      `Files: ${stats.filesProcessed}, Skipped: ${stats.filesSkipped.length}`
    )
    Object.entries(stats.filesByType).forEach(([type, count]) =>
      console.log(`${type}: ${count}`)
    )

    const duration = ((Date.now() - stats.startTime) / 1000).toFixed(1)
    console.log(chalk.gray(`\nCompleted in ${duration}s`))

    if (stats.errors.length) {
      console.log(chalk.yellow(`\n⚠️  ${stats.errors.length} errors`))
      stats.errors.forEach(({ file, error }) =>
        console.log(chalk.yellow(`- ${path.basename(file)}: ${error}`))
      )
    }

    return true
  } catch (error) {
    spinner.fail('Import failed')
    console.error(chalk.red('Error:'), error.message)
    // Best-effort restore from the pre-import snapshot. The import only
    // overwrites (never deletes), so copying the backup back over content/
    // reverts any partial writes. (A kill -9 mid-loop won't reach this — the
    // backup is preserved for the manual restore documented above.)
    if (!isDryRun) {
      const hasBackup = await fs
        .access(dirs.backup)
        .then(() => true)
        .catch(() => false)
      if (hasBackup) {
        try {
          await fs.cp(dirs.backup, dirs.content, { recursive: true })
          console.error(
            chalk.yellow('Restored content/ from the pre-import backup.')
          )
        } catch (e) {
          console.error(
            chalk.red(
              `Restore failed — recover manually from ${dirs.backup}: ${e.message}`
            )
          )
        }
      }
    }
    throw error
  }
}

if (process.env.NODE_ENV !== 'test') main()
export { main }
