console.log('Script starting...')

// =============================
// Import Necessary Modules
// =============================
import { promises as fs } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
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
import rehypeRaw from 'rehype-raw'
import matter from 'gray-matter'
import { visit } from 'unist-util-visit'
import { transformerCopyButton } from '@rehype-pretty/transformers'
import dotenv from 'dotenv'
import * as shiki from 'shiki'
import chalk from 'chalk'
import ora from 'ora'
import { promisify } from 'util'
import { stat } from 'fs/promises'
import { config } from './config.mjs'

// Import our plugins
import {
  remarkCustomElements,
  remarkAi2htmlEmbed,
  remarkObsidianSupport,
  rehypeAddClassToParagraphs,
  remarkEnhanceLinks,
  remarkExtractToc
} from './plugins/index.mjs'

// Import utilities
import {
  log,
  getPostType,
  calculateWordCount,
  headerStar,
  generateRobotsMetaContent,
  getValidDate
} from './utils/helpers.mjs'

import {
  processStats,
  updateRealTimeStats,
  printRealTimeStats,
  printProcessingReport
} from './utils/stats.mjs'

import { backupProcessedContent } from './utils/backup.mjs'

const setTimeoutPromise = promisify(setTimeout)

// =============================
// Load Environment Variables
// =============================
dotenv.config()

// =============================
// Define __filename and __dirname for ES Modules
// =============================
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

console.log('Imports complete')
console.log('Content directory:', process.cwd())

// Get absolute paths
const paths = {
  contentDir: config.dirs.content, // content/blog - source markdown
  outputDir: config.dirs.output, // content/processed - processed JSON
  backupDir: config.dirs.backup // content/backup - backups
}

// =============================
// Set Up Shiki Highlighter
// =============================
const highlighter = await shiki.getHighlighter({
  theme: 'github-dark',
  langs: ['javascript', 'typescript', 'json', 'html', 'css', 'markdown']
})

// =============================
// Add wrapper function for prose classes
// =============================
function wrapWithProseClasses() {
  return (tree) => {
    if (tree.type === 'root') {
      tree.children = [
        {
          type: 'element',
          tagName: 'article',
          properties: {
            className: [
              'prose',
              'dark:prose-invert',
              'prose-zinc',
              'dark:prose-zinc-invert',
              'max-w-none',
              'prose-headings:font-bold',
              'prose-h1:text-4xl',
              'prose-h2:text-3xl',
              'prose-h3:text-2xl',
              'prose-h4:text-xl',
              'prose-p:text-base',
              'prose-a:text-blue-600',
              'dark:prose-a:text-blue-400',
              'prose-strong:font-bold',
              'prose-code:text-sm',
              'prose-code:bg-zinc-100',
              'dark:prose-code:bg-zinc-800',
              'prose-code:rounded',
              'prose-code:px-1',
              'prose-pre:bg-zinc-900',
              'prose-pre:text-zinc-100',
              'prose-ol:list-decimal',
              'prose-ul:list-disc'
            ]
          },
          children: tree.children
        }
      ]
    }
  }
}

// =============================
// Helper: Extract Headers and TOC
// =============================
function extractHeadersAndToc(tree, maxDepth = 3) {
  let firstHeading = null
  let firstHeadingNode = null
  const toc = []
  const headingStack = []

  visit(tree, 'heading', (node) => {
    if (node.depth > maxDepth) return

    // Extract text content from heading, handling various node types
    const headingText = node.children
      .map((child) => {
        if (child.type === 'text') {
          return child.value
        } else if (child.type === 'image') {
          return child.alt || '' // Use alt text for images
        } else if (child.type === 'link') {
          return child.children.map((c) => c.value || '').join('')
        }
        return ''
      })
      .join('')
      .trim()

    // Skip empty headings
    if (!headingText) return

    const headingSlug = generateSlug(headingText)

    const headingItem = {
      text: headingText,
      slug: headingSlug,
      level: `h${node.depth}`,
      children: []
    }

    if (!firstHeading && (node.depth === 1 || node.depth === 2)) {
      firstHeading = headingText
      firstHeadingNode = node
    }

    while (
      headingStack.length > 0 &&
      headingStack[headingStack.length - 1].level >= headingItem.level
    ) {
      headingStack.pop()
    }

    if (headingStack.length === 0) {
      toc.push(headingItem)
    } else {
      headingStack[headingStack.length - 1].children.push(headingItem)
    }

    headingStack.push(headingItem)
  })

  return { firstHeading, toc, firstHeadingNode }
}

function removeFirstHeading(tree, firstHeadingNode) {
  if (firstHeadingNode) {
    const index = tree.children.indexOf(firstHeadingNode)
    if (index !== -1) {
      tree.children.splice(index, 1)
    }
  }
  return tree
}

