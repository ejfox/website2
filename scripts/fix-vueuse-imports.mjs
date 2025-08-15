#!/usr/bin/env node

import { readFile, writeFile } from 'fs/promises'
import { glob } from 'glob'
import chalk from 'chalk'

// Find all Vue and TS files that import from @vueuse/core
const files = await glob('./!(node_modules|.nuxt|.output)/**/*.{vue,ts}')

console.log(chalk.blue.bold('🔧 Fixing @vueuse/core imports for better tree-shaking...'))
console.log(chalk.dim(`Found ${files.length} files to check\n`))

let fixedFiles = 0

for (const file of files) {
  try {
    const content = await readFile(file, 'utf-8')
    
    // Skip if no @vueuse/core imports
    if (!content.includes("from '@vueuse/core'")) continue
    
    console.log(chalk.yellow(`🔍 Fixing: ${file}`))
    
    // Replace @vueuse/core imports with centralized composable
    let updatedContent = content
    
    // Pattern 1: Simple imports like { useWindowSize } from '@vueuse/core'
    updatedContent = updatedContent.replace(
      /import\s*{([^}]+)}\s*from\s*['"]@vueuse\/core['"]/g,
      (match, imports) => {
        const cleanImports = imports.trim()
        console.log(chalk.dim(`  Replacing: ${cleanImports}`))
        return `import { ${cleanImports} } from '~/composables/useOptimizedVueUse'`
      }
    )
    
    // Pattern 2: Type imports like import type { MaybeElementRef } from '@vueuse/core'
    updatedContent = updatedContent.replace(
      /import\s+type\s*{([^}]+)}\s*from\s*['"]@vueuse\/core['"]/g,
      (match, imports) => {
        const cleanImports = imports.trim()
        console.log(chalk.dim(`  Replacing type import: ${cleanImports}`))
        return `import type { ${cleanImports} } from '~/composables/useOptimizedVueUse'`
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
console.log(chalk.dim('All @vueuse/core imports now use centralized composable for better tree-shaking'))
console.log(chalk.yellow('🔄 Restart dev server to see bundle size improvements'))