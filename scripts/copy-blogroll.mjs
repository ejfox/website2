#!/usr/bin/env node
/**
 * @file copy-blogroll.mjs
 * @description Snapshot the developer's local newsboat URLs file into data/blogroll.urls
 *              at build time, so the runtime container (which has no $HOME/.newsboat)
 *              can serve /api/blogroll from a static file.
 * @usage node scripts/copy-blogroll.mjs
 * @output data/blogroll.urls
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'

const sourcePath = join(homedir(), '.newsboat', 'urls')
const targetPath = 'data/blogroll.urls'

mkdirSync('data', { recursive: true })

if (existsSync(sourcePath)) {
  const content = readFileSync(sourcePath, 'utf-8')
  writeFileSync(targetPath, content)
  const lineCount = content
    .split('\n')
    .filter((l) => l.trim() && !l.startsWith('#')).length
  console.log(`✓ Blogroll: ${lineCount} feeds → ${targetPath}`)
} else {
  // No newsboat config on this machine — write an empty file so the endpoint
  // gracefully returns 0 feeds rather than 500.
  if (!existsSync(targetPath)) {
    writeFileSync(targetPath, '# No newsboat config found at build time\n')
  }
  console.log(
    `! Blogroll: ${sourcePath} not found; keeping existing ${targetPath} (or wrote stub)`
  )
}
