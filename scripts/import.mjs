/**
 * Content Import Pipeline
 * ======================
 *
 * 1. IMPORT STAGE (this script)
 * ----------------------------
 *                Is post in         Does post have
 * Post Location  sensitive dir?     share: true?      Result
 * -------------  ---------------    -------------     --------
 * /drafts/      │ Yes              │ No              → Skipped
 * /drafts/      │ Yes              │ Yes             → Imported (hidden)
 * /robots/      │ Yes              │ No              → Skipped
 * /robots/      │ Yes              │ Yes             → Imported (public)
 * /week-notes/  │ No               │ N/A             → Imported (public)
 * /* (other)    │ No               │ N/A             → Imported (public)
 *
 * 2. PROCESS STAGE (processMarkdown.mjs)
 * -------------------------------------
 * - Converts markdown to HTML
 * - Generates manifest-lite.json
 * - Processes frontmatter
 * - Calculates metadata (word count, etc)
 *
 * Debug Flags:
 * -----------
 * Set these environment variables for debugging:
 * - DEBUG_IMPORT=true    Show detailed import decisions
 * - DEBUG_PROCESS=true   Show markdown processing details
 */

import {
  readFileSync,
  writeFileSync,
  unlinkSync,
  readdirSync,
  existsSync,
  mkdirSync,
  statSync,
  rmSync
} from 'fs'
import path from 'path'
import frontMatter from 'front-matter'
import chalk from 'chalk'
import { glob } from 'glob'
import ora from 'ora'
import boxen from 'boxen'
import gradient from 'gradient-string'

const sourceDirectory =
  '/Users/ejfox/Library/Mobile Documents/iCloud~md~obsidian/Documents/ejfox/'
const destinationDirectory = 'content/blog/'

const whitelistedFolders = [
  'blog',
  // Year folders
  '2024',
  '2023',
  '2022',
  '2021',
  '2020',
  '2019',
  '2018',
  // Special sections
  'drafts',
  'robots',
  'reading',
  'projects',
  'week-notes',
  'prompts'
]

const stats = {
  filesProcessed: 0,
  totalFiles: 0,
  currentFile: null,
  filesAdded: [],
  filesUpdated: [],
  skippedFiles: [],
  filesByType: {},
  errors: [],
  startTime: Date.now(),
  contentStats: {
    totalSize: 0,
    averageSize: 0,
    largest: { size: 0, file: '' },
    wordCounts: [],
    imageRefs: 0,
    linkRefs: 0
  },
  systemStats: {
    initialMemory: process.memoryUsage().heapUsed,
    peakMemory: 0,
    lastMemory: 0
  },
  queue: {
    pending: new Set(),
    active: new Set(),
    completed: new Set(),
    failed: new Set()
  }
}

const spinner = ora()

/**
 * Clean the destination directory before import
 */
function cleanDestination() {
  debug('Cleaning destination directory...')
  if (existsSync(destinationDirectory)) {
    rmSync(destinationDirectory, { recursive: true, force: true })
    debug('Cleaned destination directory', 'success')
  }
  mkdirSync(destinationDirectory, { recursive: true })
  debug('Created fresh destination directory', 'success')
}

/**
 * Find all markdown files in whitelisted directories
 */
async function findMarkdownFiles() {
  // Start with root directory pattern
  const patterns = [path.join(sourceDirectory, '*.md')]

  // Add whitelisted folder patterns
  whitelistedFolders.forEach((folder) => {
    patterns.push(path.join(sourceDirectory, folder, '**/*.md'))
  })

  const files = await glob(patterns, {
    ignore: ['**/*.canvas.md', '**/node_modules/**'],
    nodir: true // Only match files, not directories
  })

  return files
}

// Update the debug function to match log() style
function debug(message, level = 'info') {
  if (process.env.DEBUG_IMPORT === 'true' || level === 'error') {
    const prefix =
      {
        info: chalk.blue('ℹ'),
        warn: chalk.yellow('⚠'),
        error: chalk.red('✖'),
        success: chalk.green('✓'),
        debug: chalk.gray('→')
      }[level] || chalk.blue('ℹ')

    console[level === 'error' ? 'error' : 'log'](`${prefix} ${message}`)
  }
}

