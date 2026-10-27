/**
 * @file plugins/remarkMermaid.mjs
 * @description Renders ```mermaid fenced code blocks to inline SVG at build time
 * with Pele (https://pele.run — Mermaid syntax, zero deps, CSS-variable theming).
 * No client JS: colors come from the --pele-* vars in global.css, so light/dark
 * switch without re-rendering.
 *
 * Wide diagrams also get a narrow variant (Pele re-lays it out, e.g. LR → TB)
 * that CSS swaps in on phones, instead of shrinking the wide one to unreadable.
 *
 * A diagram that fails to parse renders as its escaped source plus the error,
 * and logs a warning — it never breaks the build.
 *
 * Gotchas: output is baked into cached JSON, so a Pele upgrade or a change
 * here only reaches a post when it's reprocessed. Inline Mermaid style /
 * classDef colors are fixed and don't follow dark mode. Theme vars and the
 * .diagram-wide / .diagram-narrow swap live in assets/css/global.css. Tested
 * by scripts/utils/__tests__/diagrams.test.mjs.
 * @usage .use(remarkMermaid) — must be before remarkRehype
 */

import { createHash } from 'node:crypto'
import { visit } from 'unist-util-visit'
import { render, PeleError } from 'pele'

const escapeHtml = (s) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

// Matches the article content wrapper (max-w-4xl) and the phone breakpoint
// in global.css (.diagram-narrow shows below 640px).
const WIDE = 896
const NARROW = 360

// Georgia is the body font. Node has no canvas, so Pele measures with its
// built-in width table — within ~1% of real Georgia in Chrome.
const BASE = {
  fontFamily: 'Georgia, serif',
  fontFamilyMono: 'ui-monospace, monospace',
  linkRel: 'noopener nofollow',
}

export function renderDiagram(source, idPrefix) {
  const wide = render(source, { ...BASE, maxWidth: WIDE, idPrefix })
  // Narrow enough to stay legible on a phone: ship one SVG, skip the re-layout.
  if (wide.width <= NARROW * 1.5) {
    return `<figure class="diagram" data-diagram="${wide.type}">${wide.svg}</figure>`
  }
  const narrow = render(source, {
    ...BASE,
    maxWidth: NARROW,
    idPrefix: `${idPrefix}n-`,
  })
  return (
    `<figure class="diagram diagram-responsive" data-diagram="${wide.type}">` +
    `<div class="diagram-wide">${wide.svg}</div>` +
    `<div class="diagram-narrow">${narrow.svg}</div>` +
    `</figure>`
  )
}

export function remarkMermaid() {
  return (tree, file) => {
    let index = 0
    visit(tree, 'code', (node) => {
      if (node.lang !== 'mermaid') return
      const source = node.value
      const hash = createHash('sha256').update(source).digest('hex').slice(0, 8)
      // Unique per diagram so two SVGs on one page don't collide on
      // marker/gradient ids (hash of source + position in the post).
      const idPrefix = `d${hash}${index++}-`
      try {
        node.value = renderDiagram(source, idPrefix)
      } catch (error) {
        if (!(error instanceof PeleError)) throw error
        console.warn(
          `[diagram] ${file?.path || 'unknown'}: ${error.message.split('\n')[0]}`
        )
        node.value =
          `<pre class="diagram-error" data-error="${escapeHtml(error.message.split('\n')[0]).replace(/"/g, '&quot;')}">` +
          `${escapeHtml(source)}</pre>`
      }
      // code → html node: remarkRehype passes it through as raw HTML
      // (allowDangerousHtml) instead of escaping it into a <pre>.
      node.type = 'html'
      delete node.lang
      delete node.meta
    })
  }
}