function generateSlug(str) {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

// =============================
// Initialize Unified Processor
// =============================
const processor = unified()
  // 1. Parse markdown into mdast
  .use(remarkParse)

  // 2. All remark plugins (operating on markdown AST)
  .use(remarkObsidianSupport)
  .use(remarkCustomElements)
  .use(remarkGfm)
  .use(remarkUnwrapImages)
  .use(remarkEnhanceLinks)
  .use(remarkAi2htmlEmbed)

  // 3. Convert to hast (HTML AST)
  .use(remarkRehype, { allowDangerousHtml: true })

  // 4. All rehype plugins (operating on HTML AST)
  .use(rehypeRaw)
  .use(rehypeAddClassToParagraphs)
  .use(rehypePrettyCode, {
    theme: JSON.parse(await fs.readFile('./themes/ayu-mirage.json', 'utf-8')),
    onVisitLine(node) {
      if (node.children.length === 0) {
        node.children = [{ type: 'text', value: ' ' }]
      }
    },
    onVisitHighlightedLine(node) {
      node.properties.className.push('highlighted')
    },
    onVisitHighlightedWord(node) {
      node.properties.className = ['word']
    },
    highlighter,
    transformers: [
      transformerCopyButton({
        visibility: 'always',
        feedbackDuration: 3000
      })
    ]
  })
  .use(rehypeMermaid, {
    strategy: 'inline-svg'
  })
  .use(rehypeSlug)

  // 5. Finally, stringify to HTML
  .use(rehypeStringify, { allowDangerousHtml: true })

// =============================
// Core Processing Functions
// =============================
async function processMarkdown(content, filePath) {
  const filename = path.basename(filePath)
  log(`Processing ${chalk.bold(filename)}`)

  try {
    const { data: frontmatter, content: markdownContent } = matter(content)

    // Add project-specific logging
    if (filePath.startsWith('projects/') || frontmatter.type === 'project') {
      console.log('Processing project file:', {
        filePath,
        frontmatterType: frontmatter.type,
        detectedType: getPostType(filePath)
      })
    }

    // First pass to extract title
    const ast = processor.parse(markdownContent)
    if (!ast) {
      throw new Error('Failed to parse markdown')
    }

    const { firstHeading, toc, firstHeadingNode } = extractHeadersAndToc(ast)
    console.log('Markdown Processing: TOC extracted:', {
      filePath,
      tocLength: toc?.length,
      firstHeading,
      headings: toc?.map((h) => h.text)
    })

    // Clean up frontmatter to ensure date fields don't get mixed into title
    const cleanFrontmatter = { ...frontmatter }
    // Remove date fields from being considered as title
    delete cleanFrontmatter.date
    delete cleanFrontmatter.modified

    // Get title with proper fallbacks
    const extractedTitle =
      cleanFrontmatter.title ||
      firstHeading ||
      formatTitle(path.basename(filePath, '.md'))

    // Log the extracted title info for debugging
    console.log('Title extraction:', {
      frontmatterTitle: cleanFrontmatter.title,
      firstHeading,
      extractedTitle,
      fallbackTitle: path.basename(filePath, '.md')
    })

    // Remove the first heading from the content
    removeFirstHeading(ast, firstHeadingNode)

    // Process the content
    const result = await processor.run(ast)
    if (!result) {
      throw new Error('Failed to process markdown')
    }

    const html = processor.stringify(result)
    if (!html && html !== '') {
      throw new Error('Failed to stringify HTML')
    }

    // Add debug logging for HTML content
    console.log('Processed HTML preview:', {
      htmlLength: html.length,
      preview: html.slice(0, 200),
      hasContent: !!html
    })

    // Calculate metadata
    const wordCount = markdownContent.split(/\s+/).length
    const readingTime = Math.ceil(wordCount / 250)
    const imageCount = (markdownContent.match(/!\[.*?\]\(.*?\)/g) || []).length
    const linkCount = (markdownContent.match(/\[.*?\]\(.*?\)/g) || []).length

    log(
      `${chalk.bold(filename)}: ${chalk.green(wordCount)} words, ` +
        `${chalk.green(imageCount)} images, ${chalk.green(linkCount)} links`,
      'success'
    )

    // Generate robots meta content
    const robotsMeta = generateRobotsMetaContent(frontmatter, filePath)

    const processedDate = getValidDate(frontmatter.date, filePath)
    const processedModified = getValidDate(frontmatter.modified, filePath)

    const visibilityStatus = {
      isHidden: frontmatter.hidden === true || frontmatter.hidden === 'true',
      isShared: frontmatter.share === true,
      isSpecialSection: [
        'reading/',
        'projects/',
        'robots/',
        'study-notes/',
        'prompts/'
      ].some((section) => filePath.startsWith(section)),
      isIndex: filePath === 'index' || filePath.startsWith('!')
    }

    // Return the processed content with metadata
    return {
      content: html,
      html,
      title: extractedTitle,
      metadata: {
        ...frontmatter,
        robotsMeta,
        title: extractedTitle,
        toc,
        wordCount: wordCount || frontmatter.wordCount,
        readingTime,
        imageCount,
        linkCount,
        hidden: frontmatter.hidden === true,
        date: processedDate.toISOString(),
        modified: processedModified.toISOString(),
        type: frontmatter.type || getPostType(filePath),
        visibility: visibilityStatus
      }
    }
  } catch (error) {
    log(`Failed to process ${chalk.bold(filename)}: ${error.message}`, 'error')
    throw error
  }
}

async function getFilesRecursively(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true })
  const files = await Promise.all(
    entries.map(async (entry) => {
      const fullPath = path.join(dir, entry.name)
      if (entry.isDirectory()) {
        return getFilesRecursively(fullPath)
      } else if (entry.isFile() && path.extname(entry.name) === '.md') {
        return fullPath
      }
      return null
    })
  )
  return files.flat().filter(Boolean)
}

