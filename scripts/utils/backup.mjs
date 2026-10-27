/**
 * @file utils/backup.mjs
 * @description Copy content/processed/ → content/backup/ at the start of every
 *   `yarn blog:process` (called first by processAllFiles in
 *   scripts/build/processMarkdown.mjs). One generation only: the previous
 *   backup is deleted before the copy. content/backup/ is never shipped
 *   (see CLAUDE.md "Build Output Privacy").
 * @usage import { backupProcessedContent } from './scripts/utils/backup.mjs'
 */

import { promises as fs } from 'node:fs'
import chalk from 'chalk'

export async function backupProcessedContent(outputDir, backupDir) {
  try {
    if (
      await fs
        .access(outputDir)
        .then(() => true)
        .catch(() => false)
    ) {
      await fs.rm(backupDir, { recursive: true, force: true })
      await fs.cp(outputDir, backupDir, { recursive: true })
      console.log(chalk.blue('✓ Backed up current processed content'))
    }
  } catch {
    console.error(chalk.yellow('No existing content to backup'))
  }
}
