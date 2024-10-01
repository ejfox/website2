import { promises as fs } from 'fs'
import { readFileSync } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkRehype from 'remark-rehype'
import rehypeStringify from 'rehype-stringify'
import rehypeSlug from 'rehype-slug'
import rehypeAutolinkHeadings from 'rehype-autolink-headings'
import remarkObsidian from 'remark-obsidian'
import remarkMermaid from 'remark-mermaidjs'
import remarkGfm from 'remark-gfm'
import remarkUnwrapImages from 'remark-unwrap-images'
import rehypeMermaid from 'rehype-mermaid'
import rehypeShiki from 'rehype-shiki'
import withShiki from '@stefanprobst/remark-shiki'
import * as shiki from 'shiki'
import rehypePrettyCode from 'rehype-pretty-code'
import { transformerCopyButton } from '@rehype-pretty/transformers'
import fetch from 'node-fetch' // Added for fetching SVGs
import { visit } from 'unist-util-visit'
import matter from 'gray-matter'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const contentDir = path.join(__dirname, '..', 'content', 'blog')
const outputDir = path.join(__dirname, '..', 'dist', 'processed')

const CLOUDINARY_BASE_URL = 'https://res.cloudinary.com/ejf/image/upload/'

// Set up Shiki highlighter
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

async function processMarkdown(filePath) {
  const fileContent = await fs.readFile(filePath, 'utf8')
  const { data: frontmatter, content } = matter(fileContent)

  const processor = unified()
    .use(remarkParse)
    .use(remarkObsidian)
    .use(remarkCustomElements)
    .use(remarkGfm)
    .use(remarkUnwrapImages)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypePrettyCode, {
      defaultLang: 'ansi',
      keepBackground: false,
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
    .use(rehypeAutolinkHeadings)
    .use(rehypeAddClassToParagraphs)
    .use(rehypeStringify, { allowDangerousHtml: true })

  const ast = processor.parse(content)
  const { firstHeading, toc, firstHeadingNode } = extractHeadersAndToc(ast)

  // Remove the first heading from the AST
  removeFirstHeading(ast, firstHeadingNode)

  const result = await processor.run(ast)

  const html = processor.stringify(result)

  const wordCount = content.split(/\s+/).length
  const readingTime = Math.ceil(wordCount / 250)
  const imageCount = (content.match(/!\[.*?\]\(.*?\)/g) || []).length
  const linkCount = (content.match(/\[.*?\]\(.*?\)/g) || []).length

  return {
    html,
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

function remarkCustomElements() {
  return async (tree) => {
    const iconCache = {} // Cache to store fetched SVGs

    async function getIconSVG(iconName) {
      if (iconCache[iconName]) {
        return iconCache[iconName]
      }

      const [prefix, name] = iconName.split(':')
      const url = `https://api.iconify.design/${prefix}/${name}.svg`
      const response = await fetch(url)
      if (response.ok) {
        const svg = await response.text()
        iconCache[iconName] = svg
        return svg
      } else {
        console.error(`Failed to fetch icon: ${iconName}`)
        return null
      }
    }

    // Function to get text content from a node
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

    const imageNodes = []
    const linkNodes = []
    const codeNodes = []

    visit(tree, 'image', (node) => {
      imageNodes.push(node)
    })

    visit(tree, 'link', (node) => {
      linkNodes.push(node)
    })

    visit(tree, 'code', (node) => {
      codeNodes.push(node)
    })

    // Process images
    for (const node of imageNodes) {
      if (!node.url.startsWith('http')) {
        const imageId = path.basename(node.url)
        node.url = `${CLOUDINARY_BASE_URL}${imageId}`
      }
    }

    // Process links
    for (const node of linkNodes) {
      const { href, icon, isWikilink } = processLink(node.url)
      node.url = href
      if (icon || isWikilink) {
        node.type = 'html'
        let linkClass = isWikilink ? 'class="internal-link"' : ''
        let iconHtml = ''
        if (icon) {
          const svg = await getIconSVG(icon)
          if (svg) {
            // Add inline styles to make the SVG inline-block
            const styledSvg = svg.replace(
              '<svg',
              '<svg style="display: inline-block; vertical-align: middle; width: 0.7em; height: 0.7em; margin-left: 0.2rem; margin-right: 0.2rem; margin-top: -0.2em; opacity: 0.8;"'
            )
            iconHtml = `${styledSvg}`
          }
        }
        const linkText = getNodeText(node)
        node.value = `<a href="${href}" ${linkClass}>${linkText}${iconHtml}</a>`
      }
    }

    // Process code nodes
    for (const node of codeNodes) {
      if (node.meta === 'runnable') {
        node.type = 'html'
        node.value = `<div class="runnable-code" data-language="${
          node.lang
        }" data-source="${encodeURIComponent(node.value)}">
          <pre><code class="language-${node.lang}">${node.value}</code></pre>
        </div>`
      }
    }
  }
}

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
      }
    })
  }
}

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
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-')
}

function processLink(href) {
  const socialPlatforms = {
    'wikipedia.org': 'simple-icons:wikipedia',
    'github.com': 'simple-icons:github',
    'github.blog': 'simple-icons:github',
    'github.io': 'typcn:social-github',
    'youtube.com': 'simple-icons:youtube',
    'twitter.com': 'simple-icons:twitter',
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

  if (href.startsWith('#/page/') || href.startsWith('blog/test#/page/')) {
    const slug = href.split('/').pop()
    return { href: `/blog/${slug}`, isWikilink: true }
  }

  return { href }
}

async function processAllFiles() {
  const manifestLite = []

  async function processDirectory(dir) {
    const entries = await fs.readdir(dir, { withFileTypes: true })

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name)

      if (entry.isDirectory()) {
        await processDirectory(fullPath)
      } else if (entry.isFile() && path.extname(entry.name) === '.md') {
        const { html, metadata } = await processMarkdown(fullPath)

        const relativePath = path.relative(contentDir, fullPath)
        const slug = relativePath.replace(/\.md$/, '')
        const outputPath = path.join(outputDir, `${slug}.json`)

        await fs.mkdir(path.dirname(outputPath), { recursive: true })

        await fs.writeFile(
          outputPath,
          JSON.stringify({ slug, ...metadata, content: html }, null, 2)
        )

        manifestLite.push({ slug, ...metadata })
      }
    }
  }

  await processDirectory(contentDir)

  await fs.writeFile(
    path.join(outputDir, 'manifest-lite.json'),
    JSON.stringify(manifestLite, null, 2)
  )
}

processAllFiles().catch(console.error)
