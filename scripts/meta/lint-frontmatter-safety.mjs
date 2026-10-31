#!/usr/bin/env node
/**
 * @file lint-frontmatter-safety.mjs
 * @description Safety linter to catch accidental exposure risks in blog frontmatter.
 *   Reads content/blog/**.md (skips dot-dirs and `!` files). Read-only, no
 *   network. Gates deploys: runs first in `yarn blog`, in deploy.yml and in
 *   guard-sealed.yml. Errors exit 1; warnings never fail.
 * @usage yarn lint:safety OR node scripts/meta/lint-frontmatter-safety.mjs
 *
 * Checks for:
 * - Removed visibility keys (`hidden:`, removed 2026-10-31) — an error
 * - Typos in visibility fields (unlsted, pasword, drat, etc.)
 * - Posts without explicit visibility settings (warns)
 * - Deprecated fields that might cause confusion
 * - YAML gotchas (string "true" vs boolean true)
 */

import { promises as fs } from 'node:fs'
import path from 'node:path'
import matter from 'gray-matter'
import chalk from 'chalk'
import { removedVisibilityKeyProblem } from '../../utils/visibility.mjs'

const CONTENT_DIR = path.join(process.cwd(), 'content/blog')
// Dispatch pieces are read at request time, never processed, so this is the
// only place a removed visibility key on one gets caught.
const DISPATCH_DIR = path.join(process.cwd(), 'content/dispatch')

// Known valid frontmatter fields
const VALID_FIELDS = new Set([
  'title',
  'date',
  'modified',
  'dek',
  'description',
  'tags',
  'image',
  'unlisted',
  'draft',
  'publishAt',
  'share',
  'type',
  'model',
  'replyTo',
  'in-reply-to',
  'slug',
  'aliases',
  // Project metadata (content/blog/projects/*) — verified consumed by pages/projects + components/projects
  'tech',
  'state',
  'url',
  'context',
  'featured',
  'client',
  'github',
  'ai-involvement',
])

// Common typos for visibility fields. These are errors, not warnings: a
// misspelled `draft` is silently ignored, which publishes the post.
const TYPO_PATTERNS = {
  unlsted: 'unlisted',
  unlited: 'unlisted',
  unlistd: 'unlisted',
  pasword: 'password',
  passowrd: 'password',
  passwrod: 'password',
  drat: 'draft',
  drft: 'draft',
  shar: 'share',
  sahre: 'share',
}

// Deprecated fields that might cause confusion
const DEPRECATED_FIELDS = [
  'published',
  'status',
  'inprogress',
  'hidetimestamp',
  'bgcolorclass',
  'textcolorclass',
]

const issues = {
  errors: [],
  warnings: [],
}

