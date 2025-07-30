import { promises as fs } from 'fs'
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
  } catch (_error) {
    console.error(chalk.yellow('No existing content to backup'))
  }
}
