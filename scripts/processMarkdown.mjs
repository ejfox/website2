// processMarkdown.mjs

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
import { transformerCopyButton } from '@rehype-pretty/transformers'
import fetch from 'node-fetch'
import { visit } from 'unist-util-visit'
import matter from 'gray-matter'
import { fromHtmlIsomorphic } from 'hast-util-from-html-isomorphic'
import dotenv from 'dotenv'
import * as shiki from 'shiki'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'
import { stat } from 'fs/promises'
import { promisify } from 'util'
import { socialPlatforms, hrSvg, headerStar } from '../helpers.mjs'
import { createHash } from 'crypto'
import chalk from 'chalk'
import { existsSync } from 'fs'
const setTimeoutPromise = promisify(setTimeout)

// =============================
// Load Environment Variables
// =============================
dotenv.config()

// =============================
// Initialize Cloudinary SDK Correctly
// =============================
import { v2 as cloudinary } from 'cloudinary'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
})

// =============================
// Define __filename and __dirname for ES Modules
// =============================
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// =============================
// Define Content and Output Directories
// =============================
const contentDir = path.resolve(process.cwd(), 'content', 'blog')
const outputDir = path.resolve(process.cwd(), 'content', 'processed')

// =============================
// Define Cloudinary Base URL
// =============================
const CLOUDINARY_BASE_URL = `https://res.cloudinary.com/${
  cloudinary.config().cloud_name
}/image/upload/`

// =============================
// Set Up Shiki Highlighter
// =============================
const highlighter = await shiki.getHighlighter({
  theme: 'github-dark',
  langs: [
    'javascript',
    'typescript',
    'json',
    'html',
    'css',
    'markdown',
    'bash',
    'python',
    'yaml',
    'jsx',
    'tsx'
  ]
})

// =============================
// Initialize Unified Processor
// =============================
const processor = unified()
  .use(remarkParse)
  .use(remarkObsidianSupport)
  .use(remarkCustomElements)
  .use(remarkGfm)
  .use(remarkUnwrapImages)
  .use(remarkRehype, { allowDangerousHtml: true })
  .use(rehypeAddClassToParagraphs)
  .use(remarkAi2htmlEmbed)
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
    highlighter: highlighter,
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
  .use(rehypeAutolinkHeadings, {
    content: fromHtmlIsomorphic(headerStar, { fragment: true }).children
  })
  .use(rehypeStringify, { allowDangerousHtml: true })

