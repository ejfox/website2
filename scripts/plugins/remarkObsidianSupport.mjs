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

const WIKILINK_RE = /\[\[([^\]]+)\]\]/g

export function remarkObsidianSupport() {
  return async (tree) => {
    // `unist-util-visit` is SYNCHRONOUS — it does not await an async visitor, so
    // the alias frontmatter-title lookups (async) have to be resolved BEFORE we
    // mutate the tree. Pass 1 collects every target that needs a title; pass 2
    // rewrites the nodes synchronously using the resolved map.

    // ── Pass 1: collect targets needing a title lookup ──────────────────────
    const targetsNeedingTitle = new Set()
    visit(tree, 'text', (node) => {
      if (!node.value.includes('[[')) return
      let m
      WIKILINK_RE.lastIndex = 0
      while ((m = WIKILINK_RE.exec(node.value)) !== null) {
        const parts = m[1].split('|')
        if (parts[1]?.trim()) continue // explicit |alias — no lookup needed
        const target = normalizeTarget(parts[0].trim().split('#')[0])
        if (target) targetsNeedingTitle.add(target)
      }
    })

    const titleMap = new Map()
    await Promise.all(
      [...targetsNeedingTitle].map(async (t) => {
        titleMap.set(t, await getTitleFromFrontmatter(t))
      }),
    )

    // ── Pass 2: rewrite text nodes containing wikilinks (synchronous) ───────
    visit(tree, 'text', (node, index, parent) => {
      if (parent == null || index == null) return
      const value = node.value
      if (!value.includes('[[')) return

      let match
      let lastIndex = 0
      const nodes = []
      WIKILINK_RE.lastIndex = 0

      while ((match = WIKILINK_RE.exec(value)) !== null) {
        const [, linkText] = match
        const start = match.index
        const end = WIKILINK_RE.lastIndex

        // Text before the wikilink
        if (start > lastIndex) {
          nodes.push({ type: 'text', value: value.slice(lastIndex, start) })
        }

        const linkParts = linkText.split('|')
        const targetWithHeading = linkParts[0].trim()
        const [rawTarget, rawHeading] = targetWithHeading.split('#')
        const target = normalizeTarget(rawTarget)
        const heading = rawHeading?.trim()

        // Degenerate wikilink ([[|alias]], [[ | ]], [[#heading]]): no real
        // target. Leave the raw text rather than emit a bogus /tag/ link.
        if (!target) {
          nodes.push({ type: 'text', value: value.slice(start, end) })
          lastIndex = end
          continue
        }

        const alias = linkParts[1]?.trim() || titleMap.get(target) || target

        let url = buildInternalHref(target)
        if (heading) url += `#${generateSlug(heading)}`

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

      // Remaining text after the last wikilink
      if (lastIndex < value.length) {
        nodes.push({ type: 'text', value: value.slice(lastIndex) })
      }

      if (nodes.length > 0) {
        parent.children.splice(index, 1, ...nodes)
        // Continue after the inserted nodes. The inserted text slices never
        // contain a wikilink (the regex consumed them all), so re-scanning is
        // unnecessary and skipping avoids reprocessing link children.
        return index + nodes.length
      }
    })
  }
}
