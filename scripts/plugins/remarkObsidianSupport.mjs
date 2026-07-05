/**
 * @file plugins/remarkObsidianSupport.mjs
 * @description Remark plugin that converts Obsidian [[wikilinks]] to standard markdown links with proper routing
 * @usage .use(remarkObsidianSupport)
 */

import { visit } from 'unist-util-visit'
import { getTitleFromFrontmatter } from '../utils/helpers.mjs'
import {
  generateSlug,
  normalizeTarget,
  buildInternalHref,
  classifyInternalHref,
} from '../utils/internal-links.mjs'

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

        // Dead internal links (target post missing / draft / excluded) render as
        // a non-clickable span so readers aren't sent to a 404. Validity is known
        // only after buildValidRoutes() has run; until then everything is "valid".
        const { internal, valid } = classifyInternalHref(url)
        const isDead = internal && valid === false

        nodes.push({
          type: 'link',
          url,
          children: [{ type: 'text', value: alias }],
          data: isDead
            ? {
                hName: 'span',
                hProperties: {
                  href: null, // it's a <span> now — drop the inherited href
                  className: 'internal-link internal-link-dead',
                  title: 'This linked page no longer exists',
                  'data-dead-link': url,
                },
              }
            : {
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
