/**
 * @file plugins/remarkMermaid.mjs
 * @description Converts ```mermaid fenced code blocks into raw HTML <pre class="mermaid">
 * nodes so rehype-pretty-code skips them. mermaid.js renders them client-side.
 * @usage .use(remarkMermaid) — must be before remarkRehype
 */

import { visit } from 'unist-util-visit'

const escapeHtml = (s) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

export function remarkMermaid() {
  return (tree) => {
    visit(tree, 'code', (node) => {
      if (node.lang !== 'mermaid') return
      node.type = 'html'
      node.value = `<pre class="mermaid">${escapeHtml(node.value)}</pre>`
      delete node.lang
      delete node.meta
    })
  }
}
