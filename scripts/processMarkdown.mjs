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
const contentDir = path.join(process.cwd(), 'content', 'blog')
const outputDir = path.join(process.cwd(), 'dist', 'processed')

// =============================
// Define Cloudinary Base URL
// =============================
const CLOUDINARY_BASE_URL = `https://res.cloudinary.com/${
  cloudinary.config().cloud_name
}/image/upload/`

const cacheFilePath = path.join(__dirname, 'scrapCache.json')

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
// Define SVGs
// =============================
const hrSvg = `
<svg class="max-w-prose" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 365 17.45" style="opacity: 0.2;">
  <path d="M363.07,7.35c-6.21-.45-12.42-.9-18.64-1.35-18.41-1.33-36.82-2.76-55.24-3.97-10.28-.67-20.58-1.22-30.88-1.42-18.17-.35-36.34-.41-54.51-.54-7.59-.05-15.19-.15-22.78.09-14.2.46-28.48.93-42.6,1.72-13.22.46-26.48.33-39.67,1.17-17.66,1.12-35.34,2.41-52.89,4.59-14.88,1.85-29.58,5.06-44.36,7.73-.56.1-1.01.83-1.51,1.26.46.29.96.86,1.38.81,2.08-.25,4.14-.63,6.19-1.04,10.8-2.18,21.52-5,32.41-6.41,14.22-1.84,28.58-2.71,42.9-3.73,13.56-.97,27.13-1.75,40.72-2.32,15.19-.64,30.4-1.13,45.6-1.39,20.64-.35,41.28-.59,61.92-.55,13.09.03,26.17.61,39.26,1.01,11.59.36,23.2.58,34.77,1.29,12.3.76,24.58,1.99,36.86,3.07,6.81.6,13.63,1.16,20.41,2.05.23-.68.44-1.37.64-2.07Z"/>
</svg>`

const headerStar = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 14.81 17.81" class="header-star inline-block mr-2" width="14" height="17" opacity="0.2">
  <path d="M10.01,5.75c1.18-.82,2.19-1.55,3.22-2.24.48-.32,1.05-.52,1.45.07.39.58-.22.78-.54,1.07-1.15,1.05-2.29,2.12-3.46,3.14-1.61,1.41-1.68,2.82-.12,4.35.44.43.97.78,1.48,1.15.42.3.69.68.51,1.19-.2.58-.69.76-1.28.85-.87.14-1.6-1.14-2.32-.42-.47.48-.41,1.47-.65,2.2-.13.39-.52.6-.91.67-.54.1-.89-.26-1.1-.68-.37-.72-.37-1.45-.11-2.26.29-.91.9-2.19,0-2.72-.56-.33-1.53.82-2.14,1.53-.76.88-1.8,1.51-2.32,2.62-.23.48-.75.58-1.22.35-.67-.31-.56-.89-.31-1.4.71-1.44,1.94-2.43,3.1-3.46,2.66-2.37,2.68-2.36.36-5.11-.5-.6-1.05-1.16-1.57-1.74-.22-.25-.34-.56-.13-.84.2-.27.56-.24.87-.19,1.09.18,1.71,1.01,2.43,1.72.54.54,1.03,1.57,1.74,1.37.82-.24.4-1.36.48-2.08.18-1.48.32-2.95.89-4.33C8.48.27,8.7.01,9.04,0c.48-.01.69.37.72.75.07.93.1,1.87.07,2.81-.02.68-.26,1.36.17,2.19Z"/>
