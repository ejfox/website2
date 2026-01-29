#!/usr/bin/env node
/**
 * @file lint-frontmatter-safety.mjs
 * @description Safety linter to catch accidental exposure risks in blog frontmatter
 * @usage yarn lint:safety OR node scripts/lint-frontmatter-safety.mjs
 *
 * Checks for:
 * - Typos in visibility fields (unlsted, pasword, drat, etc.)
 * - Posts without explicit visibility settings (warns)
 * - Deprecated fields that might cause confusion
 * - YAML gotchas (string "true" vs boolean true)
 */

import { promises as fs } from 'node:fs'
import path from 'node:path'
import matter from 'gray-matter'
import chalk from 'chalk'

const CONTENT_DIR = path.join(process.cwd(), 'content/blog')

// Known valid frontmatter fields
const VALID_FIELDS = new Set([
  'title', 'date', 'modified', 'dek', 'description', 'tags', 'image',
  'unlisted', 'password', 'draft', 'hidden', 'share', 'type', 'model',
  'replyTo', 'in-reply-to', 'slug', 'aliases'
])

// Common typos for visibility fields
const TYPO_PATTERNS = {
  'unlsted': 'unlisted',
  'unlited': 'unlisted',
  'unlistd': 'unlisted',
  'pasword': 'password',
  'passowrd': 'password',
  'passwrod': 'password',
  'drat': 'draft',
  'drft': 'draft',
  'hiden': 'hidden',
  'hiddn': 'hidden',
  'shar': 'share',
  'sahre': 'share',
}

// Deprecated fields that might cause confusion
const DEPRECATED_FIELDS = [
  'published', 'status', 'inprogress', 'hidetimestamp',
  'bgcolorclass', 'textcolorclass'
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
      message: `Invalid frontmatter: ${e.message}`
    })
    return
  }

  const fields = Object.keys(frontmatter)

  // Check for typos
  for (const field of fields) {
    const lowerField = field.toLowerCase()
    if (TYPO_PATTERNS[lowerField]) {
      issues.errors.push({
        file: relativePath,
        message: `Typo detected: "${field}" should be "${TYPO_PATTERNS[lowerField]}"`,
        severity: 'error'
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

  // Check for YAML gotchas (string vs boolean)
  for (const [key, value] of Object.entries(frontmatter)) {
    if (['unlisted', 'draft', 'hidden', 'share'].includes(key)) {
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
      frontmatter.unlisted !== undefined ||
      frontmatter.password !== undefined ||
      frontmatter.draft !== undefined ||
      frontmatter.hidden !== undefined

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
        message: `No visibility setting but contains sensitive keywords. Add "unlisted: true" or "draft: true" if private.`,
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
    console.log(chalk.yellow('No content/blog directory found. Run after import.'))
    process.exit(0)
  }

  const files = await findMarkdownFiles(CONTENT_DIR)
  console.log(chalk.gray(`Scanning ${files.length} files...\n`))

  for (const file of files) {
    await lintFile(file)
  }

  // Print results
  if (issues.errors.length > 0) {
    console.log(chalk.red.bold(`\n❌ ${issues.errors.length} ERRORS (potential accidental exposure)\n`))
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

main().catch(console.error)
