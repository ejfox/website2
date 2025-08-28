import { visit } from 'unist-util-visit'

// Define SVG for horizontal rule - using the simpler line style
const hrSvg = `<svg class="mx-auto my-8 w-full max-w-prose" height="1">
  <line x1="0" y1="0" x2="100%" y2="0" stroke="currentColor" stroke-width="1" stroke-dasharray="2,4" />
</svg>`

export function rehypeAddClassToParagraphs() {
  return (tree) => {
    visit(tree, 'element', (node) => {
      node.properties = node.properties || {}
      node.properties.className = node.properties.className || []

      switch (node.tagName) {
        case 'p':
          // Prose width constraint + spacing for paragraphs
          addClasses(node, ['mb-4', 'max-w-prose', 'mx-auto'])
          break

        case 'blockquote':
          addClasses(node, [
            'pl-4',
            'border-l-4',
            'border-zinc-300',
            'dark:border-zinc-700',
            'my-4',
            'max-w-prose',
            'mx-auto'
          ])
          break

        case 'hr':
          // Replace hr with custom SVG
          node.type = 'raw'
          node.value = hrSvg
          break

        case 'img':
          addClasses(node, [
            'w-full',
            'mx-auto',
            'py-4'
          ])
          break

        case 'h1':
          addClasses(node, [
            'text-4xl',
            'font-bold',
            'mb-6',
            'mt-8',
            'max-w-prose',
            'mx-auto',
            'font-sans'
          ])
          break

        case 'h2':
          addClasses(node, [
            'text-3xl',
            'font-semibold',
            'mb-4',
            'mt-8',
            'max-w-prose',
            'mx-auto',
            'font-sans'
          ])
          break

        case 'h3':
          addClasses(node, [
            'text-2xl',
            'font-medium',
            'mb-3',
            'mt-6',
            'max-w-prose',
            'mx-auto',
            'font-sans'
          ])
          break

        case 'ul':
          addClasses(node, [
            'list-disc',
            'ml-6',
            'mb-4',
            'max-w-prose',
            'mx-auto'
          ])
          break

        case 'ol':
          addClasses(node, [
            'list-decimal',
            'ml-6',
            'mb-4',
            'max-w-prose',
            'mx-auto'
          ])
          break

        case 'li':
          // No special classes for li
          break

        case 'a':
          // Minimal link styling
          addClasses(node, ['text-blue-600', 'dark:text-blue-400'])
          break

        case 'code':
          if (node.properties.className?.includes('language-')) {
            // Code block - match body text size with proper padding
            addClasses(node, [
              'block',
              'text-base',
              'rounded-lg',
              'bg-zinc-100',
              'dark:bg-zinc-800',
              'p-6',
              'my-4',
              'overflow-x-auto',
              'font-mono'
            ])
          } else {
            // Inline code - keep smaller
            addClasses(node, [
              'font-mono',
              'text-sm',
              'bg-zinc-100',
              'dark:bg-zinc-800',
              'rounded',
              'px-1.5',
              'py-0.5'
            ])
          }
          break

        case 'pre':
          addClasses(node, [
            'relative',
            'rounded-lg',
            'overflow-hidden',
            'shadow-sm',
            'max-w-prose',
            'mx-auto'
          ])
          break

        case 'table':
          addClasses(node, [
            'prose-sm',
            'min-w-full',
            'border-collapse',
            'table-auto',
            'my-4',
            'text-sm'
          ])
          break

        case 'th':
          addClasses(node, [
            'border-b',
            'border-zinc-200',
            'dark:border-zinc-700',
            'bg-zinc-50',
            'dark:bg-zinc-800',
            'px-4',
            'py-2',
            'text-left',
            'font-medium'
          ])
          break

        case 'td':
          addClasses(node, [
            'border-b',
            'border-zinc-200',
            'dark:border-zinc-700',
            'px-4',
            'py-2'
          ])
          break

        case 'sup':
          if (node.properties?.className?.includes('footnote-ref')) {
            addClasses(node, [
              'text-xs',
              'font-medium',
              'text-blue-600',
              'dark:text-blue-400',
              'ml-0.5'
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
              'dark:border-zinc-800'
            ])
          }
          break
      }

      // Special handling for paragraphs inside blockquotes
      if (node.tagName === 'blockquote') {
        visit(node, 'element', (child) => {
          if (child.tagName === 'p') {
            addClasses(child, [
              'text-zinc-600',
              'dark:text-zinc-400'
            ])
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