// =============================
// Plugin: rehypeAddClassToParagraphs
// =============================
function rehypeAddClassToParagraphs() {
  return (tree) => {
    visit(tree, 'element', (node) => {
      if (node.tagName === 'p') {
        node.properties = node.properties || {}
        node.properties.className = node.properties.className || []
        if (Array.isArray(node.properties.className)) {
          node.properties.className.push('max-w-prose')
        } else {
          node.properties.className += ' max-w-prose'
        }
        node.properties.style = node.properties.style || ''
        node.properties.style += 'max-width: 50ch;'
      } else if (node.tagName === 'blockquote') {
        const p = node.children.find((child) => child.tagName === 'p')
        if (p) {
          p.properties = p.properties || {}
          p.properties.className = p.properties.className || []
          if (Array.isArray(p.properties.className)) {
            p.properties.className.push('max-w-prose')
          } else {
            p.properties.className += ' max-w-prose'
          }
        }
      }
    })
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

function enhanceLinksWithScraps(options = {}) {
  const supabaseUrl = process.env.SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_KEY
  const supabase = createClient(supabaseUrl, supabaseKey)

  const cache = new NodeCache({ stdTTL: 3600 })

  async function loadScrapsIntoCache() {
    if (cache.has('scrapMap')) {
      return cache.get('scrapMap')
    }

    let { data: scraps, error } = await supabase
      .from('scraps')
      .select('scrap_id, metadata')

    if (error) {
      console.error('Error fetching scraps from Supabase:', error)
      return {}
    }

    const scrapMap = {}
    scraps.forEach((scrap) => {
      const href = scrap.metadata?.href
      if (href) {
        scrapMap[href] = scrap
      }
    })

    cache.set('scrapMap', scrapMap)
    return scrapMap
  }

  return async (tree) => {
    const linkNodes = []

    visit(tree, 'link', (node) => {
      linkNodes.push(node)
    })

    const scrapMap = await loadScrapsIntoCache()

    for (const node of linkNodes) {
      const scrap = scrapMap[node.url]
      if (scrap) {
        node.data = node.data || {}
        node.data.hProperties = node.data.hProperties || {}
        node.data.hProperties['data-scrap-id'] = scrap.scrap_id
        node.data.hProperties['data-scrap-metadata'] = JSON.stringify(
          scrap.metadata
        )
      }
    }
  }
}

// =============================
// Plugin Integration and Markdown Processing
// =============================
async function processMarkdown(content, filePath) {
  const filename = path.basename(filePath)
  log(`Processing ${chalk.bold(filename)}`)

  try {
    const { data: frontmatter, content: markdownContent } = matter(content)

    const ast = processor.parse(markdownContent)
    if (!ast) {
      throw new Error('Failed to parse markdown')
    }

    const { firstHeading, toc, firstHeadingNode } = extractHeadersAndToc(ast)
    removeFirstHeading(ast, firstHeadingNode)

    const result = await processor.run(ast)
    if (!result) {
      throw new Error('Failed to process markdown')
    }

    const html = processor.stringify(result)
    if (!html && html !== '') {
      throw new Error('Failed to stringify HTML')
    }

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

    return {
      html,
      metadata: {
        ...frontmatter,
        robotsMeta,
        title:
          frontmatter.title || firstHeading || path.basename(filePath, '.md'),
        toc,
        wordCount,
        readingTime,
        imageCount,
        linkCount,
        hidden: frontmatter.hidden === true
      }
    }
  } catch (error) {
    log(`Failed to process ${chalk.bold(filename)}: ${error.message}`, 'error')
    throw error
  }
}

// Process a single markdown file
async function processMarkdownFile(fullPath) {
  try {
    const relativePath = path.relative(contentDir, fullPath)
    const fileContent = await fs.readFile(fullPath, 'utf-8')

    // Skip empty files
    if (!fileContent.trim()) {
      log(`Skipping empty file: ${chalk.bold(path.basename(fullPath))}`, 'warn')
      processStats.warnings.push({ file: fullPath, message: 'Empty file' })
      return null
    }

    // Track file type and update stats silently
    if (relativePath.startsWith('week-notes/')) {
      processStats.byType.weekNotes++
    } else if (relativePath.startsWith('reading/')) {
      processStats.byType.reading++
    } else if (relativePath.startsWith('projects/')) {
      processStats.byType.projects++
    } else if (relativePath.startsWith('robots/')) {
      processStats.byType.robots++
    } else if (relativePath.startsWith('drafts/')) {
      processStats.byType.drafts++
    } else if (relativePath.startsWith('prompts/')) {
      processStats.byType.prompts++
    } else {
      processStats.byType.blog++
    }

    const { html, metadata } = await processMarkdown(fileContent, fullPath)
    const outputPath = path.join(
      outputDir,
      `${relativePath.replace(/\.md$/, '')}.json`
    )

    await fs.mkdir(path.dirname(outputPath), { recursive: true })
    await fs.writeFile(
      outputPath,
      JSON.stringify(
        { slug: relativePath.replace(/\.md$/, ''), ...metadata, content: html },
        null,
        2
      )
    )

    // Update stats
    processStats.filesProcessed++
    processStats.totalWordCount += metadata.wordCount || 0
    processStats.totalImageCount += metadata.imageCount || 0
    processStats.totalLinkCount += metadata.linkCount || 0

    return { slug: relativePath.replace(/\.md$/, ''), ...metadata }
  } catch (error) {
    processStats.errors.push({
      file: fullPath,
      error: error.message,
      details: error.stack
    })
    log(
      `Error processing ${chalk.bold(path.basename(fullPath))}: ${
        error.message
      }`,
      'error'
    )
    return null
  }
}

// Add this function to your script
async function getFilesRecursively(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true })
  const files = await Promise.all(
    entries.map(async (entry) => {
      const fullPath = path.join(dir, entry.name)
      if (entry.isDirectory()) {
        return getFilesRecursively(fullPath)
      } else if (entry.isFile() && path.extname(entry.name) === '.md') {
        const stats = await stat(fullPath)
        const content = await fs.readFile(fullPath, 'utf-8') // Read file content here
        return { path: fullPath, mtime: stats.mtime, content } // Include content in the return object
      }
      return []
    })
  )

  return files.flat()
}

