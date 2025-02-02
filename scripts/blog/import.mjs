/**
 * Blog Content Import Pipeline
 * ==========================
 *
 * This script imports markdown files from Obsidian vault to the blog content directory
 */

import { promises as fs } from 'fs'
import path from 'path'
import matter from 'gray-matter'
import chalk from 'chalk'
import ora from 'ora'
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkRehype from 'remark-rehype'
import rehypeStringify from 'rehype-stringify'
import rehypeSlug from 'rehype-slug'
import rehypeAutolinkHeadings from 'rehype-autolink-headings'
import remarkGfm from 'remark-gfm'
import remarkUnwrapImages from 'remark-unwrap-images'
import rehypeMermaid from 'rehype-mermaid'
import rehypePrettyCode from 'rehype-pretty-code'
import { visit } from 'unist-util-visit'

import { dirs } from '../config.mjs'

// Source directory (Obsidian vault)
const SOURCE_DIR =
  '/Users/ejfox/Library/Mobile Documents/iCloud~md~obsidian/Documents/ejfox/'

// Whitelisted folders to import
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
  '2018'
]

// Stats tracking
const stats = {
  filesProcessed: 0,
  filesAdded: [],
  filesSkipped: [],
  errors: [],
  filesByType: {},
  startTime: Date.now()
}

// Debug helper
const debug = (...args) => {
  if (process.env.DEBUG === 'true') {
    console.log(chalk.gray('[DEBUG]'), ...args)
  }
}

// Get post type from path
const getPostType = (relativePath) => {
  if (relativePath.startsWith('drafts/')) return 'draft'
  if (relativePath.startsWith('robots/')) return 'robot'
  if (relativePath.startsWith('week-notes/')) return 'weekNote'
  if (relativePath.startsWith('reading/')) return 'reading'
  if (relativePath.startsWith('projects/')) return 'project'
  if (relativePath.startsWith('prompts/')) return 'prompt'
  return 'post'
}

// Get date from week note filename
function getWeekNoteDate(slug) {
  const match = slug.match(/(\d{4})-(\d{2})/)
  if (match) {
    const [_, year, week] = match
    const yearNum = parseInt(year, 10)
    const weekNum = parseInt(week, 10)
    const date = new Date(yearNum, 0, 1)
    date.setDate(date.getDate() + (weekNum - 1) * 7)
    return date.toISOString()
  }
  return new Date().toISOString()
}

// Add a pre-processor for wiki links
function fixWikiLinks(content) {
  // Fix malformed wiki links
  content = content.replace(/\[\[([^\]]+)(?!\]\])/g, '[[$1]]')

  // Convert wiki links to markdown links
  content = content.replace(/\[\[([^\]]+)\]\]/g, (match, p1) => {
    const linkText = p1.trim()
    const url = linkText.toLowerCase().replace(/\s+/g, '-')
    return `[${linkText}](${url})`
  })

  return content
}

// Process a single file
async function processFile(filePath, isDryRun = false) {
  const relativePath = path.relative(SOURCE_DIR, filePath)
  const content = await fs.readFile(filePath, 'utf8')
  const { data: frontmatter, content: markdown } = matter(content)
  const result = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkUnwrapImages)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypePrettyCode, { theme: 'github-dark' })
    .use(rehypeMermaid)
    .use(rehypeSlug)
    .use(rehypeAutolinkHeadings)
    .use(rehypeStringify, { allowDangerousHtml: true })
    .process(markdown)

  const metadata = {
    ...frontmatter,
    slug: relativePath.replace(/\.md$/, ''),
    type: getPostType(relativePath),
    date: frontmatter.date || getWeekNoteDate(relativePath),
    // Metadata
    wordCount: markdown.split(/\s+/).length,
    readingTime: Math.ceil(markdown.split(/\s+/).length / 250),
    imageCount: (markdown.match(/!\[.*?\]\(.*?\)/g) || []).length,
    linkCount: (markdown.match(/\[.*?\]\(.*?\)/g) || []).length
  }

  // Handle share flag - drafts don't need share: true
  const isInDraftsFolder = relativePath.startsWith('drafts/')
  const isRobotPost = metadata.type === 'robot'
  const needsShareFlag = isRobotPost // Only robots need share flag now
  metadata.share = needsShareFlag ? frontmatter.share === true : true

  // Skip private content
  if (!metadata.share) {
    debug(`Skipping private content: ${relativePath}`)
    stats.filesSkipped.push(relativePath)
    console.log(
      chalk.yellow(
        `Skipping private content: ${relativePath} (share: ${frontmatter.share})`
      )
    )
    return null
  }

  if (!isDryRun) {
    // Pre-process content to fix wiki links
    const fixedContent = fixWikiLinks(content)

    // Save processed file
    const outputPath = path.join(dirs.content, relativePath)
    const isNew = !(await fs
      .access(outputPath)
      .then(() => true)
      .catch(() => false))

    await fs.mkdir(path.dirname(outputPath), { recursive: true })
    await fs.writeFile(outputPath, fixedContent)

    if (isNew) {
      console.log(chalk.green(`  Added new file: ${metadata.slug}`))
    } else {
      console.log(chalk.blue(`  Updated existing: ${metadata.slug}`))
    }

    stats.filesAdded.push(outputPath)
  }

  stats.filesProcessed++
  stats.filesByType[metadata.type] = (stats.filesByType[metadata.type] || 0) + 1

  return metadata
}

