import { visit } from 'unist-util-visit'
import { getTitleFromFrontmatter } from '../utils/helpers.mjs'

// Helper function to generate slugs for headings
function generateSlug(str) {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function remarkObsidianSupport() {
  return async (tree) => {
    // Handle [[wikilinks]]
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