// Main function to process all files
async function processAllFiles() {
  log('Starting markdown processing...', 'info')
  let isInterrupted = false

  const interruptHandler = async () => {
    if (isInterrupted) {
      log('Forced exit. Some progress may be lost.', 'error')
      process.exit(1)
    }
    log('Interrupt received. Saving progress...', 'warn')
    isInterrupted = true
  }

  process.on('SIGINT', interruptHandler)

  try {
    log('Collecting files...')
    const allFiles = await getFilesRecursively(contentDir)
    log(`Found ${chalk.green(allFiles.length)} markdown files`)

    const manifestLite = []
    for (const file of allFiles) {
      if (isInterrupted) break
      try {
        const result = await processMarkdownFile(file.path)
        manifestLite.push(result)
      } catch (error) {
        // Error already logged in processMarkdownFile
        continue
      }
      await setTimeoutPromise(0)
    }

    const filteredManifest = manifestLite.filter(Boolean)

    if (!isInterrupted) {
      log('Writing manifest...', 'info')
      const manifestPath = path.join(outputDir, 'manifest-lite.json')
      await fs.mkdir(path.dirname(manifestPath), { recursive: true })
      await fs.writeFile(
        manifestPath,
        JSON.stringify(filteredManifest, null, 2)
      )
      log('Manifest written successfully', 'success')
    }

    printProcessingReport()
  } catch (error) {
    log('Processing failed', 'error')
    console.error(error)
    throw error
  } finally {
    process.off('SIGINT', interruptHandler)
    if (isInterrupted) {
      log('Progress saved. Exiting.', 'warn')
      process.exit(0)
    }
  }
}

// =============================
// Helper Functions
// =============================

/**
 * Processes a link to determine if it should have an icon or be treated as a wikilink.
 * @param {string} href - The link URL.
 * @returns {object} - Contains the processed href, icon, and wikilink status.
 */
function processLink(href) {
  try {
    const urlObj = new URL(href)
    const domain = urlObj.hostname

    for (const [platformDomain, icon] of Object.entries(socialPlatforms)) {
      if (domain.includes(platformDomain)) {
        return { href, icon }
      }
    }
  } catch (e) {
    // For non-URL hrefs like mailto:
    for (const [platform, icon] of Object.entries(socialPlatforms)) {
      if (href.startsWith(platform)) {
        return { href, icon }
      }
    }
  }

  // Handle internal links that are not wikilinks
  if (href.startsWith('/notes/')) {
    return { href, isInternal: true }
  }

  return { href }
}

// =============================
// Plugin: remarkCustomElements
// =============================
/**
 * Plugin to handle custom elements like images, links, and code blocks.
 */
