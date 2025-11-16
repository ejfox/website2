import chalk from 'chalk'
import path from 'node:path'
import { /* getPostType, */ formatFileSize } from './helpers.mjs'

export const processStats = {
  filesProcessed: 0,
  totalFiles: 0,
  totalWordCount: 0,
  totalImageCount: 0,
  totalLinkCount: 0,
  averageWordCount: 0,
  currentFile: null,
  byType: {
    post: 0,
    weekNote: 0,
    reading: 0,
    project: 0,
    robot: 0,
    draft: 0,
    prompt: 0,
    studyNote: 0
  },
  errors: [],
  warnings: [],
  startTime: Date.now(),
  lastProcessed: [],
  contentAnalysis: {
    h1: 0,
    h2: 0,
    h3: 0,
    codeBlocks: { js: 0, py: 0, other: 0 },
    tables: 0,
    footnotes: 0
  },
  fileSizes: {
    total: 0,
    average: 0,
    largest: { size: 0, file: '' }
  },
  resourceUsage: {
    initialMemory: process.memoryUsage().heapUsed,
    peakMemory: 0
  },
  queue: {
    active: new Set(),
    completed: new Set(),
    failed: new Set()
  },
  keywords: new Map(),
  readingTimes: [],
  linkAnalysis: {
    internal: 0,
    external: 0
  }
}

export function updateRealTimeStats(result) {
  if (!result || !result.metadata) return

  processStats.currentFile = result.metadata.filePath || 'unknown'

  // Update word count
  if (result.metadata.wordCount) {
    processStats.totalWordCount += result.metadata.wordCount
  }

  // Update image count
  if (result.metadata.imageCount) {
    processStats.totalImageCount += result.metadata.imageCount
  }

  // Update link count
  if (result.metadata.linkCount) {
    processStats.totalLinkCount += result.metadata.linkCount
  }

  // Update document analysis stats
  if (result.metadata.analysis) {
    const analysis = result.metadata.analysis
    processStats.contentAnalysis.h1 += analysis.h1Count || 0
    processStats.contentAnalysis.h2 += analysis.h2Count || 0
    processStats.contentAnalysis.h3 += analysis.h3Count || 0
    processStats.contentAnalysis.tables += analysis.tableCount || 0
    processStats.contentAnalysis.footnotes += analysis.footnoteCount || 0

    // Update code block counts
    processStats.contentAnalysis.codeBlocks.js += analysis.codeBlocksJS || 0
    processStats.contentAnalysis.codeBlocks.py += analysis.codeBlocksPython || 0
    processStats.contentAnalysis.codeBlocks.other +=
      analysis.codeBlocksOther || 0
  }

  // Update type stats
  const type = result.metadata.type || 'unknown'
  processStats.byType[type] = (processStats.byType[type] || 0) + 1

  // Print real-time stats
  printRealTimeStats()
}

export function printRealTimeStats() {
  const filePath = processStats.currentFile || 'unknown'
  const percent = (
    (processStats.filesProcessed / processStats.totalFiles) *
    100
  ).toFixed(1)
  const memoryUsage = process.memoryUsage()

  // Move cursor up 3 lines and clear each line
  process.stdout.write('\x1B[3A')
  process.stdout.write('\x1B[2K') // Clear first line
  process.stdout.write('\x1B[1B') // Move down
  process.stdout.write('\x1B[2K') // Clear second line
  process.stdout.write('\x1B[1B') // Move down
  process.stdout.write('\x1B[2K') // Clear third line
  process.stdout.write('\x1B[2A') // Move back up

  console.log(
    chalk.blue(`Processing: ${filePath}`) +
      '\n' +
      chalk.green(
        `Progress: ${processStats.filesProcessed}/${processStats.totalFiles} (${percent}%)`
      ) +
      '\n' +
      chalk.yellow(`Memory: ${formatFileSize(memoryUsage.heapUsed)}`)
  )
}

export function printProcessingReport() {
  const lines = [
    '',
    '',
    'Processing Complete',
    '------------------',
    `Files Processed: ${processStats.filesProcessed}`,
    `Total Words: ${processStats.totalWordCount.toLocaleString()}`,
    `Total Images: ${processStats.totalImageCount}`,
    `Total Links: ${processStats.totalLinkCount}`,
    '',
    'Document Analysis',
    '-----------------',
    `Headers: H1: ${processStats.contentAnalysis.h1}, H2: ${processStats.contentAnalysis.h2}, H3: ${processStats.contentAnalysis.h3}`,
    `Code Blocks: JS: ${processStats.contentAnalysis.codeBlocks.js}, Python: ${processStats.contentAnalysis.codeBlocks.py}, Other: ${processStats.contentAnalysis.codeBlocks.other}`,
    `Tables: ${processStats.contentAnalysis.tables}, Footnotes: ${processStats.contentAnalysis.footnotes}`,
    '',
    'Content Types',
    '------------'
  ]

  Object.entries(processStats.byType)
    .filter(([_, count]) => count > 0)
    .forEach(([type, count]) => {
      lines.push(`${type}: ${count} files`)
    })

  if (processStats.errors.length > 0) {
    lines.push(
      '',
      'Errors',
      '------',
      ...processStats.errors
        .slice(0, 5)
        .map(({ file, error }) => `${path.basename(file)}: ${error}`)
    )
    if (processStats.errors.length > 5) {
      lines.push(`... and ${processStats.errors.length - 5} more errors`)
    }
  }

  console.log(lines.join('\n'))
}
