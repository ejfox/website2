/**
 * # rehype-vizhub
 * 
 * Simple markdown syntax for interactive visualizations:
 * 
 * ```js{viz:true}
 * import * as d3 from 'd3';
 * export const main = (container) => { ... }
 * ```
 * 
 * With options:
 * ```js{viz:true hide-code highlight-lines="1,3-5"}
 * export const main = (container) => { ... }
 * ```
 */

import { visit } from 'unist-util-visit'
import type { Element } from 'hast'

interface Metadata {
  isViz?: boolean
  hideCode?: boolean
  height?: string
  highlightLines?: number[]
}

function parseMetadata(className: string[] = []): Metadata {
  const metadata: Metadata = {}
  
  for (const cls of className) {
    if (typeof cls !== 'string') continue
    
    // Basic flags
    if (cls.includes('viz:true')) metadata.isViz = true
    if (cls.includes('hide-code')) metadata.hideCode = true
    
    // Height
    const heightMatch = cls.match(/height="([^"]+)"/)
    if (heightMatch) metadata.height = heightMatch[1]
    
    // Line highlighting
    const highlightMatch = cls.match(/highlight-lines="([^"]+)"/)
    if (highlightMatch) {
      metadata.highlightLines = highlightMatch[1]
        .split(',')
        .flatMap((range: string) => {
          const [start, end] = range.trim().split('-').map(Number)
          return end 
            ? Array.from({ length: end - start + 1 }, (_, i) => start + i)
            : [start]
        })
    }
  }
  
  return metadata
}

function rehypeVizHub() {
  return (tree: Element) => {
    visit(tree, 'element', (node: Element) => {
      if (node.tagName === 'pre') {
        const codeNode = node.children[0] as Element
        if (codeNode && codeNode.tagName === 'code') {
          const className = (codeNode.properties?.className || []) as string[]
          const metadata = parseMetadata(className)
          
          if (metadata.isViz) {
            const code = (codeNode.children[0] as any)?.value || ''
            
            // Create wrapper with minimal data attributes
            const wrapperNode: Element = {
              type: 'element',
              tagName: 'div',
              properties: {
                className: ['vizhub-container'],
                'data-vizhub': 'true',
                'data-code': code,
                ...(metadata.hideCode && { 'data-hide-code': 'true' }),
                ...(metadata.height && { 'data-height': metadata.height }),
                ...(metadata.highlightLines?.length && {
                  'data-highlight-lines': JSON.stringify(metadata.highlightLines)
                })
              },
              children: [
                // Viz container
                {
                  type: 'element',
                  tagName: 'div',
                  properties: {
                    className: ['vizhub-viz'],
                    style: `width: 100%; min-height: ${metadata.height || '400px'};`
                  },
                  children: []
                },
                // Code (if not hidden)
                ...(metadata.hideCode ? [] : [node])
              ]
            }
            
            // Replace original node
            Object.assign(node, wrapperNode)
          }
        }
      }
    })
  }
}

export default rehypeVizHub