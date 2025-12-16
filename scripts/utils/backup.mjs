/**
 * @file utils/backup.mjs
 * @description Backup utility for processed content - creates safety copies before regenerating
 * @usage import { backupProcessedContent } from './scripts/utils/backup.mjs'
 */

/* eslint-disable no-console */
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
