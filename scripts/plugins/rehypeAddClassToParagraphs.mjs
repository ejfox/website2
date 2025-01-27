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
          addClasses(node, [
            'prose-p',
            'prose-lg',
            'max-w-prose',
            'mb-4',
            'leading-relaxed',
            'dark:prose-invert',
            'animate-on-scroll'
          ])
          node.properties.style = 'max-width: 60ch;'
          break

        case 'blockquote':
          addClasses(node, [
            'prose-blockquote',
            'prose-lg',
            'max-w-prose',
            'pl-4',
            'border-l-4',
            'border-zinc-300',
            'dark:border-zinc-700',
            'italic',
            'my-4',
            'text-zinc-700',
            'dark:text-zinc-300',
            'animate-on-scroll',
            'slide-from-left'
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
            'max-w-full',
            'mx-auto',
            'transition-all',
            'duration-300',
            'ease-in-out',
            'pr-2 py-2',
            'md:pr-6 md:py-4',
            'lg:pr-12 lg:py-6',
            'animate-on-scroll',
            'slide-from-bottom',
            'will-change-transform'
          ])
          break

        case 'h1':
          addClasses(node, [
            'prose-lg',
            'text-4xl',
            'font-bold',
            'mb-6',
            'mt-8',
            'max-w-prose',
            'lg:pr-12',
            'animate-on-scroll',
            'slide-from-left'
          ])
          break

        case 'h2':
          addClasses(node, [
            'prose-lg',
            'text-3xl',
            'font-semibold',
            'mb-4',
            'mt-8',
            'max-w-prose',
            'border-b',
            'border-zinc-200',
            'dark:border-zinc-800',
            'pb-2',
            'md:pr-12',
            'animate-on-scroll',
            'slide-from-left'
          ])
          break

        case 'h3':
          addClasses(node, [
            'prose-lg',
            'text-2xl',
            'font-medium',
            'mb-3',
            'mt-6',
            'max-w-prose',
            'md:pr-12',
            'animate-on-scroll',
            'slide-from-left'
          ])
          break

        case 'ul':
          addClasses(node, [
            'prose-lg',
            'list-disc',
            'list-outside',
            'ml-6',
            'mb-4',
            'space-y-2',
            'max-w-prose'
          ])
          break

        case 'ol':
          addClasses(node, [
            'prose-lg',
            'list-decimal',
            'list-outside',
            'ml-6',
            'mb-4',
            'space-y-2',
            'max-w-prose'
          ])
          break

        case 'li':
          addClasses(node, ['prose-lg', 'max-w-prose'])
          break

        case 'a':
          addClasses(node, [
            'prose-lg',
            'text-blue-600',
            'dark:text-blue-400',
            'hover:underline',
            'transition-colors',
            'duration-200'
          ])
          break

        case 'code':
          if (node.properties.className?.includes('language-')) {
            // Code block
            addClasses(node, [
              'prose-lg',
              'block',
              'rounded-lg',
              'bg-zinc-100',
              'dark:bg-zinc-800',
              'p-4',
              'my-4',
              'overflow-x-auto',
              'font-mono',
              'text-sm'
            ])
          } else {
            // Inline code
            addClasses(node, [
              'prose-lg',
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
            'prose-lg',
            'relative',
            'rounded-lg',
            'overflow-hidden',
            'shadow-sm'
          ])
          break

        case 'table':
          addClasses(node, [
            'prose-lg',
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
              'prose-p',
              'prose-lg',
              'max-w-prose',
              'mb-4',
              'text-zinc-600',
              'dark:text-zinc-400'
            ])
            child.properties.style = 'max-width: 60ch;'
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