/**
 * Process a single Markdown file
 */
function processFile(filePath) {
  try {
    stats.queue.active.add(filePath)
    stats.queue.pending.delete(filePath)
    stats.currentFile = filePath

    if (!existsSync(filePath)) {
      throw new Error('File does not exist')
    }

    const fileStats = statSync(filePath)
    if (!fileStats.isFile()) {
      throw new Error('Path is not a file')
    }

    const relativePath = path.relative(sourceDirectory, filePath)
    const data = readFileSync(filePath, 'utf8')
    const { attributes, body } = frontMatter(data)
    const fileType = getFileType(relativePath)

    // Handle private content quietly
    if (relativePath.includes('drafts/') || relativePath.includes('robots/')) {
      if (!attributes.share) {
        stats.skippedFiles.push(filePath)
        stats.queue.completed.add(filePath)
        stats.queue.active.delete(filePath)
        debug(`Skipping private file: ${path.basename(filePath)}`, 'warn')
        return
      }
    }

    // Track stats
    stats.filesProcessed++
    stats.filesByType[fileType] = (stats.filesByType[fileType] || 0) + 1

    // Determine destination path and ensure it exists
    const destinationFolder = path.join(
      destinationDirectory,
      path.dirname(relativePath)
    )
    mkdirSync(destinationFolder, { recursive: true })

    // Write the file
    const destinationFilePath = path.join(
      destinationFolder,
      path.basename(filePath)
    )

    const isNewFile = !existsSync(destinationFilePath)

    // Convert string boolean to real boolean if needed, or else preserve as-is:
    function convertBool(val) {
      if (val === 'true') return true
      if (val === 'false') return false
      return val // Preserves existing boolean values
    }

    const updatedContent = addFrontmatter(body, {
      ...attributes,
      hidden: convertBool(attributes.hidden),
      draft: convertBool(attributes.draft),
      date: attributes.date || new Date().toISOString()
    })

    writeFileSync(destinationFilePath, updatedContent, 'utf8')

    // Track changes
    if (isNewFile) {
      stats.filesAdded.push(destinationFilePath)
      debug(`Added: ${path.basename(filePath)}`, 'success')
    } else {
      stats.filesUpdated.push(destinationFilePath)
      debug(`Updated: ${path.basename(filePath)}`, 'success')
    }

    stats.queue.completed.add(filePath)
    stats.queue.active.delete(filePath)
  } catch (error) {
    debug(
      `Error processing ${path.basename(filePath)}: ${error.message}`,
      'error'
    )
    stats.errors.push({ file: filePath, error: error.message })
    stats.queue.failed.add(filePath)
    stats.queue.active.delete(filePath)
  }
}

/**
 * Add or update frontmatter in the content
 * @param {string} body - The main content of the file
 * @param {Object} attributes - The existing frontmatter attributes
 * @returns {string} Updated content with frontmatter
 */
function addFrontmatter(body, attributes) {
  // Convert string booleans to actual booleans
  const convertToBoolean = (value) => {
    if (value === 'true') return true
    if (value === 'false') return false
    return value
  }

  // Only include hidden/draft if they're explicitly true
  const updatedFrontmatter = {
    ...attributes,
    ...(convertToBoolean(attributes.hidden) === true && { hidden: true }),
    ...(convertToBoolean(attributes.draft) === true && { draft: true })
  }
  return `---\n${objToFrontmatter(updatedFrontmatter)}---\n${body}`
}

/**
 * Convert an object to YAML frontmatter string, omitting undefined values
 * @param {Object} attributes - The frontmatter attributes
 * @returns {string} YAML formatted frontmatter
 */
function objToFrontmatter(attributes) {
  let frontmatterString = ''
  for (const key in attributes) {
    // Skip undefined values to keep original frontmatter clean
    if (attributes[key] === undefined) continue

    // Handle booleans specially to avoid quotes
    if (typeof attributes[key] === 'boolean') {
      frontmatterString += `${key}: ${attributes[key]}\n`
    } else {
      frontmatterString += `${key}: ${JSON.stringify(attributes[key])}\n`
    }
  }
  return frontmatterString
}