</svg>`

// =============================
// Initialize Cache with a TTL of 1 day (86400 seconds)
// =============================
const imageDimensionsCache = new NodeCache({ stdTTL: 86400, checkperiod: 120 })

// Path to Cache File
const imageCacheFilePath = path.join(
  __dirname,
  '..',
  'cache',
  'imageDimensionsCache.json'
)

// Load Cache from File if Exists
async function loadCache() {
  try {
    await fs.access(imageCacheFilePath)
    const cacheData = JSON.parse(await fs.readFile(cacheFilePath, 'utf-8'))
    imageDimensionsCache.mset(
      Object.keys(cacheData).map((key) => ({ key, val: cacheData[key] }))
    )
    console.log('Image dimensions cache loaded.')
  } catch (error) {
    console.warn('No existing cache found. Starting fresh.')
  }
}

// Save Cache to File on Exit
async function saveCache() {
  try {
    const cacheData = {}
    imageDimensionsCache.keys().forEach((key) => {
      cacheData[key] = imageDimensionsCache.get(key)
    })
    await fs.mkdir(path.dirname(cacheFilePath), { recursive: true })
    await fs.writeFile(cacheFilePath, JSON.stringify(cacheData), 'utf-8')
    console.log('Image dimensions cache saved.')
  } catch (error) {
    console.error('Error saving cache:', error)
  }
}

// Handle Process Exit Signals to Save Cache
process.on('exit', saveCache)
process.on('SIGINT', async () => {
  await saveCache()
  process.exit()
})
process.on('SIGTERM', async () => {
  await saveCache()
  process.exit()
})

// =============================
// Define socialPlatforms Once (DRY)
// =============================
const socialPlatforms = {
  'wikipedia.org': 'simple-icons:wikipedia',
  'github.com': 'simple-icons:github',
  'github.blog': 'simple-icons:github',
  'github.io': 'typcn:social-github',
  'youtube.com': 'simple-icons:youtube',
  'twitter.com': 'simple-icons:twitter',
  'apple.com': 'simple-icons:apple',
  'itunes.apple.com': 'simple-icons:apple',
  'observablehq.com': 'simple-icons:observable',
  'pinboard.in': 'simple-icons:pinboard',
  'goodreads.com': 'simple-icons:goodreads',
  'glitch.com': 'simple-icons:glitch',
  'stackoverflow.com': 'simple-icons:stackoverflow',
  'mailto:': 'ic:baseline-email',
  'nytimes.com': 'tabler:brand-nytimes',
  'washingtonpost.com': 'simple-icons:thewashingtonpost',
  'nbcnews.com': 'simple-icons:nbc',
  'cnn.com': 'simple-icons:cnn',
  'bbc.com': 'simple-icons:bbc',
  'reuters.com': 'arcticons:reuters',
  'archive.org': 'academicons:archive',
  'web.archive.org': 'academicons:archive',
  'buzzfeed.com': 'simple-icons:buzzfeed',
  'vox.com': 'simple-icons:vox',
  'medium.com': 'simple-icons:medium',
  'scribd.com': 'simple-icons:scribd',
  'patreon.com': 'simple-icons:patreon',
  'soundcloud.com': 'simple-icons:soundcloud',
  'bandcamp.com': 'simple-icons:bandcamp',
  'npmjs.com': 'simple-icons:npm',
  'hackernews.com': 'fa6-brands:square-hacker-news',
  'instagram.com': 'simple-icons:instagram',
  'facebook.com': 'simple-icons:facebook',
  'discord.com': 'simple-icons:discord',
  'reddit.com': 'fa6-brands:reddit',
  'tiktok.com': 'simple-icons:tiktok',
  'twitch.tv': 'simple-icons:twitch',
  'linkedin.com': 'simple-icons:linkedin',
  'pinterest.com': 'simple-icons:pinterest',
  'snapchat.com': 'simple-icons:snapchat',
  'tumblr.com': 'simple-icons:tumblr',
  'whatsapp.com': 'simple-icons:whatsapp',
  'telegram.com': 'simple-icons:telegram',
  'signal.com': 'simple-icons:signal',
  'slack.com': 'simple-icons:slack',
  'zoom.us': 'simple-icons:zoom',
  'meet.google.com': 'simple-icons:googlemeet',
  'discord.gg': 'simple-icons:discord',
  '.gov': 'game-icons:usa-flag',
  'vuejs.org': 'mdi:vuejs',
  'reactjs.org': 'mdi:react',
  'netlify.com': 'file-icons:netlify',
  'nuxtjs.org': 'mdi:nuxt',
  'cloudinary.com': 'simple-icons:cloudinary',
  'cloudflare.com': 'simple-icons:cloudflare',
  'aws.amazon.com': 'simple-icons:amazonaws',
  'gcp.google.com': 'simple-icons:googlecloud',
  'firebase.google.com': 'simple-icons:firebase'
}

// =============================
// Helper Functions
// =============================

/**
 * Extracts the image public ID from the Cloudinary URL or local path.
 * @param {string} url - The original image URL.
 * @returns {string} - The Cloudinary public ID.
 */
// function extractImageId(url) {
//   console.log('Extracting ID from:', url)
//   const urlParts = url.split('/')
//   const imageWithExtension = urlParts[urlParts.length - 1]
//   const imageId = imageWithExtension.split('.')[0] // Removes the extension
//   console.log('Extracted ID:', imageId)
//   return imageId
// }

/**
 * Generates a Cloudinary URL with specified transformations.
 * @param {string} imageId - The Cloudinary public ID of the image.
 * @param {object} options - Transformation options.
 * @param {number[]} options.responsiveWidths - Array of widths for srcset.
 * @returns {object} - Contains the transformed URL and srcset.
 */
function generateCloudinaryUrl(imageId, options) {
  const { responsiveWidths, existingTransformations = '' } = options
  const MAX_WIDTH = 1800

  // a correct cloudinary URL should look like this
  // https://res.cloudinary.com/ejf/image/upload/w_1200/dpr_auto/v1717945172/jm8gkazk2mfmarwvqvn6.jpg

  // Generate srcset for responsive images
  const srcset = responsiveWidths
    .map((w) => {
      const respWidth = Math.min(w, MAX_WIDTH)
      return `https://res.cloudinary.com/ejf/image/upload/${existingTransformations}/w_${respWidth},dpr_auto,f_auto,q_auto/${imageId}.webp ${respWidth}w`
    })
    .join(', ')

  // Use the largest width for the main URL
  const largestWidth = Math.min(Math.max(...responsiveWidths), MAX_WIDTH)
  const url = `https://res.cloudinary.com/ejf/image/upload/${existingTransformations}/w_${largestWidth}/dpr_auto,f_auto,q_auto/${imageId}.webp`
  return { url, srcset }
}
/**
 * Generates a responsive <img> tag with Cloudinary transformations.
 * @param {object} params - Parameters for the img tag.
 * @param {string} params.url - The optimized image URL.
 * @param {number} params.width - Original image width.
 * @param {number} params.height - Original image height.
 * @param {string} params.srcset - The srcset attribute value.
 * @returns {string} - The HTML string for the img tag.
 */
