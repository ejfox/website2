#!/usr/bin/env node
/**
 * @file preview-convert.mjs
 * @description Render one markdown file to HTML for the Dispatch app's live
 *   preview (content/blog/projects/website-dispatch.md). No yarn script; the
 *   app shells out: `node scripts/author/preview-convert.mjs <filepath>`.
 *   Prints JSON `{ html, title, toc }` on stdout, or `{ error }` on stderr
 *   with exit 1. Read-only: no network, git or writes.
 *   Pipeline lives in scripts/author/markdownToHtml.mjs.
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
  console.info(
    JSON.stringify({
      html: result.html,
      title: result.title,
      toc: result.metadata.toc || [],
    })
  )
} catch (error) {
  console.error(JSON.stringify({ error: error.message }))
  process.exit(1)
}
