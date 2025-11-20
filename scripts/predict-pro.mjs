#!/usr/bin/env node

import { promises as fs } from 'node:fs'
import { join } from 'node:path'
import { execSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import matter from 'gray-matter'
import { consola } from 'consola'
import inquirer from 'inquirer'
import { z } from 'zod'

// Zod schemas for validation (replacing 50+ lines of custom validation)
const PredictionSchema = z.object({
  statement: z
    .string()
    .min(20, 'Statement too short - be more specific (min 20 chars)')
    .max(
      300,
      'Statement too long - break into multiple predictions ' +
        '(max 300 chars)'
    ),
  deadline: z.string().refine((date) => {
    const d = new Date(date)
    const oneWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    return !Number.isNaN(d.getTime()) && d > oneWeek && d.getFullYear() <= 2050
  }, 'Deadline must be valid and at least one week in the future (max 2050)'),
  confidence: z
    .number()
    .min(5, 'Confidence should be between 5-95% (avoid overconfidence)')
    .max(95, 'Confidence should be between 5-95% (avoid overconfidence)'),
  resolution: z
    .string()
    .min(10, 'Resolution criteria too short - be more specific')
})

const QUALITY_GUIDELINES = {
  statement: {
    title: 'Writing Clear Prediction Statements',
    rules: [
      'Be specific and measurable - avoid vague terms',
      'Include clear timeframes and thresholds',
      'Use objective, verifiable criteria',
      'Avoid compound predictions (break into separate predictions)',
      'State what will happen, not what might happen'
    ]
  },
  resolution: {
    title: 'Defining Resolution Criteria',
    rules: [
      "Specify exact data sources you'll use to resolve",
      'Define edge cases and how to handle them',
      'Choose objective, third-party sources when possible',
      "Be clear about what counts as 'success'",
      'Consider time zones and measurement periods'
    ]
  }
}

async function checkPredictionQuality(statement, resolutionCriteria) {
  const openRouterKey = process.env.OPENROUTER_API_KEY

  if (!openRouterKey) {
    consola.info(
      'Using built-in quality analysis ' +
        '(AI analysis available with OPENROUTER_API_KEY)'
    )
    return getBuiltInAnalysis(statement, resolutionCriteria)
  }

  try {
    consola.start('Analyzing prediction quality with AI...')

    const prompt = [
      'You are an expert prediction scientist. ' +
        'Analyze this prediction for quality and provide ' +
        'specific suggestions for improvement.',
      '',
      `PREDICTION STATEMENT: "${statement}"`,
      `RESOLUTION CRITERIA: "${resolutionCriteria}"`,
      '',
      'Evaluate on these dimensions:',
      '1. Clarity - Is the prediction statement clear and unambiguous?',
      '2. Specificity - Does it include specific numbers, dates, thresholds?',
      '3. Measurability - Can the outcome be objectively determined?',
      '4. Resolvability - Are the resolution criteria detailed and objective?',
      '5. Historical Context - Can you think of similar historical events ' +
        'that could inform confidence calibration?',
      '',
      'Provide your analysis as a JSON object with this exact structure:',
      '{',
      '  "clarity": "excellent|good|needs_improvement|poor",',
      '  "specificity": "excellent|good|needs_improvement|poor",',
      '  "measurability": "excellent|good|needs_improvement|poor",',
      '  "resolvability": "excellent|good|needs_improvement|poor",',
      '  "overallScore": 1-10,',
      '  "suggestions": ["specific actionable suggestion 1", "suggestion 2"],',
      '  "strengths": ["what\'s good about this prediction"],',
      '  "concerns": ["potential issues or ambiguities"],',
      '  "historicalComparisons": [' +
        '"similar event 1 with relevant outcome", "similar event 2"]',
      '}'
    ].join('\n')

    const response = await fetch(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${openRouterKey}`,
          'HTTP-Referer': 'https://ejfox.com',
          'X-Title': 'EJ Fox Prediction Quality Checker'
        },
        body: JSON.stringify({
          model: 'anthropic/claude-3.5-sonnet',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.1,
          max_tokens: 1000
        })
      }
    )

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`)
    }

    const data = await response.json()
    const analysisText = data.choices?.[0]?.message?.content

    if (!analysisText) {
      throw new Error('No analysis content received')
    }

    const jsonMatch = analysisText.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('Could not extract JSON from analysis')
    }

    consola.success('AI analysis complete')
    return JSON.parse(jsonMatch[0])
  } catch {
    consola.warn('AI analysis unavailable - using built-in quality checker')
    consola.info(
      'This is completely normal and the wizard works great without AI!'
    )
    return getBuiltInAnalysis(statement, resolutionCriteria)
  }
}