function generateResponsiveImgTag({ url, width, height, srcset }) {
  return `<img src="${url}" srcset="${srcset}" width="${width}" height="${height}" loading="lazy" class="w-full h-auto" alt="" />`
}

/**
 * Processes an image node to use Cloudinary's optimized URL and embeds dimensions.
 * @param {object} node - The image node from the markdown AST.
 */
async function processCloudinaryImage(node) {
  console.log('Processing image:', node.url)

  if (node.url.includes('res.cloudinary.com')) {
    // Extract the public ID and any existing transformations
    const urlParts = node.url.split('/upload/')
    const existingTransformations = urlParts[1].split('/')[0]
    const publicId = urlParts[1].split('/').slice(1).join('/').split('.')[0]

    console.log('Extracted public ID:', publicId)

    // Generate new optimized URL and srcset
    const { url, srcset } = generateCloudinaryUrl(publicId, {
      responsiveWidths: [320, 480, 640, 768, 1024, 1280, 1800],
      existingTransformations
    })

    const imgTag = generateResponsiveImgTag({
      url,
      width: 1920, // You might want to fetch actual dimensions if needed
      height: 1080,
      srcset
    })

    // console.log('Generated optimized imgTag:', imgTag)
    node.type = 'html'
    node.value = imgTag

    return true
  } else {
    // console.log('Non-Cloudinary image, processing as before')
    // Your existing logic for non-Cloudinary images
    return false
  }
}
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
async function processMarkdown(filePath) {
  log(`Processing file: ${filePath}`)
  const fileContent = await fs.readFile(filePath, 'utf8')
  log(`File content read: ${filePath}`)
  const { data: frontmatter, content } = matter(fileContent)
  log(`Frontmatter extracted: ${JSON.stringify(frontmatter)}`)

  const processor = unified()
    .use(remarkParse)
    // .use(remarkObsidian)
    .use(remarkObsidianSupport)
    .use(remarkCustomElements) // Custom plugin for images, links, and code
    .use(enhanceLinksWithScraps) // Enhance links with metadata from Supabase
    .use(remarkGfm)
    .use(remarkUnwrapImages)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeAddClassToParagraphs)
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
      // other options as needed
    })
    .use(rehypeSlug)
    .use(rehypeAutolinkHeadings, {
      content: fromHtmlIsomorphic(headerStar, { fragment: true }).children
    })
    .use(rehypeStringify, { allowDangerousHtml: true })

  log('Parsing content')
  const ast = processor.parse(content)
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

  const wordCount = content.split(/\s+/).length
  const readingTime = Math.ceil(wordCount / 250)
  const imageCount = (content.match(/!\[.*?\]\(.*?\)/g) || []).length
  const linkCount = (content.match(/\[.*?\]\(.*?\)/g) || []).length

  log(`Metadata calculated: ${wordCount} words, ${readingTime} min read, ${imageCount} images, ${linkCount} links`)

  return {
    html,
    metadata: {
      ...frontmatter,
      title: frontmatter.title || firstHeading || path.basename(filePath, '.md'),
      toc,
      wordCount,
      readingTime,
      imageCount,
      linkCount
    }
  }
}

