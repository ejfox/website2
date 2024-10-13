import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync, statSync } from 'fs'
import path from 'path'
import frontMatter from 'front-matter'

const sourceDirectory = 'content/blog/'
const destinationDirectory = 'content/processed/'

const excludedFolders = ['.git', 'node_modules']
const excludedExtensions = ['.canvas']

/**
 * Recursively process markdown files in a directory
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
      processMarkdownFile(fullPath, relativePath)
    }
  })
}

/**
 * Process a single Markdown file and convert it to JSON
 * @param {string} filePath - The full path of the file
 * @param {string} relativePath - The relative path from the source directory
 */
function processMarkdownFile(filePath, relativePath) {
  try {
    const data = readFileSync(filePath, 'utf8')
    const { attributes, body } = frontMatter(data)

    const destinationFolder = path.join(destinationDirectory, relativePath)
    const destinationFilePath = path.join(
      destinationFolder,
      `${path.basename(filePath, '.md')}.json`
    )

    if (!existsSync(destinationFolder)) {
      mkdirSync(destinationFolder, { recursive: true })
    }

    // Determine if the file should be marked as hidden (draft)
    const isHidden = attributes.hidden || relativePath.startsWith('drafts')

    const updatedFrontmatter = {
      ...attributes,
      hidden: isHidden,
      draft: isHidden
    }

    const jsonContent = {
      frontmatter: updatedFrontmatter,
      content: body
    }

    writeFileSync(destinationFilePath, JSON.stringify(jsonContent, null, 2), 'utf8')
    console.log(`Processed file: ${destinationFilePath}`)
  } catch (error) {
    console.error(`Error processing file ${filePath}:`, error)
  }
}

// Start processing from the source directory
try {
  processDirectory(sourceDirectory)
  console.log('Markdown processing completed successfully.')
} catch (error) {
  console.error('Error during markdown processing:', error)
}