function getBuiltInAnalysis(statement, resolutionCriteria) {
  const analysis = {
    clarity: 'good',
    specificity: 'good',
    measurability: 'good',
    resolvability: 'good',
    overallScore: 7,
    suggestions: [],
    strengths: [],
    concerns: []
  }

  // Basic checks
  const hasNumbers = /\d/.test(statement)
  if (!hasNumbers) {
    analysis.suggestions.push('Consider adding specific numbers or dates')
    analysis.specificity = 'needs_improvement'
  }

  const uncertaintyPattern = /maybe|might|could|possibly/i
  if (uncertaintyPattern.test(statement)) {
    analysis.suggestions.push(
      'Avoid uncertainty words - state what will happen'
    )
    analysis.clarity = 'needs_improvement'
  }

  if (statement.length > 200) {
    analysis.suggestions.push('Consider shortening for clarity')
  }

  if (resolutionCriteria.length < 50) {
    analysis.suggestions.push('Add more detail to resolution criteria')
    analysis.resolvability = 'needs_improvement'
  }

  return analysis
}

function displayAnalysis(analysis) {
  const scoreColors = {
    excellent: '🟢',
    good: '🔵',
    needs_improvement: '🟡',
    poor: '🔴'
  }

  const strengthsSection = analysis.strengths.length
    ? `✅ Strengths:\n${analysis.strengths
        .map((s) => `   • ${s}`)
        .join('\n')}\n`
    : ''

  const suggestionsSection = analysis.suggestions.length
    ? `💡 Suggestions:\n${analysis.suggestions
        .map((s) => `   • ${s}`)
        .join('\n')}\n`
    : ''

  const concernsItems = analysis.concerns.map((c) => `   • ${c}`).join('\n')
  const concernsSection = analysis.concerns.length
    ? `⚠️  Concerns:\n${concernsItems}\n`
    : ''

  const historicalSection = analysis.historicalComparisons?.length
    ? `📜 Similar Historical Events:\n${analysis.historicalComparisons
        .map((h) => `   • ${h}`)
        .join('\n')}`
    : ''

  const box = `
📊 PREDICTION QUALITY ANALYSIS

${scoreColors[analysis.clarity]} Clarity: ${analysis.clarity}
${scoreColors[analysis.specificity]} Specificity: ${analysis.specificity}
${scoreColors[analysis.measurability]} Measurability: ${analysis.measurability}
${scoreColors[analysis.resolvability]} Resolvability: ${analysis.resolvability}

Overall Score: ${analysis.overallScore}/10

${strengthsSection}${suggestionsSection}${concernsSection}${historicalSection}
  `

  consola.box(box)
}

function showGuidelines(section) {
  const guide = QUALITY_GUIDELINES[section]
  if (!guide) return

  consola.info(`${guide.title}:`)
  guide.rules.forEach((rule) => consola.log(`   • ${rule}`))
}

async function getInputWithValidation(questions) {
  const answers = await inquirer.prompt(questions)

  try {
    PredictionSchema.parse({
      statement: answers.statement,
      deadline: answers.deadline,
      confidence: Number.parseInt(answers.confidence),
      resolution: answers.resolution
    })
    return answers
  } catch (error) {
    consola.error('Validation failed:')
    error.errors.forEach((err) => consola.error(`  • ${err.message}`))
    consola.info('Please try again...\n')
    return getInputWithValidation(questions)
  }
}