function remarkCustomElements() {
  const iconCache = {} // In-memory cache for icons

  async function getIconSVG(iconName) {
    if (iconCache[iconName]) {
      return iconCache[iconName]
    }

    const [prefix, name] = iconName.split(':')
    const url = `https://api.iconify.design/${prefix}/${name}.svg`
    try {
      const response = await fetch(url)
      if (response.ok) {
        const svg = await response.text()
        iconCache[iconName] = svg // Cache the SVG
        return svg
      } else {
        console.error(`Failed to fetch icon: ${iconName}`)
        return null
      }
    } catch (error) {
      console.error(`Error fetching icon ${iconName}:`, error)
      return null
    }
  }

  function getNodeText(node) {
    if (!node) return ''
    if (node.type === 'text') {
      return node.value
    } else if (node.children && node.children.length > 0) {
      return node.children.map(getNodeText).join('')
    } else {
      return ''
    }
  }

  // Add this helper function for Cloudinary URLs
  function formatCloudinaryUrl(url) {
    if (!url || !url.includes('cloudinary.com')) return url

    // Extract the base URL and transformation string
    const [baseUrl, ...transformParts] = url.split('/upload/')
    const transformString = transformParts.join('/upload/')

    // Add default transformations if none exist
    if (!transformString.includes('/')) {
      return `${baseUrl}/upload/f_auto,q_auto/${transformString}`
    }

    return url
  }

  return async (tree) => {
    const linkNodes = []

    // Collect link nodes
    visit(tree, 'link', (node) => {
      linkNodes.push(node)
    })

    // Process links
    for (const node of linkNodes) {
      const { href, icon } = processLink(node.url)
      node.url = href
      if (icon) {
        node.type = 'html'
        let iconHtml = ''
        if (icon) {
          const svg = await getIconSVG(icon)
          if (svg) {
            const styledSvg = svg.replace(
              '<svg',
              '<svg style="display: inline-block; vertical-align: middle; width: 0.7em; height: 0.7em; margin-left: 0.2rem; margin-right: 0.2rem; margin-top: -0.2em; opacity: 0.8;"'
            )
            iconHtml = `${styledSvg}`
          }
        }
        const linkText = getNodeText(node)
        node.value = `<a href="${href}">${linkText}${iconHtml}</a>`
      }
    }

    // Update remarkCustomElements to handle images
    visit(tree, 'image', (node) => {
      // Format Cloudinary URLs
      node.url = formatCloudinaryUrl(node.url)
    })
  }
}

// =============================
// Plugin: remarkAi2htmlEmbed
// =============================
/**
 * Plugin to embed AI2HTML graphics.
 * 
 * @example
 * # My Blog Post

Here's my AI2HTML graphic:

::ai2html{project-name}
 */
function remarkAi2htmlEmbed() {
  return (tree) => {
    visit(tree, 'paragraph', (node) => {
      if (node.children.length === 1 && node.children[0].type === 'text') {
        const match = node.children[0].value.match(/^::ai2html\{(.+)\}$/)
        if (match) {
          const projectName = match[1]
          node.type = 'html'
          node.value = `
<div class="ai2html-responsive-embed" data-project="${projectName}">
  <iframe src="/ai2html/${projectName}/index.html" width="100%" style="border: none;" scrolling="no"></iframe>
</div>`
        }
      }
    })
  }
}

// Helper function to extract the title from the frontmatter of the linked markdown file
async function getTitleFromFrontmatter(slug) {
  const targetPath = path.join(contentDir, `${slug}.md`)

  try {
    // Check if file exists first to avoid unnecessary error logging
    if (!existsSync(targetPath)) {
      return slug // Return slug if file doesn't exist
    }

    const fileContent = await fs.readFile(targetPath, 'utf8')
    const { data: frontmatter } = matter(fileContent)

    // Try different properties in order of preference
    const title =
      frontmatter.title || // Explicit title in frontmatter
      frontmatter.name || // Some files might use 'name'
      frontmatter.heading || // Some files might use 'heading'
      path.basename(slug) // Fallback to filename without extension

    return title
  } catch (err) {
    if (process.env.DEBUG_PROCESS === 'true') {
      console.error(`Error reading title from ${targetPath}:`, err)
    }
    return slug // Fallback to slug if anything goes wrong
  }
}

// Update remarkObsidianSupport to use getTitleFromFrontmatter
function remarkObsidianSupport() {
  return async (tree) => {
    // Handle [[wikilinks]]
    const visit = (await import('unist-util-visit')).visit
    await visit(tree, 'text', async (node, index, parent) => {
      const value = node.value
      const wikilinkRegex = /\[\[([^\]]+)\]\]/g
      let match
      let lastIndex = 0
      const nodes = []

      while ((match = wikilinkRegex.exec(value)) !== null) {
        const [fullMatch, linkText] = match
        const start = match.index
        const end = wikilinkRegex.lastIndex

        // Add text before the wikilink
        if (start > lastIndex) {
          nodes.push({
            type: 'text',
            value: value.slice(lastIndex, start)
          })
        }

        const linkParts = linkText.split('|')
        const target = linkParts[0].split('#')[0]
        const alias = linkParts[1] || (await getTitleFromFrontmatter(target))
        const heading = linkParts[0].split('#')[1]

        // Generate the URL
        let url = `/blog/${encodeURIComponent(target)}`
        if (heading) {
          url += `#${generateSlug(heading)}`
        }

        // Create link node
        nodes.push({
          type: 'link',
          url,
          children: [{ type: 'text', value: alias }],
          data: {
            hProperties: {
              className: 'internal-link'
            }
          }
        })

        lastIndex = end
      }

      // Add remaining text after the last wikilink
      if (lastIndex < value.length) {
        nodes.push({
          type: 'text',
          value: value.slice(lastIndex)
        })
      }

      // Replace the original text node with the new nodes
      if (nodes.length > 0) {
        parent.children.splice(index, 1, ...nodes)
        return [visit.SKIP, index + nodes.length]
      }
    })
  }
}

