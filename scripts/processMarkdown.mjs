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
// import remarkObsidian from 'remark-obsidian'
import remarkGfm from 'remark-gfm'
import remarkUnwrapImages from 'remark-unwrap-images'
import rehypeMermaid from 'rehype-mermaid'
import rehypePrettyCode from 'rehype-pretty-code'
import { transformerCopyButton } from '@rehype-pretty/transformers'
import fetch from 'node-fetch' // For fetching SVGs
import { visit } from 'unist-util-visit'
import matter from 'gray-matter'
import { fromHtmlIsomorphic } from 'hast-util-from-html-isomorphic'
import dotenv from 'dotenv'
import NodeCache from 'node-cache'
import * as shiki from 'shiki'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'
import { stat } from 'fs/promises'
import { promisify } from 'util';
import { socialPlatforms, hrSvg, headerStar } from '../helpers.mjs'
const setTimeoutPromise = promisify(setTimeout);

// =============================
// Load Environment Variables
// =============================
dotenv.config()

// =============================
// Initialize Cloudinary SDK Correctly
// =============================
// Import the v2 API and configure it
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
const cacheDir = path.resolve(process.cwd(), 'cache')
const CACHE_VERSION = 1 // Increment this when making significant changes to the processing logic
const cacheFilePath = path.join(cacheDir, 'content-hash-cache.json')

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



// Function to compute content hash
function computeContentHash(content) {
  return crypto.createHash('sha256').update(content).digest('hex')
}

// Load cache from file
async function loadCache() {
  try {
    const cacheData = await fs.readFile(cacheFilePath, 'utf-8')
    const cache = JSON.parse(cacheData)
    if (cache.version !== CACHE_VERSION) {
      console.log('Cache version mismatch. Starting fresh.')
      return { version: CACHE_VERSION, files: {} }
    }
    return cache
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.warn('No existing cache found. Starting fresh.')
    } else {
      console.error('Error loading cache:', error)
    }
    return { version: CACHE_VERSION, files: {} }
  }
}

// Save cache to file
async function saveCache(cache) {
  try {
    await fs.mkdir(path.dirname(cacheFilePath), { recursive: true })
    await fs.writeFile(cacheFilePath, JSON.stringify(cache, null, 2), 'utf-8')
    console.log('Content hash cache saved.')
  } catch (error) {
    console.error('Error saving cache:', error)
  }
}

// Cleanup function
async function cleanup() {
  try {
    await saveCache(contentHashCache)
    console.log('Cleanup completed successfully.')
  } catch (error) {
    console.error('Error during cleanup:', error)
  }
}

// Handle Process Exit Signals to Save Cache
process.on('exit', cleanup)
process.on('SIGINT', async () => {
  await cleanup()
  process.exit()
})
process.on('SIGTERM', async () => {
  await cleanup()
  process.exit()
})

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
  return async (tree) => {
    const iconCache = {}

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
          iconCache[iconName] = svg
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
        const match = node.children[0].value.match(/^::ai2html\{(.+)\}$/);
        if (match) {
          const projectName = match[1];
          node.type = 'html';
          node.value = `
<div class="ai2html-responsive-embed" data-project="${projectName}">
  <iframe src="/ai2html/${projectName}/index.html" width="100%" style="border: none;" scrolling="no"></iframe>
</div>`;
        }
      }
    });
  };
}


// =============================
// Plugin: rehypeAddClassToParagraphs
// =============================
/**
 * Plugin to add classes and styles to paragraph elements.
 */
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
        // look for the p inside the blockquote
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
/**
 * Extracts headers and generates a Table of Contents (TOC).
 * @param {object} tree - The markdown AST.
 * @returns {object} - Contains the first heading, TOC, and the first heading node.
 */
function extractHeadersAndToc(tree) {
  let firstHeading = null
  let firstHeadingNode = null
  const toc = []
  let currentH2 = null

  visit(tree, 'heading', (node) => {
    if (node.children && node.children[0] && node.children[0].value) {
      const headingText = node.children[0].value
      const headingSlug = generateSlug(headingText)

      if (!firstHeading && (node.depth === 1 || node.depth === 2)) {
        firstHeading = headingText
        firstHeadingNode = node
      }

      if (node.depth === 2) {
        currentH2 = {
          text: headingText,
          slug: headingSlug,
          level: 'h2',
          children: []
        }
        toc.push(currentH2)
      } else if (node.depth === 3 && currentH2) {
        currentH2.children.push({
          text: headingText,
          slug: headingSlug,
          level: 'h3'
        })
      }
    }
  })

  return { firstHeading, toc, firstHeadingNode }
}

/**
 * Removes the first heading from the AST.
 * @param {object} tree - The markdown AST.
 * @param {object} firstHeadingNode - The first heading node to remove.
 */