async function createPrediction() {
  consola.start('🔮 Prediction Creation Wizard')

  const questions = [
    {
      type: 'input',
      name: 'statement',
      message: 'Enter your prediction statement:',
      validate: (input) =>
        input.length >= 20 || 'Statement must be at least 20 characters'
    },
    {
      type: 'input',
      name: 'deadline',
      message: 'Enter resolution deadline (YYYY-MM-DD):',
      validate: (input) => {
        const date = new Date(input)
        return !Number.isNaN(date.getTime()) || 'Please enter a valid date'
      }
    },
    {
      type: 'number',
      name: 'confidence',
      message: 'Enter confidence level (5-95%):',
      validate: (input) =>
        (input >= 5 && input <= 95) || 'Confidence must be between 5-95%'
    },
    {
      type: 'input',
      name: 'resolution',
      message: 'Enter resolution criteria:',
      validate: (input) =>
        input.length >= 10 ||
        'Resolution criteria must be at least 10 characters'
    }
  ]

  const answers = await getInputWithValidation(questions)

  // Show guidelines
  consola.info('\n📋 Quality Guidelines:')
  showGuidelines('statement')
  showGuidelines('resolution')

  // Get quality analysis
  const analysis = await checkPredictionQuality(
    answers.statement,
    answers.resolution
  )
  displayAnalysis(analysis)

  // Optional: Add historical context
  consola.info(
    '\n💭 Think: What similar events have happened before? ' +
      'What were the outcomes?'
  )
  consola.info(
    '   (e.g., "2013 NYC Mayor - de Blasio won by 49pts" or ' +
      '"Last 5 AI hype cycles peaked at 18mo")'
  )

  const { historicalNotes } = await inquirer.prompt([
    {
      type: 'input',
      name: 'historicalNotes',
      message: 'Quick historical context (optional, press Enter to skip):',
      default: ''
    }
  ])

  // Add historical notes to evidence if provided
  if (historicalNotes) {
    answers.resolution += `\n\n**Historical Context:** ${historicalNotes}\n`
  }

  // Confirm creation
  const { shouldCreate } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'shouldCreate',
      message: 'Create this prediction?',
      default: true
    }
  ])

  if (!shouldCreate) {
    consola.info('Prediction creation cancelled')
    return
  }

  // Generate prediction file
  const slug = answers.statement
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, '-')
    .substring(0, 50)

  const predictionData = {
    statement: answers.statement,
    deadline: answers.deadline,
    confidence: answers.confidence,
    resolution: answers.resolution,
    created: new Date().toISOString(),
    id: createHash('sha256')
      .update(answers.statement)
      .digest('hex')
      .substring(0, 8),
    analysis
  }

  const frontmatter = {
    title: answers.statement,
    date: new Date().toISOString(),
    deadline: answers.deadline,
    confidence: answers.confidence,
    status: 'active',
    tags: ['prediction'],
    analysis: analysis.overallScore
  }

  const content = `---
${Object.entries(frontmatter)
  .map(
    ([key, value]) =>
      `${key}: ${typeof value === 'string' ? `"${value}"` : value}`
  )
  .join('\n')}
---

# ${answers.statement}

## Prediction Details

**Statement:** ${answers.statement}  
**Deadline:** ${answers.deadline}  
**Confidence:** ${answers.confidence}%  
**Status:** Active

## Resolution Criteria

${answers.resolution}

## Quality Analysis

**Overall Score:** ${analysis.overallScore}/10

### Assessment
- **Clarity:** ${analysis.clarity}
- **Specificity:** ${analysis.specificity}
- **Measurability:** ${analysis.measurability}
- **Resolvability:** ${analysis.resolvability}

${
  analysis.suggestions.length
    ? `### Suggestions\n${analysis.suggestions
        .map((s) => `- ${s}`)
        .join('\n')}\n`
    : ''
}${
    analysis.strengths.length
      ? `### Strengths\n${analysis.strengths.map((s) => `- ${s}`).join('\n')}\n`
      : ''
  }${
    analysis.concerns.length
      ? `### Concerns\n${analysis.concerns.map((c) => `- ${c}`).join('\n')}\n`
      : ''
  }

## Notes

