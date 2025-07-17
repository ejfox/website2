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
  output: process.stdout
})

const question = (prompt) =>
  new Promise((resolve) => rl.question(prompt, resolve))

// Helper function for score colors
function getScoreColor(score) {
  switch (score) {
    case 'excellent':
      return chalk.green('●')
    case 'good':
      return chalk.blue('●')
    case 'needs_improvement':
      return chalk.yellow('●')
    case 'poor':
      return chalk.red('●')
    default:
      return chalk.gray('●')
  }
}

// Enhanced console output with better formatting
const log = {
  header: (text) => console.log(chalk.bold.blue(`\n🔮 ${text}`)),
  section: (text) => console.log(chalk.bold.cyan(`\n📋 ${text}`)),
  success: (text) => console.log(chalk.green(`✅ ${text}`)),
  warning: (text) => console.log(chalk.yellow(`⚠️  ${text}`)),
  error: (text) => console.log(chalk.red(`❌ ${text}`)),
  info: (text) => console.log(chalk.cyan(`ℹ️  ${text}`)),
  tip: (text) => console.log(chalk.magenta(`💡 ${text}`)),
  step: (text) => console.log(chalk.gray(`   ${text}`)),
  example: (text) => console.log(chalk.italic.gray(`   Example: ${text}`)),
  divider: () => console.log(chalk.gray('   ─'.repeat(60)))
}

// Prediction quality guidelines
const QUALITY_GUIDELINES = {
  statement: {
    title: 'Writing Clear Prediction Statements',
    rules: [
      'Be specific and measurable - avoid vague terms',
      'Include clear timeframes and thresholds',
      'Use objective, verifiable criteria',
      'Avoid compound predictions (break into separate predictions)',
      'State what will happen, not what might happen'
    ],
    examples: {
      good: [
        'Bitcoin will exceed $150,000 USD by December 31, 2025',
        'At least 3 Fortune 500 companies will adopt 4-day work weeks by 2026',
        'Global temperature anomaly will exceed +1.5°C above pre-industrial levels by 2030'
      ],
      bad: [
        'Bitcoin will go up a lot', // Not specific
        'Companies might adopt better work practices', // Vague and uncertain
        'Climate change will get worse' // Not measurable
      ]
    }
  },
  resolution: {
    title: 'Defining Resolution Criteria',
    rules: [
      "Specify exact data sources you'll use to resolve",
      'Define edge cases and how to handle them',
      'Choose objective, third-party sources when possible',
      "Be clear about what counts as 'success'",
      'Consider time zones and measurement periods'
    ],
    examples: {
      good: [
        "Resolved using CoinGecko's closing price on December 31, 2025 at 11:59 PM UTC",
        'Counts if announced publicly and implemented for at least 1000 employees',
        "Using NASA's global temperature data, averaged over the calendar year"
      ],
      bad: [
        'If it seems like Bitcoin did well', // Subjective
        'If companies are doing better', // Vague
        'If it gets hot' // Not specific
      ]
    }
  }
}

// Enhanced validation functions
const validateDate = (dateStr) => {
  const date = new Date(dateStr)
  const now = new Date()
  const oneWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

  if (isNaN(date.getTime()))
    return { valid: false, reason: 'Invalid date format' }
  if (date <= oneWeek)
    return {
      valid: false,
      reason: 'Deadline must be at least one week in the future'
    }
  if (date.getFullYear() > 2050)
    return { valid: false, reason: 'Deadline too far in the future (max 2050)' }

  return { valid: true }
}

const validateConfidence = (conf) => {
  const num = parseInt(conf)
  if (isNaN(num)) return { valid: false, reason: 'Must be a number' }
  if (num < 5 || num > 95)
    return {
      valid: false,
      reason: 'Confidence should be between 5-95% (avoid overconfidence)'
    }
  return { valid: true }
}

