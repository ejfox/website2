/**
 * @file plugins/remarkExtractToc.mjs
 * @description Remark plugin that extracts table of contents from headings and stores in vfile.data
 * @usage .use(remarkExtractToc, { maxDepth: 3 })
 */

import { visit } from 'unist-util-visit'
import GithubSlugger from 'github-slugger'
import { toString } from 'mdast-util-to-string'

export function extractHeadersAndToc(tree, maxDepth = 3) {
  const slugger = new GithubSlugger()
  let firstHeading = null
  let firstHeadingNode = null
  const toc = []
  const headingStack = []

  visit(tree, 'heading', (node) => {
    if (node.depth > maxDepth) return

    // Extract text content from heading, handling various node types
    const extractText = (nodes) => {
      return nodes
        .map((child) => {
          if (child.type === 'text') {
            return child.value
          } else if (child.type === 'inlineCode') {
            // Include code spans — rehype-slug slugs the rendered heading
            // (which contains the code text), so dropping it here would make
            // the TOC anchor (#slug) not match the heading id.
            return child.value
          } else if (child.type === 'image') {
            return child.alt || '' // Use alt text for images
          } else if (
            child.type === 'link' ||
            child.type === 'emphasis' ||
            child.type === 'strong' ||
            child.type === 'delete'
          ) {
            return extractText(child.children || [])
          }
          return ''
        })
        .join('')
    }

    const headingText = extractText(node.children).trim()

    // Skip empty headings
    if (!headingText) return

    const headingSlug = slugger.slug(headingText)

    const headingItem = {
      text: headingText,
      slug: headingSlug,
      level: `h${node.depth}`,
      children: [],
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

const normalize = (text) => text.toLowerCase().replace(/[^\p{L}\p{N}]/gu, '')

/**
 * Drop the heading a post opens with when it just repeats the title — the
 * page already renders the title as the hero <h1>, so leaving it in shows the
 * title twice. Only the opening block, only h1/h2, and only when it matches
 * the frontmatter title (or there is none, in which case it IS the title), so
 * a real first section heading is never touched. Run on the mdast before
 * processor.run(), so the TOC doesn't list it either.
 * @returns {string | null} the dropped heading's text
 */
export function dropTitleHeading(tree, title) {
  const first = tree.children[0]
  if (first?.type !== 'heading' || first.depth > 2) return null
  const text = toString(first).trim()
  if (title && normalize(text) !== normalize(String(title))) return null
  tree.children.shift()
  return text
}

// Export the remark plugin
export function remarkExtractToc(options = { maxDepth: 3 }) {
  return (tree, file) => {
    const { firstHeading, toc, firstHeadingNode } = extractHeadersAndToc(
      tree,
      options.maxDepth
    )

    // Store the results in the vfile data
    file.data.toc = toc
    file.data.firstHeading = firstHeading
    file.data.firstHeadingNode = firstHeadingNode

    return tree
  }
}