async function lintFile(filePath) {
  const relativePath = path.relative(CONTENT_DIR, filePath)
  const content = await fs.readFile(filePath, 'utf8')

  let frontmatter
  try {
    const parsed = matter(content)
    frontmatter = parsed.data
  } catch (e) {
    issues.errors.push({
      file: relativePath,
      message: `Invalid frontmatter: ${e.message}`,
    })
    return
  }

  const fields = Object.keys(frontmatter)

  const removed = removedVisibilityKeyProblem(frontmatter)
  if (removed) issues.errors.push({ file: relativePath, message: removed })

  // Check for typos
  for (const field of fields) {
    const lowerField = field.toLowerCase()
    if (TYPO_PATTERNS[lowerField]) {
      issues.errors.push({
        file: relativePath,
        message: `Typo detected: "${field}" should be "${TYPO_PATTERNS[lowerField]}"`,
        severity: 'error',
      })
    }
  }

  // Check for deprecated fields
  for (const field of fields) {
    if (DEPRECATED_FIELDS.includes(field.toLowerCase())) {
      issues.warnings.push({
        file: relativePath,
        message: `Deprecated field: "${field}" - remove or migrate`,
      })
    }
  }

  // Check for YAML gotchas (string vs boolean). `draft: "false"` is a
  // truthy string, so any quoted value is flagged whatever it says.
  for (const [key, value] of Object.entries(frontmatter)) {
    if (['unlisted', 'draft', 'share'].includes(key)) {
      if (typeof value === 'string') {
        issues.errors.push({
          file: relativePath,
          message: `YAML gotcha: "${key}: ${value}" is a string, not boolean. Use "${key}: true" without quotes.`,
        })
      }
    }
  }

  // Check for posts in blog/ without visibility settings (potential accident)
  const isInBlogYear = /^\d{4}\//.test(relativePath)
  if (isInBlogYear) {
    const hasVisibilitySetting =
      frontmatter.unlisted !== undefined || frontmatter.draft !== undefined

    // Only warn if it looks like it might be sensitive
    const content_lower = content.toLowerCase()
    const mightBeSensitive =
      content_lower.includes('private') ||
      content_lower.includes('draft') ||
      content_lower.includes('todo') ||
      content_lower.includes('wip') ||
      content_lower.includes('do not publish')

    if (!hasVisibilitySetting && mightBeSensitive) {
      issues.warnings.push({
        file: relativePath,
        message: `No visibility setting but contains sensitive keywords. Add "draft: true" if it isn't ready. ("unlisted: true" is NOT private: it still serves to anyone with the URL.)`,
      })
    }
  }

  // Check for unknown fields (might be typos)
  for (const field of fields) {
    if (!VALID_FIELDS.has(field) && !field.startsWith('_')) {
      // Only warn, don't error - might be intentional custom field
      issues.warnings.push({
        file: relativePath,
        message: `Unknown field: "${field}" - might be a typo`,
      })
    }
  }
}

async function findMarkdownFiles(dir) {
  const files = []

  async function scan(currentDir) {
    const entries = await fs.readdir(currentDir, { withFileTypes: true })

    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name)

      if (entry.isDirectory()) {
        if (!entry.name.startsWith('.')) {
          await scan(fullPath)
        }
      } else if (entry.name.endsWith('.md') && !entry.name.startsWith('!')) {
        files.push(fullPath)
      }
    }
  }

  await scan(dir)
  return files
}

async function main() {
  console.log(chalk.bold('\n🔒 Frontmatter Safety Linter\n'))

  try {
    await fs.access(CONTENT_DIR)
  } catch {
    console.log(
      chalk.yellow(
        'No content/blog directory found. Publish posts into it with Dispatch.'
      )
    )
    process.exit(0)
  }

  const files = await findMarkdownFiles(CONTENT_DIR)
  console.log(chalk.gray(`Scanning ${files.length} files...\n`))

  for (const file of files) {
    await lintFile(file)
  }

  const dispatch = await findMarkdownFiles(DISPATCH_DIR).catch(() => [])
  for (const file of dispatch) {
    const removed = removedVisibilityKeyProblem(
      matter(await fs.readFile(file, 'utf8')).data
    )
    if (removed)
      issues.errors.push({
        file: path.relative(process.cwd(), file),
        message: removed,
      })
  }

  // Print results
  if (issues.errors.length > 0) {
    console.log(
      chalk.red.bold(
        `\n❌ ${issues.errors.length} ERRORS (potential accidental exposure)\n`
      )
    )
    for (const issue of issues.errors) {
      console.log(chalk.red(`  ${issue.file}`))
      console.log(chalk.red(`    → ${issue.message}\n`))
    }
  }

  if (issues.warnings.length > 0) {
    console.log(chalk.yellow.bold(`\n⚠️  ${issues.warnings.length} WARNINGS\n`))
    for (const issue of issues.warnings) {
      console.log(chalk.yellow(`  ${issue.file}`))
      console.log(chalk.gray(`    → ${issue.message}\n`))
    }
  }

  if (issues.errors.length === 0 && issues.warnings.length === 0) {
    console.log(chalk.green('✅ No issues found!\n'))
  }

  // Exit with error code if there are errors
  if (issues.errors.length > 0) {
    console.log(chalk.red.bold('\n🚨 Fix errors before publishing!\n'))
    process.exit(1)
  }

  process.exit(0)
}

// A crash means nothing was checked, so it must fail the gate, not pass it.
main().catch((error) => {
  console.error(error)
  process.exit(1)
})