// =============================
// Main Processing Function
// =============================
async function processAllFiles() {
  const spinner = ora('Starting markdown processing...').start()

  try {
    // Create backup
    await backupProcessedContent(paths.outputDir, paths.backupDir)

    const allFiles = await getFilesRecursively(paths.contentDir)
    processStats.totalFiles = allFiles.length
    spinner.succeed(`Found ${allFiles.length} markdown files`)

    console.log('\nProcessing files...\n')

    const manifestEntries = []

    for (const filePath of allFiles) {
      try {
        const content = await fs.readFile(filePath, 'utf8')
        const result = await processMarkdown(content, filePath)
        const relativePath = path.relative(paths.contentDir, filePath)

        console.log('Processing file:', {
          filePath,
          relativePath,
          type: getPostType(relativePath),
          contentDir: paths.contentDir
        })

        // Save the processed file
        const outputPath = path.join(
          paths.outputDir,
          relativePath.replace(/\.md$/, '.json')
        )
        await fs.mkdir(path.dirname(outputPath), { recursive: true })
        await fs.writeFile(outputPath, JSON.stringify(result, null, 2))

        // Update stats with the correct format
        processStats.totalWordCount += result.metadata.wordCount || 0
        processStats.totalImageCount += result.metadata.imageCount || 0
        processStats.totalLinkCount += result.metadata.linkCount || 0
        processStats.currentFile = relativePath
        const type = result.metadata.type || 'unknown'
        processStats.byType[type] = (processStats.byType[type] || 0) + 1

        manifestEntries.push({
          metadata: {
            ...result.metadata,
            slug: relativePath
              .replace(/\.md$/, '')
              .replace(/^projects\//, 'projects/'),
            title:
              result.metadata.title ||
              formatTitle(path.basename(relativePath, '.md')),
            date: result.metadata.date || new Date().toISOString(),
            type: result.metadata.type || getPostType(relativePath)
          },
          html: result.html
        })
        processStats.filesProcessed++
        printRealTimeStats()
      } catch (error) {
        processStats.errors.push({
          file: filePath,
          error: error.message
        })
      }
      await setTimeoutPromise(50) // Small delay between files
    }

    console.log('\n')
    spinner.start('Writing manifest')
    const manifestPath = path.join(paths.outputDir, 'manifest-lite.json')
    await fs.mkdir(path.dirname(manifestPath), { recursive: true })

    // Clean up manifest entries by deleting unwanted fields
    manifestEntries.forEach((entry) => {
      // Delete content/html fields
      delete entry.html
      delete entry.content
      delete entry.processedContent

      // Delete unnecessary metadata fields but keep TOC
      if (entry.metadata) {
        const toc = entry.metadata.toc // Save TOC

        delete entry.metadata.wordCount
        delete entry.metadata.readingTime
        delete entry.metadata.imageCount
        delete entry.metadata.linkCount
        delete entry.metadata.robotsMeta
        delete entry.metadata.visibility

        // Move essential metadata fields to top level
        entry.slug = entry.metadata.slug
        entry.title = entry.metadata.title
        entry.date = entry.metadata.date
        entry.type = entry.metadata.type
        entry.hidden = entry.metadata.hidden
        entry.draft = entry.metadata.draft
        entry.dek = entry.metadata.dek
        entry.modified = entry.metadata.modified
        entry.tags = entry.metadata.tags
        entry.toc = toc // Restore TOC at top level

        // Delete the metadata object since we moved everything up
        delete entry.metadata
      }
    })

    await fs.writeFile(manifestPath, JSON.stringify(manifestEntries, null, 2))
    spinner.succeed('Manifest written successfully')

    printProcessingReport()
  } catch (error) {
    spinner.fail('Processing failed')
    console.error(error)
    throw error
  }
}

// =============================
// Run the processor
// =============================
processAllFiles().catch((error) => {
  console.error('Fatal error:', error)
  process.exit(1)
})

// =============================
// Exports
// =============================
export { processAllFiles, processMarkdown, getFilesRecursively }

// Add this helper function at the top with other imports
function formatTitle(filename) {
  // Remove year prefix if present (e.g. "2024/my-post" -> "my-post")
  const baseName = filename.split('/').pop()

  // Convert kebab-case to Title Case
  return baseName
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}
