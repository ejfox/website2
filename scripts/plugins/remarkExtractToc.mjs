import { visit } from 'unist-util-visit'
import GithubSlugger from 'github-slugger'

export function extractHeadersAndToc(tree, maxDepth = 3) {
  const slugger = new GithubSlugger()
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

    const headingSlug = slugger.slug(headingText)

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

export function removeFirstHeading(tree, firstHeadingNode) {
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

    // Remove first heading if requested
    if (options.removeFirstHeading) {
      removeFirstHeading(tree, firstHeadingNode)
    }

    return tree
  }
}
