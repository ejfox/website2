#!/usr/bin/env node
/**
 * @file scripts/check-internal-links.mjs
 * @description Standalone dead-internal-link audit. Scans every blog markdown
 *   file for wikilinks / relative md links and checks each against the set of
 *   real published routes — no network, no full content rebuild. Writes
 *   data/internal-linkrot-report.json and prints a summary.
 *
 *   Usage:
 *     node scripts/check-internal-links.mjs           # report only
 *     node scripts/check-internal-links.mjs --strict  # exit 1 if any dead links
 */

import { promises as fs } from 'node:fs'
import path from 'node:path'
import chalk from 'chalk'
import { config } from './config.mjs'
import {
  buildValidRoutes,
  auditInternalLinks,
} from './utils/internal-links.mjs'

const STRICT = process.argv.includes('--strict')
const contentDir = config.dirs.content

async function getMarkdownFiles(dir) {
  const out = []
  let entries
  try {
    entries = await fs.readdir(dir, { withFileTypes: true })
  } catch {
    return out
  }
  for (const entry of entries) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      out.push(...(await getMarkdownFiles(full)))
    } else if (entry.name.endsWith('.md')) {
      out.push(full)
    }
  }
  return out
}

async function main() {
  const files = await getMarkdownFiles(contentDir)
  await buildValidRoutes(files, contentDir)
  const report = await auditInternalLinks(files, contentDir)

  const reportPath = path.join(
    process.cwd(),
    'data/internal-linkrot-report.json'
  )
  await fs.mkdir(path.dirname(reportPath), { recursive: true })
  await fs.writeFile(reportPath, JSON.stringify(report, null, 2))

  const { dead, affectedPosts, internalLinks, filesScanned, withSuggestion } =
    report.summary
  console.log(
    chalk.bold('\n🔗 Internal Link Audit') +
      chalk.gray(`  (${filesScanned} files, ${internalLinks} internal links)`)
  )

  if (dead === 0) {
    console.log(chalk.green(`  ✓ No dead internal links\n`))
    return
  }

  console.log(
    chalk.red.bold(
      `\n  ${dead} dead internal link${dead === 1 ? '' : 's'} across ${affectedPosts} post${affectedPosts === 1 ? '' : 's'}` +
        chalk.gray(` · ${withSuggestion} with a suggested fix\n`)
    )
  )
  let lastSource = null
  for (const d of report.dead) {
    if (d.source !== lastSource) {
      console.log(`\n  ${chalk.cyan(d.source)}`)
      lastSource = d.source
    }
    const loc = chalk.gray(`:${d.line}`)
    const fix = d.suggestion
      ? `  ${chalk.gray('did you mean')} ${chalk.green(d.suggestion)}${chalk.gray('?')}`
      : ''
    console.log(
      `    ${chalk.red('✗')}${loc} ${chalk.yellow(d.target)} ${chalk.gray('→')} ${d.href}${fix}`
    )
  }
  console.log(
    chalk.gray(`\n  Full report: data/internal-linkrot-report.json\n`)
  )

  if (STRICT) process.exit(1)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