/**
 * Recursively find and delete files that are in the destination but not in the source
 * @param {string} destinationPath - Path in the destination directory
 * @param {string} relativePath - Relative path from the source directory
 */
function deleteMissingFiles(destinationPath, relativePath = '') {
  const files = readdirSync(destinationPath)
  let deletedFilesCount = 0
  let deletedFiles = []

  files.forEach((file) => {
    const destinationFilePath = path.join(destinationPath, file)
    const stat = statSync(destinationFilePath)

    if (stat.isDirectory()) {
      // Check recursively in subdirectories
      const result = deleteMissingFiles(
        destinationFilePath,
        path.join(relativePath, file)
      )
      deletedFilesCount += result.deletedFilesCount
      deletedFiles = deletedFiles.concat(result.deletedFiles)
    } else {
      // For files, check if they exist in the source
      // First try direct path mapping
      let sourceFilePath = path.join(sourceDirectory, relativePath, file)

      // If not found, try blog/year/file path for year-based posts
      if (!existsSync(sourceFilePath)) {
        const yearMatch = file.match(/^(\d{4})\.md$/)
        if (yearMatch) {
          const year = yearMatch[1]
          sourceFilePath = path.join(sourceDirectory, 'blog', year, file)
        }
      }

      // If file doesn't exist in source, delete it
      if (!existsSync(sourceFilePath)) {
        console.log(chalk.red(`Deleting: ${destinationFilePath}`))
        console.log(chalk.dim(`(not found in source: ${sourceFilePath})`))
        unlinkSync(destinationFilePath)
        stats.filesDeleted.push(destinationFilePath)
        deletedFilesCount++
        deletedFiles.push(destinationFilePath)
      }
    }
  })

  if (relativePath === '') {
    if (deletedFiles.length > 0) {
      console.log(chalk.red(`\nDeleted ${deletedFilesCount} files:`))
      deletedFiles.forEach((file) => {
        console.log(chalk.dim(`- ${file}`))
      })
    } else {
      console.log(chalk.dim('\nNo files needed deletion'))
    }
  }

  return { deletedFilesCount, deletedFiles }
}

/**
 * Print a summary of the import process
 */
function printSummary() {
  console.log('\n' + chalk.bold('='.repeat(80)))
  console.log('\n📊 Import Summary')
  console.log('─'.repeat(50))

  // File counts
  console.log(
    `Files: ${stats.filesAdded.length} | Hidden: ${stats.skippedFiles.length} | Errors: ${stats.errors.length}`
  )
  console.log('─'.repeat(50))

  // Files by type
  Object.entries(stats.filesByType)
    .filter(([_, count]) => count > 0)
    .forEach(([type, count]) => {
      console.log(`• ${type.padEnd(12)} ${count}`)
    })

  // Print errors if any
  if (stats.errors.length > 0) {
    console.log('��'.repeat(50))
    console.log('Errors:')
    stats.errors.forEach(({ file, error }) => {
      console.log(chalk.red(`✖ ${path.basename(file)} ${error}`))
    })
  }
  console.log('─'.repeat(50))
}

// Helper function to determine file type
function getFileType(relativePath) {
  const types = {
    'week-notes/': 'week-note',
    'reading/': 'reading',
    'projects/': 'project',
    'robots/': 'robot',
    'drafts/': 'draft',
    'prompts/': 'prompt'
  }

  return (
    Object.entries(types).find(([dir]) => relativePath.includes(dir))?.[1] ||
    'blog'
  )
}

/**
 * Update file type statistics
 */
function updateFileTypeStats(fileType) {
  // Convert fileType to match stats object keys
  const typeKey = fileType === 'week-note' ? 'weekNotes' : fileType
  if (stats.filesByType[typeKey] !== undefined) {
    stats.filesByType[typeKey]++
  }
}

