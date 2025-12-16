/**
 * @file plugins/remarkObsidianEnhanced.mjs
 * @description Remark plugin for Obsidian expandable details/callouts (??? syntax and {expand:} inline syntax)
 * @usage .use(remarkObsidianEnhanced)
 */

import { visit } from 'unist-util-visit'

/**
 * Enhanced Obsidian support with expandable details
 *
 * NOTE: Sidenotes now use standard markdown footnotes[^1] only
 *
 * Expandable details:
 * 1. ??? "Title here" → expandable section
 * 2. {expand: Title | Hidden content here}
 */

export function remarkObsidianEnhanced() {
  return (tree) => {
    // Footnotes are now handled by standard markdown processing
    // This plugin focuses on Obsidian-specific features like expandable details

    // Process expandable details using ??? syntax (Obsidian Admonition style)
    visit(tree, 'paragraph', (node, index, parent) => {
      if (
        node.children[0]?.type === 'text' &&
        node.children[0].value.startsWith('??? ')
      ) {
        const firstLine = node.children[0].value
        const titleMatch = firstLine.match(/\?\?\? "([^"]+)"/)

        if (titleMatch) {
          const title = titleMatch[1]
          const contentStart = titleMatch.index + titleMatch[0].length

          // Collect all content after the ??? marker
          const content = []

          // Rest of first line
          if (contentStart < firstLine.length) {
            content.push({
              type: 'text',
              value: firstLine.slice(contentStart).trim(),
            })
          }

          // Add rest of children
          if (node.children.length > 1) {
            content.push(...node.children.slice(1))
          }

          // Collect following paragraphs until we hit a non-indented line
          let nextIndex = index + 1
          while (nextIndex < parent.children.length) {
            const nextNode = parent.children[nextIndex]

            // Check if this is part of the expandable section
            // (In Obsidian, indented content belongs to the admonition)
            if (nextNode.type === 'paragraph' || nextNode.type === 'list') {
              content.push(nextNode)
              nextIndex++
            } else {
              break
            }
          }

          // Replace with details/summary HTML
          const detailsNode = {
            type: 'html',
            value: `<details class="expandable-details obsidian-callout">
  <summary class="expandable-summary">
    <span class="expandable-icon">▶</span>
    <span class="expandable-title">${title}</span>
  </summary>
  <div class="expandable-content">`,
          }

          // Create a wrapper for content
          const contentWrapper = {
            type: 'parent',
            children: content,
          }

          const closeDetails = {
            type: 'html',
            value: '</div></details>',
          }

          // Replace original node(s) with details
          const nodesToReplace = nextIndex - index
          parent.children.splice(
            index,
            nodesToReplace,
            detailsNode,
            contentWrapper,
            closeDetails
          )

          return [visit.SKIP, index + 3]
        }
      }
    })

    // Add inline expandables: {expand: Title | Content}
    visit(tree, 'text', (node, index, parent) => {
      const value = node.value
      // eslint-disable-next-line regexp/no-super-linear-backtracking
      const expandPattern = /\{expand:\s*([^|]+)\|\s*([^}]+)\}/g
      let match
      const nodes = []
      let lastIndex = 0

      while ((match = expandPattern.exec(value)) !== null) {
        const [fullMatch, title, content] = match
        const start = match.index

        if (start > lastIndex) {
          nodes.push({
            type: 'text',
            value: value.slice(lastIndex, start),
          })
        }

        nodes.push({
          type: 'html',
          value: `<details class="inline-expandable">
  <summary class="inline-expandable-summary">${title.trim()}</summary>
  <span class="inline-expandable-content">${content.trim()}</span>
</details>`,
        })

        lastIndex = match.index + fullMatch.length
      }

      if (nodes.length > 0) {
        if (lastIndex < value.length) {
          nodes.push({
            type: 'text',
            value: value.slice(lastIndex),
          })
        }
        parent.children.splice(index, 1, ...nodes)
        return [visit.SKIP, index + nodes.length]
      }
    })
  }
}
