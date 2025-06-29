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
import util from 'util'

// Import our plugins
import {
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
  draftsDir: path.join(config.dirs.content, '../drafts'), // Add drafts dir
  outputDir: config.dirs.output,
  backupDir: config.dirs.backup
}

// Define source directory (Obsidian vault)
const SOURCE_DIR =
  process.env.OBSIDIAN_VAULT_PATH ||
  '/Users/ejfox/Library/Mobile Documents/iCloud~md~obsidian/Documents/ejfox/'

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
  .use(remarkExtractToc)

  // 2. All remark plugins (operating on markdown AST)
  .use(remarkObsidianSupport)
  .use(remarkGfm)
  .use(remarkUnwrapImages)
  .use(remarkEnhanceImages)
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
// Add this helper function
// =============================
function debugLog(label, data, depth = 3) {
  console.log(`\n[DEBUG] ${label}:`)
  console.log(util.inspect(data, { depth, colors: true }))
  console.log()
}

// =============================
// Add near the top with other debugging functions
// =============================
function debugLinks(tree) {
  const links = []
  visit(tree, 'link', (node) => {
    links.push({
      text: node.children?.[0]?.value,
      url: node.url,
      position: node.position
    })
  })
  if (links.length > 0) {
    debugLog('Links found in document:', links)
  }
}

// Near the top, add a DEBUG flag
const DEBUG = process.env.DEBUG === 'true'

// Replace console.log with debug function
function debug(...args) {
  if (DEBUG) {
    console.log(chalk.gray('[DEBUG]'), ...args)
  }
}

