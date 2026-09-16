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

/**
 * The top-level entries under `content/blog/` that this import is responsible
 * for — derived from what it is actually about to write.
 *
 * This is the difference between "rebuild the tree" and "destroy the tree".
 * The importer used to `rm -rf content/blog` wholesale, on the assumption that
 * the vault is the complete source of truth. That stopped being true: the 97
 * `reading/` notes were moved to the vault's `.trash` in June 2026 and now
 * exist ONLY in the repo, and `week-notes/` is deliberately un-whitelisted
 * while 91 of them are committed. Wiping everything deleted all 188 and
 * rebuilt none of them.
 */
const managedDestinations = (files) => {
  const managed = new Set()
  for (const file of files) {
    const rel = contentRelativePath(path.relative(SOURCE_DIR, file))
    managed.add(rel.split(path.sep)[0])
  }
  return managed
}

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

async function main() {
  const isDryRun = process.env.DRY_RUN === 'true'
  const spinner = ora('Starting import...').start()

  try {
    // Find the files FIRST, so the clean step can be scoped to what this run
    // actually manages. Order matters: wiping before knowing what you're about
    // to write is how 188 posts that live only in the repo got deleted.
    const files = await findMarkdownFiles()
    if (!files.length) throw new Error('No markdown files found')

    if (!isDryRun) {
      const contentExists = await fs
        .access(dirs.content)
        .then(() => true)
        .catch(() => false)
      if (contentExists) {
        await fs.rm(dirs.backup, { recursive: true, force: true })
        await fs.cp(dirs.content, dirs.backup, { recursive: true })
      }

      // Remove only the destinations this import rebuilds, so a post that
      // exists solely in the repo — every `reading/` note, every committed
      // week-note — is left alone instead of deleted and never restored.
      const managed = managedDestinations(files)
      for (const entry of managed) {
        await fs.rm(path.join(dirs.content, entry), {
          recursive: true,
          force: true,
        })
      }
      await fs.mkdir(dirs.content, { recursive: true })
      debug(`Managed destinations: ${[...managed].sort().join(', ')}`)
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
    throw error
  }
}

if (process.env.NODE_ENV !== 'test') main()
export { main }