// Find all markdown files
async function findMarkdownFiles() {
  const allFiles = []

  async function scanDir(dir) {
    const entries = await fs.readdir(dir, { withFileTypes: true })

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name)

      if (entry.isDirectory()) {
        const relPath = path.relative(SOURCE_DIR, fullPath)
        // Only recurse into allowed folders
        if (WHITELISTED_FOLDERS.some((folder) => relPath.startsWith(folder))) {
          await scanDir(fullPath)
        }
      } else if (
        entry.name.endsWith('.md') &&
        !entry.name.includes('.canvas.md')
      ) {
        allFiles.push(fullPath)
      }
    }
  }

  await scanDir(SOURCE_DIR)
  return allFiles
}

// Main function
async function main() {
  const isDryRun = process.env.DRY_RUN === 'true'
  const spinner = ora('Starting blog content import...').start()

  try {
    // Backup content directory
    if (!isDryRun) {
      if (
        await fs
          .access(dirs.content)
          .then(() => true)
          .catch(() => false)
      ) {
        await fs.rm(dirs.backup, { recursive: true, force: true })
        await fs.cp(dirs.content, dirs.backup, { recursive: true })
        debug('Backed up content directory')
      }

      // Clean content directory
      await fs.rm(dirs.content, { recursive: true, force: true })
      await fs.mkdir(dirs.content, { recursive: true })
    }

    // Find and process files
    spinner.text = 'Finding markdown files...'
    const files = await findMarkdownFiles()

    if (files.length === 0) {
      throw new Error('No markdown files found')
    }

    spinner.text = `Processing ${files.length} files...`

    for (const file of files) {
      try {
        await processFile(file, isDryRun)
        spinner.text = `Processed ${stats.filesProcessed}/${files.length} files`
      } catch (error) {
        stats.errors.push({ file, error: error.message })
      }
    }

    // Print summary
    spinner.succeed(
      `${isDryRun ? '[DRY RUN] ' : ''}Processed ${stats.filesProcessed} files`
    )

    console.log('\nContent Summary:')
    console.log('---------------')
    console.log(`Total files: ${stats.filesProcessed}`)
    Object.entries(stats.filesByType).forEach(([type, count]) => {
      console.log(`${type}: ${count}`)
    })
    console.log(`Hidden/Skipped: ${stats.filesSkipped.length}`)

    // Add new files report
    if (stats.filesAdded.length > 0) {
      console.log('\nNew/Updated Files:')
      console.log('----------------')
      stats.filesAdded.forEach((file) => {
        const relativePath = path.relative(dirs.content, file)
        const type = getPostType(relativePath)
        console.log(chalk.green(`${type.padEnd(8)}`), chalk.blue(relativePath))
      })
    }

    // Duration report
    const duration = ((Date.now() - stats.startTime) / 1000).toFixed(1)
    console.log(chalk.gray(`\nCompleted in ${duration}s`))

    if (stats.errors.length > 0) {
      console.log(chalk.yellow(`\nWarnings/Errors: ${stats.errors.length}`))
      stats.errors.forEach(({ file, error }) => {
        console.log(chalk.yellow(`- ${path.basename(file)}: ${error}`))
      })
    }

    return true
  } catch (error) {
    spinner.fail('Import failed')
    console.error(chalk.red('\nError:'), error.message)
    throw error
  }
}

// Run main unless being imported
if (process.env.NODE_ENV !== 'test') {
  main()
}

export { main }
