/**
 * @file plugins/remarkHandDrawn.mjs
 * @description Remark plugin that converts :hd{} directives into inline SVG
 *   placeholders. The client plugin (plugins/hand-drawn.client.ts) swaps in the
 *   actual hand-drawn mark at runtime — no Vue mount needed, it's decoration.
 * @usage .use(remarkDirective).use(remarkHandDrawn)
 *
 * Markdown syntax (inline text directive):
 *   :hd{name="arrow-right-long"}
 *   :hd[look here]{name="arrow-bend-down-right" size="2rem"}
 *
 * Output HTML:
 *   <span class="hd-inline" data-hd="arrow-right-long"></span>
 *   <span class="hd-inline" data-hd="arrow-bend-down-right" data-size="2rem" data-hd-title="look here"></span>
 */
import { visit } from 'unist-util-visit'

const escapeAttr = (str) =>
  String(str)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

const isValidName = (str) => /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(str)
const isValidSize = (str) => /^[0-9.]+(?:px|rem|em|%)?$/.test(str)

// pull the bracket label text out of a directive node's children
const labelText = (node) =>
  (node.children || [])
    .map((c) => (c.type === 'text' ? c.value : ''))
    .join('')
    .trim()

export function remarkHandDrawn() {
  return (tree, file) => {
    visit(tree, ['textDirective', 'leafDirective'], (node) => {
      if (node.name !== 'hd') return

      const name = node.attributes?.name?.trim()
      if (!name || !isValidName(name)) {
        console.warn(
          `[remarkHandDrawn] :hd directive missing/invalid name "${name ?? ''}"` +
            ` (in ${file?.path || 'unknown'}) — skipping`
        )
        return
      }

      const size = node.attributes?.size?.trim()
      const title = labelText(node)

      let attrs = `class="hd-inline" data-hd="${escapeAttr(name)}"`
      if (size && isValidSize(size)) attrs += ` data-size="${escapeAttr(size)}"`
      if (title) attrs += ` data-hd-title="${escapeAttr(title)}"`

      node.type = 'html'
      node.value = `<span ${attrs}></span>`
      delete node.children
    })
  }
}