/**
 * Recursively processes all markdown files in the content directory.
 */
async function processAllFiles() {
  log('Starting to process all files')
  const manifestLite = []
  const cacheFile = path.join(outputDir, 'file-cache.json')
  let fileCache = {}

  // Load existing cache if available
  try {
    fileCache = JSON.parse(await fs.readFile(cacheFile, 'utf8'))
    log('Loaded existing file cache')
  } catch (error) {
    log('No existing file cache found, creating new cache')
  }

  async function processDirectory(dir) {
    log(`Processing directory: ${dir}`)
    const entries = await fs.readdir(dir, { withFileTypes: true })
    log(`Found ${entries.length} entries in ${dir}`)

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name)

      if (entry.isDirectory()) {
        log(`Entering subdirectory: ${fullPath}`)
        await processDirectory(fullPath)
      } else if (entry.isFile() && path.extname(entry.name) === '.md') {
        const relativePath = path.relative(contentDir, fullPath)
        const slug = relativePath.replace(/\.md$/, '')
        const outputPath = path.join(outputDir, `${slug}.json`)

        // Check if file has changed
        const fileStats = await fs.stat(fullPath)
        const currentHash = crypto
          .createHash('md5')
          .update(fileStats.mtime.toISOString())
          .digest('hex')

        if (fileCache[fullPath] === currentHash) {
          log(`File unchanged, skipping: ${fullPath}`)
          // Load existing processed data
          const existingData = JSON.parse(await fs.readFile(outputPath, 'utf8'))
          manifestLite.push({ slug, ...existingData.metadata })
          continue
        }

        log(`Processing markdown file: ${fullPath}`)
        const { html, metadata } = await processMarkdown(fullPath)

        log(`Writing processed file to: ${outputPath}`)
        await fs.mkdir(path.dirname(outputPath), { recursive: true })

        await fs.writeFile(
          outputPath,
          JSON.stringify({ slug, ...metadata, content: html }, null, 2)
        )
        log(`File written: ${outputPath}`)

        manifestLite.push({ slug, ...metadata })
        log(`Added to manifest: ${slug}`)

        // Update cache
        fileCache[fullPath] = currentHash
      }
    }
  }

  await processDirectory(contentDir)

  log('Writing manifest-lite.json')
  await fs.writeFile(
    path.join(outputDir, 'manifest-lite.json'),
    JSON.stringify(manifestLite, null, 2)
  )
  log('manifest-lite.json written successfully')

  // Save updated cache
  await fs.writeFile(cacheFile, JSON.stringify(fileCache, null, 2))
  log('File cache updated and saved')
}

// Helper function to extract the title from the frontmatter of the linked markdown file
async function getTitleFromFrontmatter(match) {
  const targetPath = path.join(contentDir, `${match}.md`)

  try {
    const fileContent = await fs.readFile(targetPath, 'utf8')
    const { data: frontmatter } = matter(fileContent)

    // Return the title from the frontmatter, or use the filename as fallback
    return frontmatter.title || path.basename(match, '.md')
  } catch (err) {
    console.error(`Error reading file ${targetPath}:`, err)
    return match // Fallback to the match if the file doesn't exist
  }
}

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

// Load the cache before processing
await loadCache()
log('Cache loaded')

// Start processing all markdown files
processAllFiles()
  .then(() => log('All files processed successfully'))
  .catch((error) => log(`Error processing files: ${error}`, 'error'))