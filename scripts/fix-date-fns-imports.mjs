#!/usr/bin/env node

import { readFile, writeFile } from 'node:fs/promises'
import { glob } from 'glob'
import chalk from 'chalk'

// Find all Vue and TS files that import from date-fns
const files = await glob('./!(node_modules|.nuxt|.output)/**/*.{vue,ts}')

console.log(
  chalk.blue.bold('🔧 Fixing date-fns imports for better tree-shaking...')
)
console.log(chalk.dim(`Found ${files.length} files to check\n`))

let fixedFiles = 0

for (const file of files) {
  try {
    const content = await readFile(file, 'utf-8')

    // Skip if no date-fns imports
    if (!content.includes("from 'date-fns'")) continue

    console.log(chalk.yellow(`🔍 Fixing: ${file}`))

    // Replace date-fns imports with centralized utils
    let updatedContent = content

    // Pattern 1: Simple imports like { format } from 'date-fns'
    updatedContent = updatedContent.replace(
      /import\s*\{([^}]+)\}\s*from\s*['"]date-fns['"]/g,
      (match, imports) => {
        const cleanImports = imports.trim()
        console.log(chalk.dim(`  Replacing: ${cleanImports}`))
        return `import { ${cleanImports} } from '~/utils/dateUtils'`
      }
    )

    // Pattern 2: Import with aliases like { format as formatDate } from 'date-fns'
    updatedContent = updatedContent.replace(
      /import\s*\{([^}]*as[^}]*)\}\s*from\s*['"]date-fns['"]/g,
      (match, imports) => {
        const cleanImports = imports.trim()
        console.log(chalk.dim(`  Replacing aliased: ${cleanImports}`))
        return `import { ${cleanImports} } from '~/utils/dateUtils'`
      }
    )

    // Skip if no changes were made
    if (updatedContent === content) continue

    await writeFile(file, updatedContent, 'utf-8')
    fixedFiles++
    console.log(chalk.green(`✅ Fixed: ${file}`))
  } catch (error) {
    console.error(chalk.red(`❌ Error fixing ${file}:`), error.message)
  }
}

console.log(chalk.blue.bold(`\n🎉 Fixed ${fixedFiles} files!`))
console.log(
  chalk.dim(
    'All date-fns imports now use centralized utils for better tree-shaking'
  )
)
console.log(
  chalk.yellow('🔄 Restart dev server to see bundle size improvements')
)