// Update the log function to use correct console methods
function log(message, level = 'info') {
  const timestamp = chalk.dim(new Date().toISOString())
  const prefix =
    {
      info: chalk.blue('ℹ'),
      warn: chalk.yellow('⚠'),
      error: chalk.red('✖'),
      success: chalk.green('✓')
    }[level] || chalk.blue('ℹ')

  // Map our levels to valid console methods
  const consoleMethod =
    {
      info: 'log',
      warn: 'warn',
      error: 'error',
      success: 'log'
    }[level] || 'log'

  console[consoleMethod](`${prefix} ${message}`)
}

// =============================
// Execute the Script
// =============================

// Start processing all markdown files
processAllFiles().catch(console.error)

// Add this function to generate robots meta tag content
function generateRobotsMetaContent(frontmatter, filePath) {
  // Always noindex hidden content
  if (frontmatter.hidden === true || frontmatter.hidden === 'true') {
    return 'noindex, nofollow'
  }

  // Always noindex drafts unless explicitly shared
  if (filePath.includes('/drafts/') && frontmatter.share !== true) {
    return 'noindex, nofollow'
  }

  // Use frontmatter robots directive if present
  if (frontmatter.robots) {
    return frontmatter.robots
  }

  // Default to index, follow
  return 'index, follow'
}

// Add after other stats/constants
const processStats = {
  filesProcessed: 0,
  totalWordCount: 0,
  totalImageCount: 0,
  totalLinkCount: 0,
  byType: {
    blog: 0,
    weekNotes: 0,
    reading: 0,
    projects: 0,
    robots: 0,
    drafts: 0,
    prompts: 0
  },
  errors: [],
  warnings: []
}

// Add report function
function printProcessingReport() {
  const separator = chalk.dim('='.repeat(80))
  console.log('\n' + separator)
  console.log(chalk.bold.blue('📊 Markdown Processing Report'))
  console.log(separator)

  // Summary
  console.log(chalk.bold('\n📈 Summary'))
  console.log(chalk.dim('─'.repeat(40)))
  console.log(
    chalk.bold('Files Processed:     ') +
      chalk.green(processStats.filesProcessed)
  )
  console.log(
    chalk.bold('Total Words:         ') +
      chalk.green(processStats.totalWordCount.toLocaleString())
  )
  console.log(
    chalk.bold('Total Images:        ') +
      chalk.green(processStats.totalImageCount)
  )
  console.log(
    chalk.bold('Total Links:         ') +
      chalk.green(processStats.totalLinkCount)
  )

  // Files by type
  console.log(chalk.bold('\n📝 Files by Type'))
  console.log(chalk.dim('─'.repeat(40)))
  Object.entries(processStats.byType)
    .filter(([_, count]) => count > 0)
    .sort(([, a], [, b]) => b - a)
    .forEach(([type, count]) => {
      console.log(
        `${chalk.bold(type.padEnd(15))} ${chalk.green(
          count.toString().padStart(3)
        )} files`
      )
    })

  if (processStats.errors.length > 0) {
    console.log(chalk.bold.red('\n❌ Errors'))
    console.log(chalk.dim('─'.repeat(40)))
    processStats.errors.forEach(({ file, error }) => {
      console.log(chalk.dim.red(`✖ ${path.basename(file)}: ${error}`))
    })
  }

  console.log('\n' + separator)
  console.log(chalk.bold.green('✨ Markdown processing completed!'))
  console.log(separator + '\n')
}
