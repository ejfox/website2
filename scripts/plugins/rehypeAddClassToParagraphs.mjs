/**
 * @file plugins/rehypeAddClassToParagraphs.mjs
 * @description Rehype plugin that adds Tailwind CSS classes to HTML elements (blockquotes, code blocks, tables, footnotes)
 * @usage .use(rehypeAddClassToParagraphs)
 */

import { visit } from 'unist-util-visit'

// Define SVG for horizontal rule - using the simpler line style
const hrSvg =
  `<svg class="mx-auto my-8 w-full max-w-prose" height="1">
  <line x1="0" y1="0" x2="100%" y2="0" stroke="currentColor" ` +
  `stroke-width="1" stroke-dasharray="2,4" />
</svg>`

export function rehypeAddClassToParagraphs() {
  return (tree) => {
    visit(tree, 'element', (node) => {
      node.properties = node.properties || {}
      node.properties.className = node.properties.className || []

      switch (node.tagName) {
        case 'p':
          // Let CSS handle paragraph styles
          break

        case 'blockquote':
          addClasses(node, ['md-blockquote'])
          break

        case 'hr':
          // Replace hr with custom SVG
          node.type = 'raw'
          node.value = hrSvg
          break

        case 'img':
          addClasses(node, ['w-full', 'mx-auto', 'py-4'])
          break

        case 'h1':
          // Let CSS handle heading styles
          break

        case 'h2':
          // Let CSS handle heading styles
          break

        case 'h3':
          // Let CSS handle heading styles
          break

        case 'h4':
        case 'h5':
        case 'h6':
          // Let CSS handle heading styles
          break

        case 'ul':
          // Let CSS handle list styles
          addClasses(node, ['list-disc'])
          break

        case 'ol':
          // Let CSS handle list styles
          addClasses(node, ['list-decimal'])
          break

        case 'li':
          // No special classes for li
          break

        case 'a':
          // Minimal link styling
          addClasses(node, ['text-blue-600', 'dark:text-blue-400'])
          break

        case 'code':
          if (
            node.properties?.className?.includes('language-') ||
            node.properties?.dataLanguage ||
            node.properties?.['data-language']
          ) {
            // Code block - match body text size with proper padding
            addClasses(node, ['md-codeblock'])
          } else {
            // Inline code - keep smaller
            addClasses(node, ['md-inline-code'])
          }
          break

        case 'pre':
          addClasses(node, ['md-pre'])
          break

        case 'table':
          addClasses(node, ['md-table'])
          break

        case 'th':
          addClasses(node, ['md-th'])
          break

        case 'td':
          addClasses(node, [
            'border-b',
            'border-zinc-200',
            'dark:border-zinc-700',
            'px-4',
            'py-2',
          ])
          break

        case 'sup':
          if (node.properties?.className?.includes('footnote-ref')) {
            addClasses(node, [
              'text-xs',
              'font-medium',
              'text-blue-600',
              'dark:text-blue-400',
              'ml-0.5',
            ])
          }
          break

        case 'section':
          if (node.properties?.className?.includes('footnotes')) {
            addClasses(node, [
              'mt-8',
              'pt-8',
              'border-t',
              'border-zinc-200',
              'dark:border-zinc-800',
            ])
          }
          break
      }

      // Special handling for paragraphs inside blockquotes
      if (node.tagName === 'blockquote') {
        visit(node, 'element', (child) => {
          if (child.tagName === 'p') {
            addClasses(child, ['text-zinc-600', 'dark:text-zinc-400'])
          }
        })
      }
    })
  }
}

// Helper function to add classes while preserving existing ones
function addClasses(node, newClasses) {
  node.properties = node.properties || {}
  node.properties.className = node.properties.className || []

  if (Array.isArray(node.properties.className)) {
    node.properties.className.push(...newClasses)
  } else if (typeof node.properties.className === 'string') {
    node.properties.className = node.properties.className
      .split(' ')
      .concat(newClasses)
      .join(' ')
  } else {
    node.properties.className = newClasses
  }
}