// =============================
// Core Processing Functions
// =============================
async function processMarkdown(content, filePath) {
  const filename = path.basename(filePath)
  try {
    const { data: frontmatter, content: markdownContent } = matter(content)
    let ast = processor.parse(markdownContent)

    // Extract headers and TOC, including the first heading node
    const { firstHeading, toc, firstHeadingNode } = extractHeadersAndToc(ast)

    // Remove the first H1 from the AST before processing
    ast = removeFirstHeading(ast, firstHeadingNode)

    let result = await processor.run(ast)
    let html = processor.stringify(result)

    // Get title with proper fallbacks
    const extractedTitle =
      frontmatter.title ||
      firstHeading ||
      formatTitle(path.basename(filePath, '.md'))

    // Calculate metadata quietly
    const stats = {
      words: markdownContent.split(/\s+/).length,
      images: (markdownContent.match(/!\[.*?\]\(.*?\)/g) || []).length,
      links: (markdownContent.match(/\[.*?\]\(.*?\)/g) || []).length,
      codeBlocks: (markdownContent.match(/```[\s\S]*?```/g) || []).length,
      headers: toc.reduce((acc, h) => {
        acc[h.level] = (acc[h.level] || 0) + 1
        return acc
      }, {})
    }

    // Simple progress indicator
    process.stdout.write(
      `\r${chalk.gray(`Processing: ${filename.padEnd(50)}`)}${Math.round(
        (processStats.filesProcessed / processStats.totalFiles) * 100
      )}%`
    )

    // Get source path relative to Obsidian vault (if available)
    const sourcePath = SOURCE_DIR ? path.relative(SOURCE_DIR, filePath) : null
    const sourceInfo = SOURCE_DIR
      ? {
          sourcePath,
          sourceDir: SOURCE_DIR
        }
      : {}

    return {
      content: html,
      html,
      title: extractedTitle,
      metadata: {
        ...frontmatter,
        ...stats,
        toc: toc,
        type: frontmatter.type || getPostType(filePath),
        ...sourceInfo // Only include if SOURCE_DIR exists
      }
    }
  } catch (error) {
    console.error(chalk.red(`\n[ERROR] Failed processing ${filename}:`))
    console.error(chalk.red(error.message))
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
// External Links Extraction
// =============================
function extractExternalLinks(content) {
  // Extract all URLs matching http/https pattern
  const urlRegex = /https?:\/\/[^\s\)\]\"]+/g
  const urls = content.match(urlRegex) || []

  // Filter out internal domains
  const externalUrls = urls.filter((url) => {
    return !url.includes('res.cloudinary.com') && !url.includes('ejfox.com')
  })

  return [...new Set(externalUrls)] // Remove duplicates
}

async function generateExternalLinksCSV(allFiles) {
  const spinner = ora('Extracting external links...').start()

  try {
    const allExternalLinks = new Set()

    for (const filePath of allFiles) {
      // Skip reading directory files
      if (filePath.includes('content/blog/reading/')) continue

      const content = await fs.readFile(filePath, 'utf8')
      const links = extractExternalLinks(content)

      links.forEach((link) => {
        // Filter out Amazon links
        if (
          !link.includes('amazon.com') &&
          !link.includes('m.media-amazon.com')
        ) {
          allExternalLinks.add(link)
        }
      })
    }

    // Convert to array and sort
    const linksList = Array.from(allExternalLinks).sort()

    // Write to CSV file
    const csvPath = path.join(process.cwd(), 'external_links_final.csv')
    await fs.writeFile(csvPath, linksList.join('\n'))

    spinner.succeed(
      `Extracted ${linksList.length} external links to external_links_final.csv`
    )

    return linksList
  } catch (error) {
    spinner.fail('Failed to extract external links')
    console.error(error)
    throw error
  }
}

// =============================
// Main Processing Function
// =============================
async function processAllFiles() {
  const spinner = ora('Processing markdown files...').start()

  try {
    // Create backup
    await backupProcessedContent(paths.outputDir, paths.backupDir)

    // Create necessary directories if they don't exist
    await fs.mkdir(paths.contentDir, { recursive: true })
    await fs.mkdir(paths.draftsDir, { recursive: true })

    const allFiles = [
      ...(await getFilesRecursively(paths.contentDir)),
      ...(await getFilesRecursively(paths.draftsDir))
    ]
    processStats.totalFiles = allFiles.length
    spinner.succeed(`Found ${allFiles.length} markdown files`)

    // Generate external links CSV
    await generateExternalLinksCSV(allFiles)

    console.log('\nProcessing files...\n')

    const results = []
    for (const filePath of allFiles) {
      try {
        const result = await processMarkdown(
          await fs.readFile(filePath, 'utf8'),
          filePath
        )
        const relativePath = path.relative(paths.contentDir, filePath)

        // Just show the progress indicator, no debug info
        process.stdout.write(
          `\r${chalk.gray(
            `Processing: ${path.basename(filePath).padEnd(40)}`
          )}${Math.round(
            (processStats.filesProcessed / processStats.totalFiles) * 100
          )}%`
        )

        // Save the processed file
        const outputPath = path.join(
          paths.outputDir,
          relativePath.replace(/\.md$/, '.json')
        )
        await fs.mkdir(path.dirname(outputPath), { recursive: true })
        await fs.writeFile(outputPath, JSON.stringify(result, null, 2))

        results.push(result)
        processStats.filesProcessed++
      } catch (error) {
        processStats.errors.push({
          file: filePath,
          error: error.message
        })
      }
    }

    // Clear the progress line
    process.stdout.write('\r' + ' '.repeat(80) + '\r')

    // Generate summary
    printSummary(results)

    // Now clean up results for manifest
    const manifestResults = results.map((entry, index) => {
      const cleanEntry = { ...entry }
      const originalFilePath = allFiles[index]

      // Delete content/html fields
      delete cleanEntry.html
      delete cleanEntry.content
      delete cleanEntry.processedContent

      // Get the slug
      const slug = path
        .relative(paths.contentDir, originalFilePath)
        .replace(/\.md$/, '')

      // Get the type
      const type = cleanEntry.metadata?.type || getPostType(slug)

      // Keep metadata nested but ensure essential fields at top level
      return {
        slug,
        title: cleanEntry.metadata?.title || cleanEntry.title,
        date: cleanEntry.metadata?.date,
        type,
        hidden: cleanEntry.metadata?.hidden,
        draft: cleanEntry.metadata?.draft,
        dek: cleanEntry.metadata?.dek,
        modified: cleanEntry.metadata?.modified,
        tags: cleanEntry.metadata?.tags,
        toc: cleanEntry.metadata?.toc,
        // Keep original metadata intact
        metadata: {
          ...cleanEntry.metadata,
          slug,
          type
        }
      }
    })

    // Write manifest with cleaned data
    const manifestPath = path.join(paths.outputDir, 'manifest-lite.json')
    console.log('Writing manifest to:', manifestPath)
    await fs.writeFile(manifestPath, JSON.stringify(manifestResults, null, 2))
    console.log('Manifest written successfully at:', manifestPath)
    spinner.succeed('Manifest written successfully')

    return results
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

// Add a nice summary function
function printSummary(files) {
  const stats = files.reduce(
    (acc, file) => {
      acc.totalWords += file.metadata.words || 0
      acc.totalImages += file.metadata.images || 0
      acc.totalLinks += file.metadata.links || 0
      acc.totalCodeBlocks += file.metadata.codeBlocks || 0
      acc.h1 += file.metadata.headers?.h1 || 0
      acc.h2 += file.metadata.headers?.h2 || 0
      acc.h3 += file.metadata.headers?.h3 || 0
      acc.byType[file.metadata.type] = (acc.byType[file.metadata.type] || 0) + 1

      // Add tag counting
      if (file.metadata?.tags) {
        console.log(file.metadata.tags)
        // TODO: Sometimes the tag is an array, which is good, but other times it is a string and we cant handle that at all
        if (typeof file.metadata.tags === Array) {
          file.metadata.tags.forEach((tag) => {
            acc.tags[tag] = (acc.tags[tag] || 0) + 1
          })
        }
      }

      return acc
    },
    {
      totalWords: 0,
      totalImages: 0,
      totalLinks: 0,
      totalCodeBlocks: 0,
      h1: 0,
      h2: 0,
      h3: 0,
      byType: {},
      tags: {}
    }
  )

  console.log('\n📊 Content Analysis')
  console.log('=================')
  console.log(`📝 Total Files: ${files.length}`)
  console.log(`📚 Total Words: ${stats.totalWords.toLocaleString()}`)
  console.log(`🖼️  Total Images: ${stats.totalImages}`)
  console.log(`🔗 Total Links: ${stats.totalLinks}`)
  console.log(`💻 Code Blocks: ${stats.totalCodeBlocks}`)

  console.log('\n📑 Headers')
  console.log(`H1: ${stats.h1}, H2: ${stats.h2}, H3: ${stats.h3}`)

  console.log('\n📂 Content Types')
  Object.entries(stats.byType)
    .sort(([, a], [, b]) => b - a)
    .forEach(([type, count]) => {
      console.log(`${type.padEnd(10)} ${count}`)
    })

  // Add top 10 tags section
  console.log('\n🏷️  Top 10 Tags')
  Object.entries(stats.tags)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .forEach(([tag, count]) => {
      console.log(`${tag.padEnd(20)} ${count}`)
    })
}

// Add this helper function near the top with other helpers
function enhanceImageUrl(url) {
  // Only process Cloudinary URLs
  if (!url.includes('cloudinary.com/ejf/')) return url

  // Ensure URL uses HTTPS
  url = url.replace(/^http:\/\//i, 'https://')

  // Basic responsive image transformation
  const base = url.split('/upload/')[0] + '/upload/'
  const path = url.split('/upload/')[1]

  return {
    src: `${base}c_scale,f_auto,q_auto:good,w_800/${path}`,
    srcset: `
      ${base}c_scale,f_auto,q_auto:good,w_400/${path} 400w,
      ${base}c_scale,f_auto,q_auto:good,w_800/${path} 800w,
      ${base}c_scale,f_auto,q_auto:good,w_1200/${path} 1200w
    `.trim(),
    sizes: '(min-width: 768px) 80vw, 100vw'
  }
}

// Add this function to enhance images in the AST
function remarkEnhanceImages() {
  return (tree) => {
    visit(tree, 'image', (node) => {
      if (node.url) {
        const enhanced = enhanceImageUrl(node.url)
        // Only modify if it's a Cloudinary URL
        if (enhanced !== node.url) {
          node.data = node.data || {}
          node.data.hProperties = node.data.hProperties || {}
          node.data.hProperties.srcset = enhanced.srcset
          node.data.hProperties.sizes = enhanced.sizes
          node.url = enhanced.src
          node.data.hProperties.loading = 'lazy'
          node.data.hProperties.decoding = 'async'
          // Use a simpler class setup without animations that might interfere with loading
          node.data.hProperties.className = 'w-full max-w-full mx-auto'

          // Add crossorigin attribute to help with CORS issues
          node.data.hProperties.crossorigin = 'anonymous'

          // Ensure images have proper display style
          node.data.hProperties.style = 'display: block; max-width: 100%;'
        }
      }
    })
  }
}
