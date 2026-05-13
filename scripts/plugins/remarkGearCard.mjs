/**
 * @file plugins/remarkGearCard.mjs
 * @description Remark plugin that converts ::gear{slug="..."} directives
 *   into HTML placeholder divs. A client-side plugin mounts Vue components
 *   on these placeholders at runtime.
 * @usage .use(remarkDirective).use(remarkGearCard)
 *
 * Directive syntax in Markdown:
 *   ::gear{slug="moletta-lionsteel-folding-black-knife"}
 *
 * Output HTML:
 *   <div class="gear-card-inline" data-gear-slug="moletta-lionsteel-folding-black-knife"></div>
 */

import { visit } from 'unist-util-visit'

/** Escape a string for safe use inside an HTML attribute value (double-quoted). */
const escapeAttr = (str) =>
  str.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

/** Validate that a slug contains only URL-safe characters. */
const isValidSlug = (str) => /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(str)

export function remarkGearCard() {
  return (tree, file) => {
    visit(tree, ['containerDirective', 'leafDirective'], (node) => {
      if (node.name !== 'gear') return

      const rawSlug = node.attributes?.slug?.trim()
      if (!rawSlug) {
        // eslint-disable-next-line no-console
        console.warn(
          `[remarkGearCard] ::gear directive missing slug attribute` +
            ` (in ${file?.path || 'unknown'})`
        )
        return
      }

      if (!isValidSlug(rawSlug)) {
        // eslint-disable-next-line no-console
        console.warn(
          `[remarkGearCard] ::gear slug "${rawSlug}" contains unexpected characters` +
            ` (in ${file?.path || 'unknown'}) — skipping`
        )
        return
      }

      const safeSlug = escapeAttr(rawSlug)
      node.type = 'html'
      node.value = `<div class="gear-card-inline" data-gear-slug="${safeSlug}"></div>`
      delete node.children
    })
  }
}
