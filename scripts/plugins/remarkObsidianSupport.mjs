/**
 * @file plugins/remarkObsidianSupport.mjs
 * @description Remark plugin that converts Obsidian [[wikilinks]] to standard markdown links with proper routing
 * @usage .use(remarkObsidianSupport)
 */

import { visit } from 'unist-util-visit'
import { getTitleFromFrontmatter } from '../utils/helpers.mjs'

// Helper function to generate slugs for headings
function generateSlug(str) {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function encodePath(pathValue) {
  return pathValue
    .split('/')
    .filter(Boolean)
    .map((segment) => encodeURIComponent(segment))
    .join('/')
}

function normalizeTarget(rawTarget) {
  if (!rawTarget) return ''
  let target = rawTarget.trim().replace(/\\/g, '/')

  if (target.startsWith('/')) target = target.slice(1)
  if (target.endsWith('.md')) target = target.slice(0, -3)

  while (target.startsWith('../')) {
    target = target.slice(3)
  }
  if (target.startsWith('./')) target = target.slice(2)

  target = target.replace(/\/{2,}/g, '/')
  return target
}

function buildInternalHref(target) {
  const normalized = normalizeTarget(target)
  const lower = normalized.toLowerCase()

  if (lower.startsWith('reading/')) {
    return `/reading/${encodePath(normalized.slice('reading/'.length))}`
  }
  if (lower.startsWith('projects/')) {
    return `/projects/${encodePath(normalized.slice('projects/'.length))}`
  }
  if (lower.startsWith('robots/')) {
    return `/blog/robots/${encodePath(normalized.slice('robots/'.length))}`
  }
  if (lower.startsWith('week-notes/')) {
    return `/blog/week-notes/${encodePath(normalized.slice('week-notes/'.length))}`
  }
  if (lower.startsWith('blog/')) {
    return `/blog/${encodePath(normalized.slice('blog/'.length))}`
  }

  return `/blog/${encodePath(normalized)}`
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
        const [, linkText] = match
        const start = match.index
        const end = wikilinkRegex.lastIndex

        // Add text before the wikilink
        if (start > lastIndex) {
          nodes.push({
            type: 'text',
            value: value.slice(lastIndex, start),
          })
        }

        const linkParts = linkText.split('|')
        const targetWithHeading = linkParts[0].trim()
        const [rawTarget, rawHeading] = targetWithHeading.split('#')
        const target = normalizeTarget(rawTarget)
        const alias =
          linkParts[1]?.trim() || (await getTitleFromFrontmatter(target))
        const heading = rawHeading?.trim()

        // Generate the URL
        let url = buildInternalHref(target)
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
              className: 'internal-link',
            },
          },
        })

        lastIndex = end
      }

      // Add remaining text after the last wikilink
      if (lastIndex < value.length) {
        nodes.push({
          type: 'text',
          value: value.slice(lastIndex),
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
