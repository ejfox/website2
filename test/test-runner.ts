#!/usr/bin/env node

/**
 * Modular Test Runner
 * 
 * This script runs specific test suites for different parts of the application:
 * - Post processing and content management
 * - API endpoints and data fetching  
 * - Component functionality
 * - Utility functions
 */

import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

const testSuites = {
  composables: 'test/composables/**/*.test.ts',
  utils: 'test/utils/**/*.test.ts', 
  api: 'test/api/**/*.test.ts',
  components: 'test/components/**/*.test.ts',
  all: 'test/**/*.test.ts'
}

async function runTests(suite: keyof typeof testSuites = 'all', watch = false) {
  const pattern = testSuites[suite]
  const watchFlag = watch ? '--watch' : ''
  
  console.log(`\n🧪 Running ${suite} tests...`)
  console.log(`Pattern: ${pattern}`)
  
  try {
    const { stdout, stderr } = await execAsync(`npx vitest ${watchFlag} ${pattern}`)
    
    if (stdout) console.log(stdout)
    if (stderr) console.error(stderr)
    
  } catch (error: any) {
    console.error('Test execution failed:', error.message)
    process.exit(1)
  }
}

// CLI interface
const args = process.argv.slice(2)
const suite = args[0] as keyof typeof testSuites || 'all'
const watch = args.includes('--watch') || args.includes('-w')

if (!testSuites[suite]) {
  console.error(`❌ Unknown test suite: ${suite}`)
  console.log('Available suites:', Object.keys(testSuites).join(', '))
  process.exit(1)
}

runTests(suite, watch)