_Created with the Prediction Quality Wizard_
`

  const filename = `${slug}.md`
  const filepath = join(process.cwd(), 'content', 'predictions', filename)

  try {
    await fs.mkdir(join(process.cwd(), 'content', 'predictions'), {
      recursive: true
    })
    await fs.writeFile(filepath, content)

    consola.success(`Prediction saved: ${filepath}`)
    consola.info(`Prediction ID: ${predictionData.id}`)

    // Optionally commit to git
    const { shouldCommit } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'shouldCommit',
        message: 'Commit to git?',
        default: false
      }
    ])

    if (shouldCommit) {
      try {
        execSync(`git add "${filepath}"`)
        const msg = `Add prediction: ${answers.statement.substring(0, 50)}...`
        execSync(`git commit -m "${msg}"`)
        consola.success('Committed to git')
      } catch (error) {
        consola.warn('Git commit failed:', error.message)
      }
    }
  } catch (error) {
    consola.error('Failed to save prediction:', error.message)
  }
}

async function updatePrediction(filename) {
  consola.start('🔄 Prediction Update Wizard')

  const predictionsDir = join(process.cwd(), 'content', 'predictions')
  const filepath = join(predictionsDir, filename)

  // Read existing prediction
  let fileContent
  try {
    fileContent = await fs.readFile(filepath, 'utf8')
  } catch {
    consola.error(`Could not find prediction: ${filename}`)
    const files = await fs.readdir(predictionsDir)
    consola.info('Available predictions:')
    files.forEach((f) => consola.log(`   • ${f}`))
    process.exit(1)
  }

  const parsed = matter(fileContent)
  const currentConfidence = parsed.data.confidence

  consola.info(`Statement: ${parsed.data.statement || parsed.data.title}`)
  consola.info(`Current confidence: ${currentConfidence}%\n`)

  // Get update details
  const answers = await inquirer.prompt([
    {
      type: 'number',
      name: 'confidence',
      message: 'New confidence level (5-95%):',
      default: currentConfidence,
      validate: (input) =>
        (input >= 5 && input <= 95) || 'Confidence must be between 5-95%'
    },
    {
      type: 'input',
      name: 'reasoning',
      message: 'Reasoning for this update:',
      validate: (input) =>
        input.length >= 10 || 'Reasoning must be at least 10 characters'
    }
  ])

  // Create update entry
  const timestamp = new Date().toISOString()
  const update = {
    timestamp,
    confidenceBefore: currentConfidence,
    confidenceAfter: answers.confidence,
    reasoning: answers.reasoning
  }

  // Update frontmatter
  const updatedData = {
    ...parsed.data,
    confidence: answers.confidence,
    updatedAt: timestamp,
    updates: [...(parsed.data.updates || []), update]
  }

  // Generate new content with updated frontmatter
  const newContent = matter.stringify(parsed.content, updatedData)

  // Calculate hash
  const hash = createHash('sha256').update(newContent).digest('hex')
  update.hash = hash

  // Update hash in the update entry
  const finalData = {
    ...updatedData,
    updates: updatedData.updates.map((u, i) =>
      i === updatedData.updates.length - 1 ? { ...u, hash } : u
    )
  }

  const finalContent = matter.stringify(parsed.content, finalData)

  // Write updated file
  await fs.writeFile(filepath, finalContent)

  consola.success(`Updated: ${filename}`)
  consola.info(`Confidence: ${currentConfidence}% → ${answers.confidence}%`)
  consola.info(`Hash: ${hash.substring(0, 16)}...`)

  // Git commit
  const { shouldCommit } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'shouldCommit',
      message: 'Commit to git?',
      default: true
    }
  ])

  if (shouldCommit) {
    try {
      execSync(`git add "${filepath}"`)
      const stmt =
        (parsed.data.statement || parsed.data.title).substring(0, 40) + '...'
      const commitMsg =
        `predict: update ${stmt} ` +
        `(${currentConfidence}% → ${answers.confidence}%)`
      execSync(`git commit -m "${commitMsg}"`)

      const commitHash = execSync('git rev-parse HEAD', {
        encoding: 'utf8'
      }).trim()
      consola.success(`Committed: ${commitHash.substring(0, 8)}`)

      // Add git commit hash to the update
      const lastUpdateIndex = finalData.updates.length - 1
      finalData.updates[lastUpdateIndex].gitCommit = commitHash
      const finalWithGit = matter.stringify(parsed.content, finalData)
      await fs.writeFile(filepath, finalWithGit)
    } catch (error) {
      consola.warn('Git commit failed:', error.message)
    }
  }

  consola.box(`
✅ PREDICTION UPDATED

