#!/usr/bin/env node
/**
 * CLI wrapper for markdownToHtml - used by website-dispatch preview server
 * Usage: node scripts/preview-convert.mjs <filepath>
 * Output: JSON with { html, title }
 */

import { promises as fs } from 'node:fs'
import { convertMarkdown } from './markdownToHtml.mjs'

const filePath = process.argv[2]

if (!filePath) {
  console.error('Usage: node preview-convert.mjs <filepath>')
  process.exit(1)
}

try {
  const content = await fs.readFile(filePath, 'utf-8')
  const result = await convertMarkdown(content, filePath)
  console.log(JSON.stringify({
    html: result.html,
    title: result.title,
    toc: result.metadata.toc || []
  }))
} catch (error) {
  console.error(JSON.stringify({ error: error.message }))
  process.exit(1)
}
