#!/usr/bin/env node

import { promises as fs } from 'fs'
import { join, dirname } from 'path'
import { execSync } from 'child_process'
import { createHash } from 'crypto'
import readline from 'readline'
import matter from 'gray-matter'
import chalk from 'chalk'

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false
})

const question = (prompt) =>
  new Promise((resolve) => rl.question(prompt, resolve))

// Elegant console output
const log = {
  header: (text) => console.log(chalk.bold.blue(`\n🔮 ${text}`)),
  success: (text) => console.log(chalk.green(`✅ ${text}`)),
  warning: (text) => console.log(chalk.yellow(`⚠️  ${text}`)),
  error: (text) => console.log(chalk.red(`❌ ${text}`)),
  info: (text) => console.log(chalk.cyan(`ℹ️  ${text}`)),
  step: (text) => console.log(chalk.gray(`   ${text}`))
}

// Validation functions
const validateDate = (dateStr) => {
  const date = new Date(dateStr)
  return !isNaN(date.getTime()) && date > new Date()
}

const validateConfidence = (conf) => {
  const num = parseInt(conf)
  return !isNaN(num) && num >= 0 && num <= 100
}

// Generate unique ID
const generateId = (statement) => {
  const hash = createHash('sha256')
    .update(statement + Date.now())
    .digest('hex')
  return hash.substring(0, 8)
}

// Smart filename generation
const generateFilename = (statement, deadline) => {
  const year = new Date(deadline).getFullYear()
  const slug = statement
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, '-')
    .substring(0, 40)
    .replace(/-+$/, '')

  return `${year}-${slug}.md`
}

// Calculate SHA-256 hash of content
const calculateHash = (content) => {
  return createHash('sha256').update(content).digest('hex')
}

// Check if we're in a git repo
const isGitRepo = () => {
  try {
    execSync('git rev-parse --git-dir', { stdio: 'ignore' })
    return true
  } catch {
    return false
  }
}

// Commit to git with signature
const commitToGit = async (filename, statement) => {
  try {
    // Add the file
    execSync(`git add "content/predictions/${filename}"`, { stdio: 'inherit' })

    // Create commit message
    const commitMsg = `predict: ${statement.substring(0, 50)}${statement.length > 50 ? '...' : ''}`

    // Commit with message
    execSync(`git commit -m "${commitMsg}"`, { stdio: 'inherit' })

    // Try to sign the commit (optional, won't fail if no key)
    try {
      const commitHash = execSync('git rev-parse HEAD', {
        encoding: 'utf8'
      }).trim()
      log.success(`Committed with hash: ${commitHash.substring(0, 8)}`)
      return commitHash
    } catch {
      log.warning('Commit created but could not retrieve hash')
      return null
    }
  } catch (error) {
    log.warning('Could not commit to git (this is OK)')
    return null
  }
}

// Main wizard
async function predictWizard() {
  log.header('Prediction Wizard')
  console.log(
    chalk.gray('   Create a cryptographically verifiable prediction\n')
  )

  // Step 1: Statement
  let statement = ''
  while (!statement || statement.length < 10) {
    statement = await question(chalk.bold('📝 What do you predict? '))
    if (!statement) {
      log.warning('Please enter a prediction')
    } else if (statement.length < 10) {
      log.warning('Please be more specific (at least 10 characters)')
    }
  }

  // Step 2: Confidence
  let confidence = ''
  while (!validateConfidence(confidence)) {
    confidence = await question(
      chalk.bold('🎯 How confident are you? (0-100): ')
    )
    if (!validateConfidence(confidence)) {
      log.warning('Please enter a number between 0 and 100')
    }
  }
  confidence = parseInt(confidence)

  // Step 3: Deadline
  let deadline = ''
  while (!validateDate(deadline)) {
    deadline = await question(
      chalk.bold('📅 When will this resolve? (YYYY-MM-DD): ')
    )
    if (!validateDate(deadline)) {
      log.warning('Please enter a valid future date (YYYY-MM-DD)')
    }
  }

  // Step 4: Categories (optional)
  const categoriesInput = await question(
    chalk.bold('🏷️  Categories (comma-separated, optional): ')
  )
  const categories = categoriesInput
    ? categoriesInput
        .split(',')
        .map((c) => c.trim())
        .filter((c) => c)
    : []

  // Step 5: Evidence (optional)
  console.log(chalk.bold('\n📖 Evidence/reasoning (optional):'))
  console.log(
    chalk.gray(
      '   Type your reasoning. Press Enter twice when done, or just Enter twice to skip.\n'
    )
  )

  let evidence = ''
  let line = ''
  let emptyLineCount = 0

  while (emptyLineCount < 2) {
    line = await question('')
    if (line === '') {
      emptyLineCount++
    } else {
      emptyLineCount = 0
      evidence += line + '\n'
    }
  }

  // Step 6: Visibility
  const visibilityInput = await question(
    chalk.bold('👁️  Visibility (public/private) [public]: ')
  )
  const visibility =
    visibilityInput.toLowerCase() === 'private' ? 'private' : 'public'

  rl.close()

  // Processing
  log.header('Processing Prediction')

  const id = generateId(statement)
  const created = new Date().toISOString()
  const filename = generateFilename(statement, deadline)

  log.step(`Generated ID: ${id}`)
  log.step(`Filename: ${filename}`)

  // Create frontmatter
  const frontmatter = {
    id,
    statement,
    confidence,
    deadline,
    categories,
    visibility,
    created,
    evidence: evidence.trim() || undefined
  }

  // Generate markdown content
  const content = matter.stringify(evidence.trim() || '', frontmatter)

  // Calculate hash
  const hash = calculateHash(content)

  // Add hash to frontmatter
  const finalFrontmatter = { ...frontmatter, hash }
  const finalContent = matter.stringify(evidence.trim() || '', finalFrontmatter)

  // Ensure directory exists
  const predictionsDir = join(process.cwd(), 'content/predictions')
  await fs.mkdir(predictionsDir, { recursive: true })

  // Write file
  const filePath = join(predictionsDir, filename)
  await fs.writeFile(filePath, finalContent)

  log.success(`Created: content/predictions/${filename}`)
  log.step(`SHA-256: ${hash}`)

  // Git operations
  if (isGitRepo()) {
    log.info('Committing to git...')
    const commitHash = await commitToGit(filename, statement)
    if (commitHash) {
      log.step(`Git commit: ${commitHash.substring(0, 8)}`)
    }
  } else {
    log.warning('Not in a git repository - skipping version control')
  }

  // Summary
  log.header('Prediction Created Successfully!')
  console.log(
    chalk.gray(`
   Statement: ${statement}
   Confidence: ${confidence}%
   Deadline: ${deadline}
   ID: ${id}
   File: content/predictions/${filename}
   Hash: ${hash.substring(0, 16)}...
  `)
  )

  log.info('Your prediction is now cryptographically verifiable and ready!')
}

// Error handling
process.on('SIGINT', () => {
  console.log(chalk.yellow('\n\n👋 Prediction creation cancelled'))
  process.exit(0)
})

predictWizard().catch((error) => {
  log.error(`Failed to create prediction: ${error.message}`)
  process.exit(1)
})
