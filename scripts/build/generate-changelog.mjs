#!/usr/bin/env node
/**
 * @file generate-changelog.mjs
 * @description Pre-generate git changelog at build time so the runtime container
 *              (which has no `git` binary) can serve /api/changelog from a static file.
 * @usage node scripts/generate-changelog.mjs
 * @output data/changelog.json
 */

import { execSync } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'

const COMMIT_LIMIT = 500

try {
  const stdout = execSync(
    `git log --pretty=format:'%H|%an|%ae|%at|%s' --no-merges -n ${COMMIT_LIMIT}`,
    { encoding: 'utf-8' }
  )

  const commits = stdout
    .split('\n')
    .filter((line) => line.trim())
    .map((line) => {
      const [hash, author, email, timestamp, ...rest] = line.split('|')
      return {
        hash,
        author,
        email,
        timestamp: Number.parseInt(timestamp),
        message: rest.join('|'),
      }
    })

  mkdirSync('data', { recursive: true })
  writeFileSync(
    'data/changelog.json',
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        commits,
      },
      null,
      0
    )
  )

  console.log(`✓ Changelog: ${commits.length} commits → data/changelog.json`)
} catch (error) {
  console.error('✗ Changelog generation failed:', error.message)
  // Write empty changelog so the endpoint doesn't 500 in production
  mkdirSync('data', { recursive: true })
  writeFileSync(
    'data/changelog.json',
    JSON.stringify({ generatedAt: new Date().toISOString(), commits: [] })
  )
  process.exit(0) // non-fatal: build continues
}
