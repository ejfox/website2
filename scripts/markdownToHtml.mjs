/**
 * @file markdownToHtml.mjs
 * @description Lightweight markdown-to-HTML converter using the EXACT same
 *              unified pipeline as processMarkdown.mjs, but without the
 *              full content processing (on-this-day index, link checking, etc.)
 * @usage Import and call convertMarkdown(content, filename)
 */

import { promises as fs } from 'node:fs'
import path from 'node:path'
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkRehype from 'remark-rehype'
import rehypeStringify from 'rehype-stringify'
import rehypeSlug from 'rehype-slug'
import remarkGfm from 'remark-gfm'
import rehypePrettyCode from 'rehype-pretty-code'
import rehypeRaw from 'rehype-raw'
import matter from 'gray-matter'
import { transformerCopyButton } from '@rehype-pretty/transformers'
import * as shiki from 'shiki'

import {
  remarkAi2htmlEmbed,
  remarkObsidianSupport,
  rehypeAddClassToParagraphs,
  remarkEnhanceLinks,
  remarkEnhanceImages,
  remarkExtractToc,
} from './plugins/index.mjs'

// Load theme once - use absolute path for compatibility with eval scripts
const themePath = path.join(
  path.dirname(new URL(import.meta.url).pathname),
  '../themes/ayu-mirage.json'
)
const theme = JSON.parse(await fs.readFile(themePath, 'utf-8'))

// Create highlighter once
const highlighter = await shiki.createHighlighter({
  themes: ['github-dark'],
  langs: ['javascript', 'typescript', 'json', 'html', 'css', 'markdown'],
})

// EXACT same processor as processMarkdown.mjs
const processor = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkExtractToc)
  .use(remarkObsidianSupport)
  .use(remarkEnhanceImages)
  .use(remarkEnhanceLinks)
  .use(remarkAi2htmlEmbed)
  .use(remarkRehype, { allowDangerousHtml: true })
  .use(rehypeRaw)
  .use(rehypePrettyCode, {
    theme,
    onVisitLine(node) {
      if (node.children.length === 0)
        node.children = [{ type: 'text', value: ' ' }]
    },
    onVisitHighlightedLine(node) {
      node.properties.className.push('highlighted')
    },
    onVisitHighlightedWord(node) {
      node.properties.className = ['word']
    },
    highlighter,
    transformers: [
      transformerCopyButton({ visibility: 'always', feedbackDuration: 3000 }),
    ],
  })
  .use(rehypeAddClassToParagraphs)
  .use(rehypeSlug)
  .use(rehypeStringify, { allowDangerousHtml: true })

const formatTitle = (filename) => {
  const baseName = filename.split('/').pop()
  return baseName
    .replace(/\.md$/, '')
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

/**
 * Convert markdown content to HTML using the EXACT same pipeline as the blog
 * @param {string} content - Raw markdown content (including frontmatter)
 * @param {string} filename - Filename for title extraction
 * @returns {Promise<{html: string, title: string, metadata: object}>} Converted result
 */
export async function convertMarkdown(content, filename = 'preview.md') {
  const { data: frontmatter, content: markdownContent } = matter(content)

  let ast = processor.parse(markdownContent)

  // Create vfile to hold data from plugins
  const vfile = { path: filename, data: {} }

  // Process through unified pipeline
  let result = await processor.run(ast, vfile)

  // Get TOC data from plugin
  const toc = vfile.data?.toc || []
  const firstHeading = vfile.data?.firstHeading
  const firstHeadingNode = vfile.data?.firstHeadingNode

  // Remove first heading if it exists (same as processMarkdown.mjs)
  if (firstHeadingNode) {
    const index = result.children.indexOf(firstHeadingNode)
    if (index !== -1) {
      result.children.splice(index, 1)
    }
  }

  let html = processor.stringify(result)

  const extractedTitle =
    frontmatter.title ||
    firstHeading ||
    formatTitle(path.basename(filename, '.md'))

  return {
    html,
    title: extractedTitle,
    metadata: {
      ...frontmatter,
      toc,
    },
  }
}

export { processor }