function removeFirstHeading(tree, firstHeadingNode) {
  if (firstHeadingNode) {
    const index = tree.children.indexOf(firstHeadingNode)
    if (index !== -1) {
      tree.children.splice(index, 1)
    }
  }
  return tree
}

/**
 * Generates a slug from a string.
 * @param {string} str - The input string.
 * @returns {string} - The generated slug.
 */
function generateSlug(str) {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function enhanceLinksWithScraps(options = {}) {
  // Initialize Supabase client
  const supabaseUrl = process.env.SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_KEY
  const supabase = createClient(supabaseUrl, supabaseKey)

  // Initialize NodeCache with a TTL (e.g., 1 hour)
  const cache = new NodeCache({ stdTTL: 3600 })

  // Function to load all scraps into cache
  async function loadScrapsIntoCache() {
    // Check if scraps are already in cache
    if (cache.has('scrapMap')) {
      return cache.get('scrapMap')
    }

    // Fetch all scraps from Supabase
    let { data: scraps, error } = await supabase
      .from('scraps')
      .select('scrap_id, metadata')

    if (error) {
      console.error('Error fetching scraps from Supabase:', error)
      return {}
    }

    // Build a map of href to scrap
    const scrapMap = {}
    scraps.forEach((scrap) => {
      const href = scrap.metadata?.href
      if (href) {
        scrapMap[href] = scrap
      }
    })

    // Store the map in cache
    cache.set('scrapMap', scrapMap)
    return scrapMap
  }

  return async (tree) => {
    const linkNodes = []

    // Collect all link nodes
    visit(tree, 'link', (node) => {
      linkNodes.push(node)
    })

    // Load the scraps into cache
    const scrapMap = await loadScrapsIntoCache()

    // Process each link node
    for (const node of linkNodes) {
      const scrap = scrapMap[node.url]
      if (scrap) {
        // Inject scrap_id and metadata as attributes
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
/**
 * Processes a single markdown file.
 * @param {string} filePath - The path to the markdown file.
 * @returns {object} - Contains the processed HTML and metadata.
 */
async function processMarkdown(content, filePath) {
  log(`Processing content from: ${filePath}`)
  const { data: frontmatter, content: markdownContent } = matter(content)
  log(`Frontmatter extracted: ${JSON.stringify(frontmatter)}`)

  const processor = unified()
    .use(remarkParse)
    .use(remarkObsidianSupport)
    .use(remarkCustomElements) // Custom plugin for images, links, and code
    .use(enhanceLinksWithScraps) // Enhance links with metadata from Supabase
    .use(remarkGfm)
    .use(remarkUnwrapImages)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeAddClassToParagraphs)
    .use(remarkAi2htmlEmbed)
    // .use(rehypeConvertHrToSvg) // Uncomment if you want to convert <hr> to SVG
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
      // Pass Shiki highlighter
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

  log('Parsing content')
  const ast = processor.parse(markdownContent)
  log('Content parsed, extracting headers and TOC')
  const { firstHeading, toc, firstHeadingNode } = extractHeadersAndToc(ast)
  log(`First heading: "${firstHeading}", TOC entries: ${toc.length}`)

  log('Removing first heading from AST')
  removeFirstHeading(ast, firstHeadingNode)

  log('Running processor')
  const result = await processor.run(ast)
  log('Processor run complete')

  log('Stringifying result')
  const html = processor.stringify(result)
  log(`HTML generated, length: ${html.length} characters`)

  const wordCount = markdownContent.split(/\s+/).length
  const readingTime = Math.ceil(wordCount / 250)
  const imageCount = (markdownContent.match(/!\[.*?\]\(.*?\)/g) || []).length
  const linkCount = (markdownContent.match(/\[.*?\]\(.*?\)/g) || []).length

  log(
    `Metadata calculated: ${wordCount} words, ${readingTime} min read, ${imageCount} images, ${linkCount} links`
  )

  return {
    html, // This is the processed HTML
    metadata: {
      ...frontmatter,
      title:
        frontmatter.title || firstHeading || path.basename(filePath, '.md'),
      toc,
      wordCount,
      readingTime,
      imageCount,
      linkCount
    }
  }
}

// Process a single markdown file
async function processMarkdownFile(fullPath, cache) {
  const relativePath = path.relative(contentDir, fullPath)
  const slug = relativePath.replace(/\.md$/, '')
  const outputPath = path.join(outputDir, `${slug}.json`)

  const fileContent = await fs.readFile(fullPath, 'utf-8')
  const currentHash = computeContentHash(fileContent)

  if (cache.files[fullPath] && cache.files[fullPath].hash === currentHash) {
    console.log(`File unchanged, using cached version: ${fullPath}`)
    return { slug, ...cache.files[fullPath].metadata }
  }

  console.log(`Processing markdown file: ${fullPath}`)
  const { html, metadata } = await processMarkdown(fileContent, fullPath)

  if (!html) {
    throw new Error(`Failed to generate HTML for ${fullPath}`)
  }

  console.log(`Writing processed file to: ${outputPath}`)
  await fs.mkdir(path.dirname(outputPath), { recursive: true })
  await fs.writeFile(
    outputPath,
    JSON.stringify({ slug, ...metadata, content: html }, null, 2)
  )

  cache.files[fullPath] = { hash: currentHash, metadata }
  return { slug, ...metadata }
}

// Add this function to your script
async function getFilesRecursively(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = await Promise.all(entries.map(async (entry) => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      return getFilesRecursively(fullPath);
    } else if (entry.isFile() && path.extname(entry.name) === '.md') {
      const stats = await stat(fullPath);
      return { path: fullPath, mtime: stats.mtime };
    }
    return [];
  }));

  return files.flat();
}

// Main function to process all files
async function processAllFiles() {
  console.log('Starting to process all files')
  const cache = await loadCache()
  let isInterrupted = false;

  // Set up interrupt handler
  const interruptHandler = async () => {
    if (isInterrupted) {
      console.log('Forced exit. Some progress may be lost.');
      process.exit(1);
    }
    console.log('\nInterrupt received. Saving progress...');
    isInterrupted = true;
  };

  process.on('SIGINT', interruptHandler);

  try {
    console.log('Collecting and sorting files...')
    const allFiles = await getFilesRecursively(contentDir)
    allFiles.sort((a, b) => b.mtime - a.mtime) // Sort by modification time, newest first

    const manifestLite = [];
    for (const file of allFiles) {
      if (isInterrupted) break;
      try {
        const result = await processMarkdownFile(file.path, cache)
        await saveCache(cache) // Save cache after each file is processed
        manifestLite.push(result);
      } catch (error) {
        console.error(`Error processing ${file.path}:`, error)
      }
      // Small delay to allow interrupt to be processed
      await setTimeoutPromise(0);
    }

    // Filter out null results (from errors)
    const filteredManifest = manifestLite.filter(Boolean)

    if (!isInterrupted) {
      console.log('Writing manifest-lite.json')
      const manifestPath = path.join(outputDir, 'manifest-lite.json')
      await fs.mkdir(path.dirname(manifestPath), { recursive: true })
      await fs.writeFile(manifestPath, JSON.stringify(filteredManifest, null, 2))
    }

    await saveCache(cache)
  } catch (error) {
    console.error('Error processing files:', error)
    throw error
  } finally {
    process.off('SIGINT', interruptHandler);
    if (isInterrupted) {
      console.log('Progress saved. Exiting.');
      process.exit(0);
    }
  }
}
// Helper function to extract the title from the frontmatter of the linked markdown file
// async function getTitleFromFrontmatter(match) {
//   const targetPath = path.join(contentDir, `${match}.md`)

//   try {
//     const fileContent = await fs.readFile(targetPath, 'utf8')
//     const { data: frontmatter } = matter(fileContent)

//     // Return the title from the frontmatter, or use the filename as fallback
//     return frontmatter.title || path.basename(match, '.md')
//   } catch (err) {
//     console.error(`Error reading file ${targetPath}:`, err)
//     return match // Fallback to the match if the file doesn't exist
//   }
// }

function remarkObsidianSupport() {
  return async (tree) => {
    // Handle [[wikilinks]]
    const visit = (await import('unist-util-visit')).visit // Dynamically import visit to support async
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
        // const alias = linkParts[1] || (await getTitleFromFrontmatter(match))
        // TODO: Properly extract title from frontmatter
        const alias = linkParts[1] || target
        const heading = linkParts[0].split('#')[1]

        // Generate the URL
        let url = `/blog/${encodeURIComponent(target)}`
        if (heading) {
          url += `#${slugify(heading, { lower: true, strict: true })}`
        }

        // Create link node
        nodes.push({
          type: 'link',
          url,
          children: [{ type: 'text', value: alias }]
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

      // add a special internal-link class to the link
      nodes.forEach((node) => {
        if (node.type === 'link') {
          node.data = node.data || {}
          node.data.hProperties = node.data.hProperties || {}
          node.data.hProperties.className = 'internal-link'
        }
      })

      // Replace the original text node with the new nodes
      if (nodes.length > 0) {
        parent.children.splice(index, 1, ...nodes)
        return [visit.SKIP, index + nodes.length]
      }
    })
  }
}

// Add a new logging function
function log(message, level = 'info') {
  const timestamp = new Date().toISOString()
  console[level](`[${timestamp}] ${message}`)
}

// =============================
// Execute the Script
// =============================

// Start processing all markdown files
processAllFiles().catch(console.error)