// Helper function to calculate word count
function calculateWordCount(body) {
  return body
    .replace(/\s+/g, ' ')
    .replace(/#+\s/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/`[^`]+`/g, '')
    .replace(/```[\s\S]*?```/g, '')
    .replace(/\*\*|__|\*|_/g, '')
    .trim()
    .split(/\s+/).length
}

// Add this helper function for accurate week date calculation
function getDateOfISOWeek(year, week) {
  // Get first day of year
  const firstDayOfYear = new Date(year, 0, 1)

  // Get Thursday of first week
  // If 1st Jan is not a Thursday, get the next Thursday
  const firstThursday = new Date(
    year,
    0,
    1 + ((11 - firstDayOfYear.getDay()) % 7)
  )

  // Get the Thursday of our target week
  // Add (week - 1) * 7 days to the first Thursday
  const targetThursday = new Date(firstThursday)
  targetThursday.setDate(firstThursday.getDate() + (week - 1) * 7)

  // Get Monday of target week (subtract 3 days from Thursday)
  const targetDate = new Date(targetThursday)
  targetDate.setDate(targetThursday.getDate() - 3)

  return targetDate
}

// Add these stats tracking functions
function updateRealTimeStats(filePath, fileType) {
  stats.currentFile = path.basename(filePath)
  stats.filesByType[fileType] = (stats.filesByType[fileType] || 0) + 1
  printRealTimeStats()
}

function printRealTimeStats() {
  const progress = Math.round((stats.filesProcessed / stats.totalFiles) * 100)
  const memoryUsed = Math.round(process.memoryUsage().heapUsed / 1024 / 1024)

  // Clear the entire line before writing
  process.stdout.write('\r\x1b[K')

  // Get relative path and format it
  const relativePath = stats.currentFile
    ? path.relative(sourceDirectory, stats.currentFile)
    : 'Initializing...'
  const fileInfo = `${relativePath}`.padEnd(60)
  const progressInfo =
    `${progress}% (${stats.filesProcessed}/${stats.totalFiles})`.padEnd(20)
  const memInfo = `mem: ${memoryUsed}MB`

  process.stdout.write(`${fileInfo} | ${progressInfo} | ${memInfo}`)
}

// Helper functions for formatting
function formatTime(ms) {
  const seconds = Math.floor(ms / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  return `${hours.toString().padStart(2, '0')}:${(minutes % 60)
    .toString()
    .padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`
}

function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes}B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`
  return `${(bytes / 1024 / 1024).toFixed(1)}MB`
}

function formatMemoryDelta(bytes) {
  const mb = bytes / 1024 / 1024
  const sign = mb >= 0 ? '+' : ''
  return `${sign}${mb.toFixed(1)}MB`
}

// Update the main function
async function main() {
  try {
    const mainSpinner = ora('Scanning for files...').start()

    // Find files first
    const files = await findMarkdownFiles()
    stats.totalFiles = files.length
    files.forEach((file) => stats.queue.pending.add(file))
    mainSpinner.succeed(`Found ${files.length} files`)

    // Clean destination
    mainSpinner.start('Cleaning destination directory')
    cleanDestination()
    mainSpinner.succeed('Cleaned destination directory')

    console.log('\nProcessing files...\n')

    for (const file of files) {
      processFile(file)
      await new Promise((resolve) => setTimeout(resolve, 50))
    }

    process.stdout.write('\n\n')
    console.log(formatSummary())
  } catch (error) {
    console.error('\nError:', error)
    process.exit(1)
  }
}

function formatSummary() {
  const lines = [
    '',
    '',
    'Import Complete',
    '--------------',
    `Total Processed: ${stats.filesProcessed}`,
    `Added: ${stats.filesAdded.length}`,
    `Skipped: ${stats.skippedFiles.length}`,
    '',
    'Content Summary',
    '--------------'
  ]

  Object.entries(stats.filesByType)
    .filter(([_, count]) => count > 0)
    .forEach(([type, count]) => {
      lines.push(`${type}: ${count} files`)
    })

  if (stats.errors.length > 0) {
    lines.push(
      '',
      'Errors',
      '------',
      ...stats.errors
        .slice(0, 5)
        .map(({ file, error }) => `${path.basename(file)}: ${error}`)
    )
    if (stats.errors.length > 5) {
      lines.push(`... and ${stats.errors.length - 5} more errors`)
    }
  }

  return lines.join('\n')
}

// Start the import process
main().catch((error) => {
  console.error(chalk.red('\nFatal error:'), error)
  process.exit(1)
})