const validateStatement = (statement) => {
  if (!statement || statement.length < 20) {
    return {
      valid: false,
      reason: 'Statement too short - be more specific (min 20 chars)'
    }
  }
  if (statement.length > 300) {
    return {
      valid: false,
      reason:
        'Statement too long - break into multiple predictions (max 300 chars)'
    }
  }

  // Check for common issues
  const issues = []
  if (!/\d/.test(statement))
    issues.push('Consider adding specific numbers or dates')
  if (/maybe|might|could|possibly/i.test(statement))
    issues.push('Avoid uncertainty words - state what will happen')
  if (/and|or/i.test(statement) && statement.split(/and|or/i).length > 2) {
    issues.push('Consider breaking compound predictions into separate ones')
  }

  return { valid: true, suggestions: issues }
}

// LLM quality checking via OpenRouter
async function checkPredictionQuality(statement, resolutionCriteria) {
  const openRouterKey = process.env.OPENROUTER_API_KEY

  if (!openRouterKey) {
    log.info(
      'Using built-in quality analysis (AI analysis available with OPENROUTER_API_KEY)'
    )
    return getBuiltInAnalysis(statement, resolutionCriteria)
  }

  try {
    log.step('Analyzing prediction quality with AI...')

    const prompt = `You are an expert prediction scientist. Analyze this prediction for quality and provide specific suggestions for improvement.

PREDICTION STATEMENT: "${statement}"

RESOLUTION CRITERIA: "${resolutionCriteria}"

Evaluate on these dimensions:
1. Clarity - Is the prediction statement clear and unambiguous?
2. Specificity - Does it include specific numbers, dates, thresholds?
3. Measurability - Can the outcome be objectively determined?
4. Resolvability - Are the resolution criteria detailed and objective?

Provide your analysis as a JSON object with this exact structure:
{
  "clarity": "excellent|good|needs_improvement|poor",
  "specificity": "excellent|good|needs_improvement|poor", 
  "measurability": "excellent|good|needs_improvement|poor",
  "resolvability": "excellent|good|needs_improvement|poor",
  "overallScore": 1-10,
  "suggestions": ["specific actionable suggestion 1", "suggestion 2"],
  "strengths": ["what's good about this prediction"],
  "concerns": ["potential issues or ambiguities"]
}

Be constructive and specific in your suggestions. Focus on making the prediction more precise and objectively resolvable.`

    const response = await fetch(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${openRouterKey}`,
          'HTTP-Referer': 'https://github.com/ejfox/website2',
          'X-Title': 'Prediction Quality Checker'
        },
        body: JSON.stringify({
          model: 'mistralai/mistral-7b-instruct:free',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.3,
          max_tokens: 1000
        })
      }
    )

    if (!response.ok) {
      throw new Error(`OpenRouter API error: ${response.status}`)
    }

    const data = await response.json()
    const content = data.choices[0]?.message?.content

    if (!content) {
      throw new Error('No content in OpenRouter response')
    }

    // Parse JSON response
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('Could not parse JSON from LLM response')
    }

    const analysis = JSON.parse(jsonMatch[0])
    log.step('✨ AI analysis complete')
    return analysis
  } catch (error) {
    log.warning('AI analysis unavailable - using built-in quality checker')
    log.step('This is completely normal and the wizard works great without AI!')
    return getBuiltInAnalysis(statement, resolutionCriteria)
  }
}

// Fallback built-in analysis
function getBuiltInAnalysis(statement, resolutionCriteria) {
  const analysis = {
    clarity: statement.length > 50 ? 'good' : 'needs_improvement',
    specificity: /\d/.test(statement) ? 'good' : 'needs_improvement',
    measurability:
      resolutionCriteria.length > 20 ? 'good' : 'needs_improvement',
    resolvability:
      resolutionCriteria.length > 50 ? 'good' : 'needs_improvement',
    overallScore: 7,
    suggestions: [],
    strengths: [],
    concerns: []
  }

  if (analysis.clarity === 'needs_improvement') {
    analysis.suggestions.push('Add more detail to make the prediction clearer')
  }
  if (analysis.specificity === 'needs_improvement') {
    analysis.suggestions.push('Include specific numbers, dates, or thresholds')
  }
  if (analysis.measurability === 'needs_improvement') {
    analysis.suggestions.push('Define clearer resolution criteria')
  }

  if (/\d{4}/.test(statement)) analysis.strengths.push('Includes specific year')
  if (/\$|%/.test(statement))
    analysis.strengths.push('Includes specific numerical targets')

  return analysis
}

// Show guidelines
function showGuidelines(section) {
  const guide = QUALITY_GUIDELINES[section]
  log.section(guide.title)

  console.log(chalk.bold('\n   📌 Key Rules:'))
  guide.rules.forEach((rule) => console.log(chalk.gray(`   • ${rule}`)))

  console.log(chalk.bold('\n   ✅ Good Examples:'))
  guide.examples.good.forEach((ex) => log.example(chalk.green(ex)))

  console.log(chalk.bold('\n   ❌ Avoid:'))
  guide.examples.bad.forEach((ex) => log.example(chalk.red(ex)))

  log.divider()
}

// Generate smart suggestions based on input
function generateSuggestions(statement) {
  const suggestions = []

  // Suggest timeframes
  if (!/\d{4}/.test(statement)) {
    suggestions.push("Consider adding a specific year (e.g., 'by 2025')")
  }

  // Suggest measurement units
  if (/price|cost|value/i.test(statement) && !/\$|€|£/.test(statement)) {
    suggestions.push('Specify currency (USD, EUR, etc.)')
  }

  // Suggest data sources
  if (/temperature|climate/i.test(statement)) {
    suggestions.push('Consider specifying data source (NASA, NOAA, etc.)')
  }

  return suggestions
}

// Interactive refinement
async function refineStatement(statement) {
  const validation = validateStatement(statement)

  if (!validation.valid) {
    log.warning(validation.reason)
    return null
  }

  if (validation.suggestions?.length > 0) {
    log.info('Suggestions to improve your prediction:')
    validation.suggestions.forEach((s) => log.tip(s))
  }

  const suggestions = generateSuggestions(statement)
  if (suggestions.length > 0) {
    log.info('Additional suggestions:')
    suggestions.forEach((s) => log.tip(s))
  }

  const improve = await question(
    chalk.bold('\n🔄 Would you like to revise your statement? (y/N): ')
  )
  if (improve.toLowerCase() === 'y' || improve.toLowerCase() === 'yes') {
    return null // Signal to re-enter
  }

  return statement
}

// Help function
function showHelp() {
  console.log(chalk.bold.blue('\n🔮 Prediction Wizard Help\n'))

  console.log(chalk.bold('Usage:'))
  console.log(
    '  yarn predict                                    Interactive wizard'
  )
  console.log(
    '  yarn predict --help                             Show this help'
  )
  console.log('  yarn predict --statement "..." --confidence 75  CLI mode')

  console.log(chalk.bold('\nInteractive Mode:'))
  console.log('  • Step-by-step guided wizard')
  console.log('  • Built-in examples and best practices')
  console.log('  • Quality analysis and suggestions')
  console.log('  • Interactive refinement')

  console.log(chalk.bold('\nCLI Mode (required):'))
  console.log('  --statement, -s    "Prediction statement"')
  console.log('  --confidence, -c   Confidence (5-95)')
  console.log('  --resolution, -r   "Resolution criteria"')

  console.log(chalk.bold('\nOptional CLI flags:'))
  console.log('  --deadline, -d     Deadline (YYYY-MM-DD)')
  console.log('  --categories       "category1,category2"')
  console.log('  --evidence, -e     "Supporting evidence"')
  console.log('  --visibility, -v   "public" or "private"')

  console.log(chalk.bold('\nCLI Examples:'))
  console.log(chalk.gray('  yarn predict \\'))
  console.log(
    chalk.gray(
      '    --statement "Bitcoin will exceed $150,000 by Dec 31, 2025" \\'
    )
  )
  console.log(chalk.gray('    --confidence 75 \\'))
  console.log(chalk.gray('    --deadline 2025-12-31 \\'))
  console.log(
    chalk.gray(
      '    --resolution "Using CoinGecko closing price at 11:59 PM UTC" \\'
    )
  )
  console.log(chalk.gray('    --categories "crypto,finance"'))

  console.log(chalk.bold('\nFeatures:'))
  console.log('  • Cryptographic verification (SHA-256, Git commits)')
  console.log('  • Quality analysis (built-in + optional AI)')
  console.log('  • Automatic file organization')
  console.log('  • Works with or without OpenRouter API')

  console.log(chalk.bold('\nFor AI analysis, add to your .env file:'))
  console.log('  OPENROUTER_API_KEY=your_key_here')

  console.log(chalk.bold('\nDocumentation:'))
  console.log('  docs/PREDICTIONS.md')

  console.log(
    chalk.yellow(
      '\n💡 Choose your mode: Interactive wizard or CLI automation!\n'
    )
  )
}

// Parse command line arguments
function parseArgs() {
  const args = {}
  const argv = process.argv.slice(2)

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    const nextArg = argv[i + 1]

    switch (arg) {
      case '--help':
      case '-h':
        args.help = true
        break
      case '--statement':
      case '-s':
        args.statement = nextArg
        i++
        break
      case '--confidence':
      case '-c':
        args.confidence = parseInt(nextArg)
        i++
        break
      case '--deadline':
      case '-d':
        args.deadline = nextArg
        i++
        break
      case '--resolution':
      case '-r':
        args.resolution = nextArg
        i++
        break
      case '--categories':
        args.categories = nextArg ? nextArg.split(',').map((c) => c.trim()) : []
        i++
        break
      case '--evidence':
      case '-e':
        args.evidence = nextArg
        i++
        break
      case '--visibility':
      case '-v':
        args.visibility = nextArg
        i++
        break
      case '--non-interactive':
      case '--cli':
        args.nonInteractive = true
        break
    }
  }

  return args
}

const cliArgs = parseArgs()

// Check for help flag
if (cliArgs.help) {
  showHelp()
  process.exit(0)
}

// Check if we have enough args for non-interactive mode
function hasRequiredCliArgs(args) {
  return args.statement && args.confidence && args.resolution
}

// Non-interactive mode
async function createPredictionFromArgs(args) {
  log.header('Creating Prediction from CLI Arguments')

  // Validate required fields
  const validation = {
    statement: validateStatement(args.statement),
    confidence: validateConfidence(args.confidence.toString()),
    deadline: args.deadline ? validateDate(args.deadline) : { valid: true }
  }

  // Check for validation errors
  const errors = []
  if (!validation.statement.valid)
    errors.push(`Statement: ${validation.statement.reason}`)
  if (!validation.confidence.valid)
    errors.push(`Confidence: ${validation.confidence.reason}`)
  if (args.deadline && !validation.deadline.valid)
    errors.push(`Deadline: ${validation.deadline.reason}`)

  if (errors.length > 0) {
    log.error('Validation failed:')
    errors.forEach((error) => log.step(error))
    process.exit(1)
  }

  // Run quality analysis
  log.section('Quality Analysis')
  const analysis = await checkPredictionQuality(args.statement, args.resolution)

  if (analysis.overallScore) {
    log.info(`Overall Quality Score: ${analysis.overallScore}/10`)
    if (analysis.suggestions?.length > 0) {
      console.log(chalk.bold('\n   💡 Suggestions:'))
      analysis.suggestions.forEach((s) => log.tip(s))
    }
  }

  // Create prediction
  const id = createHash('sha256')
    .update(args.statement + Date.now())
    .digest('hex')
    .substring(0, 8)
  const created = new Date().toISOString()
  const filename = generateFilename(args.statement, args.deadline)

  const frontmatter = {
    id,
    statement: args.statement,
    resolutionCriteria: args.resolution,
    confidence: args.confidence,
    ...(args.deadline && { deadline: args.deadline }),
    categories: args.categories || [],
    visibility: args.visibility || 'public',
    created,
    ...(args.evidence && { evidence: args.evidence }),
    qualityScore: analysis.suggestions?.length === 0 ? 'high' : 'medium'
  }

  const fullContent = `# Resolution Criteria

${args.resolution}

${args.evidence ? `\n# Evidence and Reasoning\n\n${args.evidence}` : ''}`

  const content = matter.stringify(fullContent, frontmatter)
  const hash = createHash('sha256').update(content).digest('hex')

  const finalFrontmatter = { ...frontmatter, hash }
  const finalContent = matter.stringify(fullContent, finalFrontmatter)

  // Write file
  const predictionsDir = join(process.cwd(), 'content/predictions')
  await fs.mkdir(predictionsDir, { recursive: true })

  const filePath = join(predictionsDir, filename)
  await fs.writeFile(filePath, finalContent)

  log.success(`Created: content/predictions/${filename}`)
  log.step(`SHA-256: ${hash}`)

  // Git operations
  if (isGitRepo()) {
    log.info('Committing to git...')
    const commitHash = await commitToGit(filename, args.statement)
    if (commitHash) {
      log.step(`Git commit: ${commitHash.substring(0, 8)}`)
    }
  }

  log.success('Prediction created successfully!')
  return { filename, hash, id }
}

// Main enhanced wizard
async function enhancedPredictWizard() {
  log.header('Advanced Prediction Wizard')
  console.log(
    chalk.gray(
      '   Create high-quality, cryptographically verifiable predictions\n'
    )
  )

  log.info(
    'This wizard will guide you through creating well-formatted predictions'
  )
  log.info(
    "We'll help ensure your prediction is specific, measurable, and resolvable"
  )

  // Step 1: Statement with guidance
  showGuidelines('statement')

  let statement = ''
  while (!statement) {
    const input = await question(
      chalk.bold('\n📝 What specific outcome do you predict? ')
    )
    statement = await refineStatement(input)
    if (!statement) {
      statement = '' // Reset to try again
    }
  }

  log.success('Statement looks good!')

  // Step 2: Resolution criteria with guidance
  showGuidelines('resolution')

  let resolutionCriteria = ''
  while (!resolutionCriteria || resolutionCriteria.length < 20) {
    resolutionCriteria = await question(
      chalk.bold(
        '\n⚖️  How exactly will you determine if this was correct?\n   (Include data sources, edge cases, measurement details): '
      )
    )
    if (!resolutionCriteria || resolutionCriteria.length < 20) {
      log.warning(
        'Please provide more detailed resolution criteria (min 20 characters)'
      )
      log.tip(
        'Example: "Using CoinGecko closing price on December 31, 2025 at 11:59 PM UTC"'
      )
    }
  }

  // Step 3: Quality check with LLM (if available)
  log.section('Quality Analysis')
  const analysis = await checkPredictionQuality(statement, resolutionCriteria)

  // Display detailed quality scores
  if (analysis.overallScore) {
    log.info(`Overall Quality Score: ${analysis.overallScore}/10`)

    console.log(chalk.bold('\n   📊 Detailed Scores:'))
    console.log(
      `   Clarity: ${getScoreColor(analysis.clarity)} ${analysis.clarity}`
    )
    console.log(
      `   Specificity: ${getScoreColor(analysis.specificity)} ${analysis.specificity}`
    )
    console.log(
      `   Measurability: ${getScoreColor(analysis.measurability)} ${analysis.measurability}`
    )
    console.log(
      `   Resolvability: ${getScoreColor(analysis.resolvability)} ${analysis.resolvability}`
    )
  }

  // Show strengths
  if (analysis.strengths?.length > 0) {
    console.log(chalk.bold('\n   ✅ Strengths:'))
    analysis.strengths.forEach((s) => console.log(chalk.green(`   • ${s}`)))
  }

  // Show suggestions
  if (analysis.suggestions?.length > 0) {
    console.log(chalk.bold('\n   💡 Suggestions for improvement:'))
    analysis.suggestions.forEach((s) => log.tip(s))
  }

  // Show concerns
  if (analysis.concerns?.length > 0) {
    console.log(chalk.bold('\n   ⚠️  Potential concerns:'))
    analysis.concerns.forEach((c) => console.log(chalk.yellow(`   • ${c}`)))
  }

  if (analysis.suggestions?.length > 0 || analysis.concerns?.length > 0) {
    const proceed = await question(
      chalk.bold(
        '\n🔄 Would you like to revise based on this feedback? (y/N): '
      )
    )
    if (proceed.toLowerCase() === 'y' || proceed.toLowerCase() === 'yes') {
      log.info('Feel free to restart and refine your prediction!')
      rl.close()
      return
    }
  } else {
    log.success('Prediction quality looks excellent!')
  }

  // Step 4: Confidence with guidance
  log.section('Confidence Assessment')
  log.info('Confidence guidelines:')
  log.tip('50% = Coin flip / Complete uncertainty')
  log.tip('70% = Likely but significant doubt remains')
  log.tip('85% = Very likely, would be surprised if wrong')
  log.tip('95% = Almost certain, would bet heavily')
  log.warning('Avoid 0-5% or 95-100% unless truly exceptional')

  let confidence = ''
  while (!validateConfidence(confidence).valid) {
    confidence = await question(
      chalk.bold('\n🎯 How confident are you? (5-95): ')
    )
    const validation = validateConfidence(confidence)
    if (!validation.valid) {
      log.warning(validation.reason)
    }
  }
  confidence = parseInt(confidence)

  // Step 5: Deadline with smart validation
  let deadline = ''
  while (!validateDate(deadline).valid) {
    deadline = await question(
      chalk.bold('\n📅 Resolution deadline (YYYY-MM-DD): ')
    )
    const validation = validateDate(deadline)
    if (!validation.valid) {
      log.warning(validation.reason)
    }
  }

  // Step 6: Categories with suggestions
  log.info(
    'Common categories: ai, economics, politics, technology, climate, sports'
  )
  const categoriesInput = await question(
    chalk.bold('\n🏷️  Categories (comma-separated): ')
  )
  const categories = categoriesInput
    ? categoriesInput
        .split(',')
        .map((c) => c.trim().toLowerCase())
        .filter((c) => c)
    : []

  // Step 7: Additional evidence
  console.log(chalk.bold('\n📖 Additional evidence/reasoning (optional):'))
  console.log(chalk.gray('   Any background info, data sources, or reasoning.'))
  console.log(
    chalk.gray('   Press Enter twice when done, or skip with double Enter.\n')
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

  // Step 8: Final review
  log.section('Final Review')
  console.log(chalk.bold('Statement:'), chalk.white(statement))
  console.log(chalk.bold('Resolution:'), chalk.white(resolutionCriteria))
  console.log(chalk.bold('Confidence:'), chalk.white(`${confidence}%`))
  console.log(chalk.bold('Deadline:'), chalk.white(deadline))
  console.log(
    chalk.bold('Categories:'),
    chalk.white(categories.join(', ') || 'none')
  )

  const confirm = await question(
    chalk.bold('\n✅ Create this prediction? (Y/n): ')
  )
  if (confirm.toLowerCase() === 'n' || confirm.toLowerCase() === 'no') {
    log.info('Prediction cancelled')
    rl.close()
    return
  }

  rl.close()

  // Processing with enhanced metadata
  log.section('Processing Prediction')

  const id = createHash('sha256')
    .update(statement + Date.now())
    .digest('hex')
    .substring(0, 8)
  const created = new Date().toISOString()
  const filename = generateFilename(statement, deadline)

  log.step(`Generated ID: ${id}`)
  log.step(`Filename: ${filename}`)

  // Enhanced frontmatter with resolution criteria
  const frontmatter = {
    id,
    statement,
    resolutionCriteria,
    confidence,
    deadline,
    categories,
    visibility: 'public',
    created,
    evidence: evidence.trim() || undefined,
    qualityScore: analysis.suggestions.length === 0 ? 'high' : 'medium'
  }

  // Create content with resolution criteria as structured data
  const fullContent = `# Resolution Criteria

${resolutionCriteria}

${evidence.trim() ? `\n# Evidence and Reasoning\n\n${evidence.trim()}` : ''}`

  const content = matter.stringify(fullContent, frontmatter)
  const hash = createHash('sha256').update(content).digest('hex')

  // Add hash to frontmatter
  const finalFrontmatter = { ...frontmatter, hash }
  const finalContent = matter.stringify(fullContent, finalFrontmatter)

  // Write file
  const predictionsDir = join(process.cwd(), 'content/predictions')
  await fs.mkdir(predictionsDir, { recursive: true })

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
  }

  // Success summary
  log.header('High-Quality Prediction Created!')
  console.log(
    chalk.gray(`
   Statement: ${statement}
   Resolution: ${resolutionCriteria.substring(0, 60)}${resolutionCriteria.length > 60 ? '...' : ''}
   Confidence: ${confidence}%
   Deadline: ${deadline}
   Quality: ${frontmatter.qualityScore}
   File: content/predictions/${filename}
  `)
  )

  log.success(
    'Your prediction is cryptographically verified and ready for tracking!'
  )
}

// Utility functions (same as before)
function generateFilename(statement, deadline) {
  const year = deadline
    ? new Date(deadline).getFullYear()
    : new Date().getFullYear()
  const slug = statement
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, '-')
    .substring(0, 40)
    .replace(/-+$/, '')

  return `${year}-${slug}.md`
}

function isGitRepo() {
  try {
    execSync('git rev-parse --git-dir', { stdio: 'ignore' })
    return true
  } catch {
    return false
  }
}

async function commitToGit(filename, statement) {
  try {
    execSync(`git add "content/predictions/${filename}"`, { stdio: 'inherit' })
    const commitMsg = `predict: ${statement.substring(0, 50)}${statement.length > 50 ? '...' : ''}`
    execSync(`git commit -m "${commitMsg}"`, { stdio: 'inherit' })

    const commitHash = execSync('git rev-parse HEAD', {
      encoding: 'utf8'
    }).trim()
    return commitHash
  } catch {
    return null
  }
}

// Main execution logic
async function main() {
  if (hasRequiredCliArgs(cliArgs)) {
    // CLI mode - all required args provided
    await createPredictionFromArgs(cliArgs)
  } else if (Object.keys(cliArgs).length > 0 && !cliArgs.help) {
    // Partial CLI args provided - show error
    log.error('Incomplete arguments for CLI mode')
    log.info('Required: --statement, --confidence, --resolution')
    log.info('Optional: --deadline (for time-bound predictions)')
    log.info('Run with --help for more information')
    process.exit(1)
  } else {
    // Interactive mode
    await enhancedPredictWizard()
  }
}

// Error handling
process.on('SIGINT', () => {
  console.log(chalk.yellow('\n\n👋 Prediction creation cancelled'))
  process.exit(0)
})

main().catch((error) => {
  log.error(`Failed to create prediction: ${error.message}`)
  process.exit(1)
})
