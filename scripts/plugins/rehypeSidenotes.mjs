import { visit } from 'unist-util-visit'

/**
 * Rehype plugin to transform footnotes into sidenotes
 * This processes markdown footnotes during build time to prepare them for the client-side sidenotes plugin
 */
export default function rehypeSidenotes(options = {}) {
  const {
    containerClass = 'has-sidenotes',
    footnoteClass = 'footnote',
    sidenoteClass = 'sidenote-source',
    referenceClass = 'sidenote-reference'
  } = options

  return function transformer(tree, file) {
    let hasFootnotes = false
    const footnotes = new Map()
    const footnoteRefs = []

    // First pass: collect all footnotes
    visit(tree, 'element', (node, index, parent) => {
      // Find footnote list items
      if (node.tagName === 'li' && node.properties?.id?.startsWith('fn')) {
        hasFootnotes = true
        const id = node.properties.id

        // Clone the node to avoid mutations
        const content = JSON.parse(JSON.stringify(node.children))

        // Remove the back-reference link
        const filtered = content.filter(child => {
          if (child.type === 'element' && child.tagName === 'a') {
            const href = child.properties?.href
            return !href?.startsWith('#fnref')
          }
          return true
        })

        footnotes.set(id, {
          id,
          content: filtered,
          node
        })
      }

      // Find footnote references
      if (node.tagName === 'sup' && node.properties?.className?.includes('footnote-ref')) {
        footnoteRefs.push(node)
        // Add additional class for styling
        if (!node.properties.className.includes(referenceClass)) {
          node.properties.className.push(referenceClass)
        }
      }
    })

    if (!hasFootnotes) return

    // Second pass: add metadata to footnote section
    visit(tree, 'element', (node, index, parent) => {
      // Find the footnotes section
      if (node.tagName === 'section' && node.properties?.className?.includes('footnotes')) {
        // Add data attributes for client-side processing
        node.properties['data-footnotes'] = 'true'
        node.properties['data-sidenotes-enabled'] = 'true'

        // Add class for styling
        if (!node.properties.className.includes(sidenoteClass)) {
          node.properties.className.push(sidenoteClass)
        }

        // Mark each footnote with metadata
        visit(node, 'element', (child) => {
          if (child.tagName === 'li' && child.properties?.id) {
            child.properties['data-footnote'] = child.properties.id
          }
        })
      }

      // Add container class to article or main content wrapper
      if ((node.tagName === 'article' || node.tagName === 'main') && hasFootnotes) {
        if (!node.properties) {
          node.properties = {}
        }
        if (!node.properties.className) {
          node.properties.className = []
        }
        if (!node.properties.className.includes(containerClass)) {
          node.properties.className.push(containerClass)
        }
      }
    })

    // Third pass: enhance footnote references with preview data
    footnoteRefs.forEach(ref => {
      const link = ref.children?.[0]
      if (link?.tagName === 'a') {
        const href = link.properties?.href
        const footnoteId = href?.slice(1) // Remove the #
        const footnote = footnotes.get(footnoteId)

        if (footnote) {
          // Add data attributes for client-side enhancement
          link.properties['data-footnote-id'] = footnoteId
          link.properties['data-footnote-content'] = extractText(footnote.content)
          link.properties['aria-describedby'] = footnoteId
          link.properties['role'] = 'doc-noteref'
        }
      }
    })

    // Helper function to extract text content
    function extractText(nodes) {
      let text = ''

      const extract = (node) => {
        if (typeof node === 'string') {
          text += node
        } else if (node.type === 'text') {
          text += node.value
        } else if (node.children) {
          node.children.forEach(extract)
        }
      }

      nodes.forEach(extract)
      return text.trim().slice(0, 200) // Limit preview length
    }

    // Add global styles for sidenotes (will be processed by the client plugin)
    if (hasFootnotes && parent) {
      const styleNode = {
        type: 'element',
        tagName: 'div',
        properties: {
          className: ['sidenotes-styles'],
          style: 'display: none;',
          'data-sidenotes-count': footnotes.size
        },
        children: []
      }

      // Add at the end of the document
      tree.children.push(styleNode)
    }
  }
}

/**
 * Remark plugin to pre-process footnote syntax
 * This ensures footnotes are properly formatted before rehype processing
 */
export function remarkFootnotesPrep() {
  return function transformer(tree, file) {
    visit(tree, 'footnoteDefinition', (node) => {
      // Ensure footnote definitions have proper structure
      if (!node.identifier) {
        node.identifier = `fn${Date.now()}`
      }

      // Add metadata
      node.data = node.data || {}
      node.data.hProperties = node.data.hProperties || {}
      node.data.hProperties['data-footnote-definition'] = node.identifier
    })

    visit(tree, 'footnoteReference', (node) => {
      // Ensure footnote references have proper structure
      node.data = node.data || {}
      node.data.hProperties = node.data.hProperties || {}
      node.data.hProperties['data-footnote-reference'] = node.identifier
    })
  }
}