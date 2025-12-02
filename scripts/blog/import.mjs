// Obsidian → Blog Import Pipeline
import { promises as fs } from 'node:fs'
import path from 'node:path'
import matter from 'gray-matter'
import chalk from 'chalk'
import ora from 'ora'

import { dirs } from '../config.mjs'

const SOURCE_DIR =
  '/Users/ejfox/Library/Mobile Documents/iCloud~md~obsidian/Documents/ejfox/'
const WHITELISTED_FOLDERS = [
  'blog',
  'week-notes',
  'robots',
  'reading',
  'projects',
  'prompts',
  'drafts',
  '2025',
  '2024',
  '2023',
  '2022',
  '2021',
  '2020',
  '2019',
  '2018',
]

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

const fixWikiLinks = (content) =>
  content
    .replace(/\[\[([^\]]+)(?!\]\])/g, '[[$1]]')
    .replace(
      /\[\[([^\]]+)\]\]/g,
      (_, p1) =>
        `[${p1.trim()}](${p1.trim().toLowerCase().replace(/\s+/g, '-')})`
    )

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

  const words = markdown.split(/\s+/).length
  const postType = getPostType(relativePath)
  const metadata = {
    ...frontmatter,
    slug: relativePath.replace(/\.md$/, ''),
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
    const outputPath = path.join(dirs.content, relativePath)
    const isNew = !(await fs
      .access(outputPath)
      .then(() => true)
      .catch(() => false))

    await fs.mkdir(path.dirname(outputPath), { recursive: true })
    await fs.writeFile(outputPath, fixWikiLinks(content))

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
        if (WHITELISTED_FOLDERS.some((folder) => relPath.startsWith(folder)))
          await scan(fullPath)
      } else if (
        entry.name.endsWith('.md') &&
        !entry.name.includes('.canvas.md')
      ) {
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
    if (!isDryRun) {
      const contentExists = await fs
        .access(dirs.content)
        .then(() => true)
        .catch(() => false)
      if (contentExists) {
        await fs.rm(dirs.backup, { recursive: true, force: true })
        await fs.cp(dirs.content, dirs.backup, { recursive: true })
      }
      await fs.rm(dirs.content, { recursive: true, force: true })
      await fs.mkdir(dirs.content, { recursive: true })
    }

    const files = await findMarkdownFiles()
    if (!files.length) throw new Error('No markdown files found')

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
