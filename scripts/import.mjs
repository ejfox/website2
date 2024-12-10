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
  directoriesScanned: 0,
  filesByType: {
    blog: 0,
    weekNotes: 0,
    reading: 0,
    projects: 0,
    robots: 0,
    drafts: 0,
    prompts: 0
  },
  filesAdded: [],
  filesUpdated: [],
  filesDeleted: [],
  errors: [],
  skippedFiles: [],
  hiddenFiles: []
}

/**
 * Clean the destination directory before import
 */
function cleanDestination() {
  console.log(chalk.yellow('\nCleaning destination directory...'))
  if (existsSync(destinationDirectory)) {
    rmSync(destinationDirectory, { recursive: true, force: true })
    console.log(chalk.yellow('✓ Cleaned:', chalk.dim(destinationDirectory)))
  }
  mkdirSync(destinationDirectory, { recursive: true })
  console.log(chalk.green('✓ Created fresh destination directory\n'))
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

// Add a simple debug log helper at the top
const debug = (msg, data) => {
  if (process.env.DEBUG_IMPORT === 'true') {
    console.log(
      chalk.blue('→'),
      msg,
      data ? chalk.dim(JSON.stringify(data)) : ''
    )
  }
}

/**
 * Process a single Markdown file
 */
function processFile(filePath) {
  try {
    // Verify file exists and is actually a file
    if (!existsSync(filePath)) {
      throw new Error('File does not exist')
    }

    const fileStats = statSync(filePath)
    if (!fileStats.isFile()) {
      throw new Error('Path is not a file')
    }

    // Get relative path from source directory
    const relativePath = path.relative(sourceDirectory, filePath)
    const data = readFileSync(filePath, 'utf8')
    const { attributes, body } = frontMatter(data)
    const fileName = path.basename(filePath)
    const fileType = getFileType(relativePath)

    debug('Processing', { fileName, fileType })

    // Early filtering with clear visual indicators
    if (attributes.hidden === true) {
      console.log(chalk.red('✖ HIDDEN:'), chalk.dim(fileName))
      stats.hiddenFiles.push(filePath)
      return
    }

    // Handle sensitive content
    if (relativePath.includes('drafts/') || relativePath.includes('robots/')) {
      if (!attributes.share) {
        console.log(
          chalk.yellow('⚠ PRIVATE:'),
          chalk.dim(`${fileName} (${fileType})`)
        )
        stats.skippedFiles.push(filePath)
        return
      }
      debug('Processing sensitive content', {
        fileName,
        share: attributes.share
      })
    }

    // Track file type stats
    updateFileTypeStats(fileType)
    stats.filesProcessed++

    // Process the file
    const wordCount = calculateWordCount(body)

    // Simple status line with type and word count
    console.log(
      chalk.green('✓'),
      chalk.bold(fileName.padEnd(40)),
      chalk.dim(`${fileType} • ${wordCount} words`)
    )

    // Fix dates for week notes
    if (fileType === 'week-note') {
      const weekMatch = fileName.match(/(\d{4})-(\d+)/)
      if (weekMatch) {
        const [_, year, week] = weekMatch
        if (!attributes.date || isNaN(new Date(attributes.date).getTime())) {
          const date = new Date(year)
          date.setDate(1 + (week - 1) * 7)
          attributes.date = date.toISOString()
          debug('Fixed week note date', { fileName, date: attributes.date })
        }
      }
    }

    // Determine destination path - put shared robot notes in a special folder
    let destinationRelativePath = path.dirname(relativePath)
    if (fileType === 'robot' && attributes.share) {
      destinationRelativePath = 'robots'
    }

    // Ensure the destination folder exists
    const destinationFolder = path.join(
      destinationDirectory,
      destinationRelativePath
    )
    try {
      if (!existsSync(destinationFolder)) {
        mkdirSync(destinationFolder, { recursive: true })
      }
    } catch (error) {
      console.error(`Error creating directory ${destinationFolder}:`, error)
      stats.errors.push({ file: filePath, error: error.message })
      return
    }

    // Construct the destination file path
    const destinationFilePath = path.join(destinationFolder, fileName)

    const isNewFile = !existsSync(destinationFilePath)
    const oldContent = isNewFile
      ? null
      : readFileSync(destinationFilePath, 'utf8')

    const updatedContent = addFrontmatter(body, {
      ...attributes,
      wordCount,
      hidden: attributes.hidden,
      draft: attributes.hidden
    })
    writeFileSync(destinationFilePath, updatedContent, 'utf8')

    // Track what changed
    if (isNewFile) {
      stats.filesAdded.push(destinationFilePath)
      console.log(chalk.dim.green(`+ ${fileName}`))
    } else if (oldContent !== updatedContent) {
      stats.filesUpdated.push(destinationFilePath)
      console.log(chalk.dim.yellow(`~ ${fileName}`))
    }

    console.log(`Processed file: ${destinationFilePath}`)
  } catch (error) {
    console.error(
      chalk.red('✖ ERROR:'),
      chalk.dim(`${path.basename(filePath)} ${error.message}`)
    )
    stats.errors.push({ file: filePath, error: error.message })
  }
}

/**
 * Add or update frontmatter in the content
 * @param {string} body - The main content of the file
 * @param {Object} attributes - The existing frontmatter attributes
 * @returns {string} Updated content with frontmatter
 */
function addFrontmatter(body, attributes) {
  // Only include hidden/draft if they're explicitly set
  const updatedFrontmatter = {
    ...attributes,
    // Only set hidden if it's explicitly true
    ...(attributes.hidden === true && { hidden: true }),
    // Only set draft if it's explicitly true
    ...(attributes.draft === true && { draft: true })
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
    console.log('─'.repeat(50))
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

// Start processing from the source directory
async function main() {
  try {
    // Clean destination directory
    cleanDestination()

    // Find all markdown files
    const files = await findMarkdownFiles()
    console.log(chalk.blue(`Found ${files.length} markdown files to process\n`))

    // Process each file
    for (const file of files) {
      processFile(file)
    }

    // Print summary
    printSummary()
  } catch (error) {
    console.error('Fatal error:', error)
    process.exit(1)
  }
}

// Start the import process
main().catch((error) => {
  console.error(chalk.red('\nFatal error:'), error)
  process.exit(1)
})
