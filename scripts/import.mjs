import {
  readFileSync,
  writeFileSync,
  unlinkSync,
  readdirSync,
  existsSync,
  mkdirSync,
  statSync
} from 'fs'
import path from 'path'
import frontMatter from 'front-matter'

const sourceDirectory =
  '/Users/ejfox/Library/Mobile Documents/iCloud~md~obsidian/Documents/ejfox/'
const destinationDirectory = 'content/blog/'

const excludedFolders = [
  'project-notes',
  'templates',
  'video-scripts',
  '.obsidian',
  '.trash',
  'home'
]
const excludedExtensions = ['.canvas']

/**
 * Recursively process files in a directory
 * @param {string} currentPath - The current path being processed
 * @param {string} relativePath - The relative path from the source directory
 */
function processDirectory(currentPath, relativePath = '') {
  const files = readdirSync(currentPath)

  files.forEach((file) => {
    const fullPath = path.join(currentPath, file)
    const stat = statSync(fullPath)

    if (stat.isDirectory()) {
      if (!excludedFolders.includes(file)) {
        processDirectory(fullPath, path.join(relativePath, file))
      }
    } else if (
      stat.isFile() &&
      file.endsWith('.md') &&
      !excludedExtensions.includes(path.extname(file))
    ) {
      processFile(fullPath, relativePath)
    }
  })
}

/**
 * Process a single Markdown file
 * @param {string} filePath - The full path of the file
 * @param {string} relativePath - The relative path from the source directory
 */
function processFile(filePath, relativePath) {
  try {
    const data = readFileSync(filePath, 'utf8')
    const { attributes, body } = frontMatter(data)

    // Calculate word count from the body text
    const wordCount = body
      .replace(/\s+/g, ' ') // Normalize whitespace
      .replace(/#+\s/g, '') // Remove markdown headers
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Replace links with just text
      .replace(/`[^`]+`/g, '') // Remove inline code
      .replace(/```[\s\S]*?```/g, '') // Remove code blocks
      .replace(/\*\*|__|\*|_/g, '') // Remove bold/italic markers
      .trim()
      .split(/\s+/).length

    // Skip drafts that don't have explicit sharing enabled
    if (relativePath.includes('drafts/') && !attributes.share) {
      console.log(`Skipping non-shared draft: ${filePath}`)
      return
    }

    // Skip files that don't have explicit sharing enabled in sensitive folders
    const sensitiveDirectories = ['robots', 'drafts']
    if (sensitiveDirectories.some((dir) => relativePath.includes(dir))) {
      if (!attributes.share) {
        console.log(`Skipping private file in sensitive directory: ${filePath}`)
        return
      }
    }

    // Determine destination path - put shared robot notes in a special folder
    let destinationRelativePath = relativePath
    if (relativePath.includes('robots') && attributes.share) {
      destinationRelativePath = 'robots'
    }

    const destinationFolder = path.join(
      destinationDirectory,
      destinationRelativePath
    )
    const destinationFilePath = path.join(
      destinationFolder,
      path.basename(filePath)
    )

    if (!existsSync(destinationFolder)) {
      mkdirSync(destinationFolder, { recursive: true })
    }

    // Determine if the file should be marked as hidden (draft)
    const isHidden = attributes.hidden || relativePath.startsWith('drafts')

    const updatedContent = addFrontmatter(body, {
      ...attributes,
      wordCount,
      hidden: isHidden,
      draft: isHidden
    })
    writeFileSync(destinationFilePath, updatedContent, 'utf8')
    console.log(`Processed file: ${destinationFilePath}`)
  } catch (error) {
    console.error(`Error processing file ${filePath}:`, error)
  }
}

/**
 * Add or update frontmatter in the content
 * @param {string} body - The main content of the file
 * @param {Object} attributes - The existing frontmatter attributes
 * @param {boolean} isHidden - Whether the file should be marked as hidden
 * @returns {string} Updated content with frontmatter
 */
function addFrontmatter(body, attributes, isHidden) {
  const updatedFrontmatter = {
    ...attributes,
    hidden: isHidden,
    draft: isHidden
  }
  return `---\n${objToFrontmatter(updatedFrontmatter)}---\n${body}`
}

/**
 * Convert an object to YAML frontmatter string
 * @param {Object} attributes - The frontmatter attributes
 * @returns {string} YAML formatted frontmatter
 */
function objToFrontmatter(attributes) {
  let frontmatterString = ''
  for (const key in attributes) {
    frontmatterString += `${key}: ${JSON.stringify(attributes[key])}\n`
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
    const sourceFilePath = path.join(sourceDirectory, relativePath, file)

    const stat = statSync(destinationFilePath)

    if (stat.isDirectory()) {
      // Check recursively in subdirectories
      const result = deleteMissingFiles(
        destinationFilePath,
        path.join(relativePath, file)
      )
      deletedFilesCount += result.deletedFilesCount
      deletedFiles = deletedFiles.concat(result.deletedFiles)
    } else if (!existsSync(sourceFilePath)) {
      // If the file does not exist in the source, delete it from the destination
      console.log(`Deleting missing file: ${destinationFilePath}`)
      unlinkSync(destinationFilePath)
      deletedFilesCount++
      deletedFiles.push(destinationFilePath)
    }
  })

  if (relativePath === '') {
    console.log(
      `Deleted ${deletedFilesCount} files: ${deletedFiles.join(', ')}`
    )
  }

  return { deletedFilesCount, deletedFiles }
}

// Start processing from the source directory
try {
  processDirectory(sourceDirectory)
  console.log('Import completed successfully.')

  deleteMissingFiles(destinationDirectory)
  console.log('Deleted missing files.')
} catch (error) {
  console.error('Error during import:', error)
}