Statement: ${parsed.data.statement || parsed.data.title}
Confidence: ${currentConfidence}% → ${answers.confidence}%
Total Updates: ${finalData.updates.length}
  `)
}

async function resolvePrediction(filename) {
  consola.start('🎯 Prediction Resolution Wizard')

  const predictionsDir = join(process.cwd(), 'content', 'predictions')
  const filepath = join(predictionsDir, filename)

  // Read existing prediction
  let fileContent
  try {
    fileContent = await fs.readFile(filepath, 'utf8')
  } catch {
    consola.error(`Could not find prediction: ${filename}`)
    const files = await fs.readdir(predictionsDir)
    consola.info('Available predictions:')
    files.forEach((f) => consola.log(`   • ${f}`))
    process.exit(1)
  }

  const parsed = matter(fileContent)

  consola.info(`Statement: ${parsed.data.statement}`)
  consola.info(`Confidence: ${parsed.data.confidence}%`)
  consola.info(`Deadline: ${parsed.data.deadline}\n`)

  // Get resolution details
  const answers = await inquirer.prompt([
    {
      type: 'list',
      name: 'status',
      message: 'How did this prediction resolve?',
      choices: [
        { name: '✅ Correct - Prediction came true', value: 'correct' },
        {
          name: '❌ Incorrect - Prediction did not come true',
          value: 'incorrect'
        },
        {
          name: '⚠️  Ambiguous - Unclear or partially true',
          value: 'ambiguous'
        }
      ]
    },
    {
      type: 'input',
      name: 'resolution',
      message: 'Resolution notes (what happened, sources, evidence):',
      validate: (input) =>
        input.length >= 20 || 'Resolution notes must be at least 20 characters'
    }
  ])

  const timestamp = new Date().toISOString()

  // Update frontmatter
  const updatedData = {
    ...parsed.data,
    resolved: true,
    resolved_date: timestamp,
    status: answers.status,
    resolution: answers.resolution
  }

  // Generate new content
  const newContent = matter.stringify(parsed.content, updatedData)

  // Calculate hash
  const hash = createHash('sha256').update(newContent).digest('hex')

  // Write updated file
  await fs.writeFile(filepath, newContent)

  consola.success(`Resolved: ${filename}`)
  consola.info(`Status: ${answers.status}`)
  consola.info(`Hash: ${hash.substring(0, 16)}...`)

  // Git commit
  const { shouldCommit } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'shouldCommit',
      message: 'Commit to git?',
      default: true
    }
  ])

  if (shouldCommit) {
    try {
      execSync(`git add "${filepath}"`)
      const emoji =
        answers.status === 'correct'
          ? '✅'
          : answers.status === 'incorrect'
            ? '❌'
            : '⚠️'
      const stmt = parsed.data.statement.substring(0, 40) + '...'
      const commitMsg =
        `predict: ${emoji} resolve "${stmt}" ` + `as ${answers.status}`
      execSync(`git commit -m "${commitMsg}"`)

      const commitHash = execSync('git rev-parse HEAD', {
        encoding: 'utf8'
      }).trim()
      consola.success(`Committed: ${commitHash.substring(0, 8)}`)
    } catch (error) {
      consola.warn('Git commit failed:', error.message)
    }
  }

  const icon =
    answers.status === 'correct'
      ? '🎯'
      : answers.status === 'incorrect'
        ? '💭'
        : '🤔'
  consola.box(`
${icon} PREDICTION RESOLVED

Statement: ${parsed.data.statement}
Status: ${answers.status}
Confidence was: ${parsed.data.confidence}%
Resolved: ${new Date(timestamp).toLocaleDateString()}
  `)
}

// Main execution
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2)
  const updateIndex = args.indexOf('--update')
  const resolveIndex = args.indexOf('--resolve')

  if (resolveIndex !== -1 && args[resolveIndex + 1]) {
    resolvePrediction(args[resolveIndex + 1]).catch(console.error)
  } else if (resolveIndex !== -1) {
    consola.error('Please provide a prediction filename after --resolve')
    consola.info('Usage: yarn predict --resolve <filename.md>')
    process.exit(1)
  } else if (updateIndex !== -1 && args[updateIndex + 1]) {
    updatePrediction(args[updateIndex + 1]).catch(console.error)
  } else if (updateIndex !== -1) {
    consola.error('Please provide a prediction filename after --update')
    consola.info('Usage: yarn predict --update <filename.md>')
    process.exit(1)
  } else {
    createPrediction().catch(console.error)
  }
}
