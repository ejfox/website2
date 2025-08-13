#!/usr/bin/env node

import { promises as fs } from 'fs'
import { join } from 'path'
import { execSync } from 'child_process'
import { createHash } from 'crypto'
import matter from 'gray-matter'
import { consola } from 'consola'
import inquirer from 'inquirer'
import { z } from 'zod'

// Zod schemas for validation (replacing 50+ lines of custom validation)
const PredictionSchema = z.object({
  statement: z.string()
    .min(20, 'Statement too short - be more specific (min 20 chars)')
    .max(300, 'Statement too long - break into multiple predictions (max 300 chars)'),
  deadline: z.string()
    .refine((date) => {
      const d = new Date(date)
      const oneWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      return !isNaN(d.getTime()) && d > oneWeek && d.getFullYear() <= 2050
    }, 'Deadline must be valid and at least one week in the future (max 2050)'),
  confidence: z.number()
    .min(5, 'Confidence should be between 5-95% (avoid overconfidence)')
    .max(95, 'Confidence should be between 5-95% (avoid overconfidence)'),
  resolution: z.string()
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
    consola.info('Using built-in quality analysis (AI analysis available with OPENROUTER_API_KEY)')
    return getBuiltInAnalysis(statement, resolutionCriteria)
  }

  try {
    consola.start('Analyzing prediction quality with AI...')

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
}`

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openRouterKey}`,
        'HTTP-Referer': 'https://ejfox.com',
        'X-Title': 'EJ Fox Prediction Quality Checker'
      },
      body: JSON.stringify({
        model: 'anthropic/claude-3.5-sonnet',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.1,
        max_tokens: 1000
      })
    })

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
  } catch (error) {
    consola.warn('AI analysis unavailable - using built-in quality checker')
    consola.info('This is completely normal and the wizard works great without AI!')
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
  if (!/\d/.test(statement)) {
    analysis.suggestions.push('Consider adding specific numbers or dates')
    analysis.specificity = 'needs_improvement'
  }
  
  if (/maybe|might|could|possibly/i.test(statement)) {
    analysis.suggestions.push('Avoid uncertainty words - state what will happen')
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

  consola.box(`
📊 PREDICTION QUALITY ANALYSIS

${scoreColors[analysis.clarity]} Clarity: ${analysis.clarity}
${scoreColors[analysis.specificity]} Specificity: ${analysis.specificity} 
${scoreColors[analysis.measurability]} Measurability: ${analysis.measurability}
${scoreColors[analysis.resolvability]} Resolvability: ${analysis.resolvability}

Overall Score: ${analysis.overallScore}/10

${analysis.strengths.length ? `✅ Strengths:\n${analysis.strengths.map(s => `   • ${s}`).join('\n')}\n` : ''}
${analysis.suggestions.length ? `💡 Suggestions:\n${analysis.suggestions.map(s => `   • ${s}`).join('\n')}\n` : ''}
${analysis.concerns.length ? `⚠️  Concerns:\n${analysis.concerns.map(c => `   • ${c}`).join('\n')}` : ''}
  `)
}

function showGuidelines(section) {
  const guide = QUALITY_GUIDELINES[section]
  if (!guide) return

  consola.info(`${guide.title}:`)
  guide.rules.forEach(rule => consola.log(`   • ${rule}`))
}

async function getInputWithValidation(questions) {
  const answers = await inquirer.prompt(questions)
  
  try {
    PredictionSchema.parse({
      statement: answers.statement,
      deadline: answers.deadline,
      confidence: parseInt(answers.confidence),
      resolution: answers.resolution
    })
    return answers
  } catch (error) {
    consola.error('Validation failed:')
    error.errors.forEach(err => consola.error(`  • ${err.message}`))
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
      validate: (input) => input.length >= 20 || 'Statement must be at least 20 characters'
    },
    {
      type: 'input', 
      name: 'deadline',
      message: 'Enter resolution deadline (YYYY-MM-DD):',
      validate: (input) => {
        const date = new Date(input)
        return !isNaN(date.getTime()) || 'Please enter a valid date'
      }
    },
    {
      type: 'number',
      name: 'confidence',
      message: 'Enter confidence level (5-95%):',
      validate: (input) => (input >= 5 && input <= 95) || 'Confidence must be between 5-95%'
    },
    {
      type: 'input',
      name: 'resolution',
      message: 'Enter resolution criteria:',
      validate: (input) => input.length >= 10 || 'Resolution criteria must be at least 10 characters'
    }
  ]

  const answers = await getInputWithValidation(questions)
  
  // Show guidelines
  consola.info('\n📋 Quality Guidelines:')
  showGuidelines('statement')
  showGuidelines('resolution')

  // Get quality analysis
  const analysis = await checkPredictionQuality(answers.statement, answers.resolution)
  displayAnalysis(analysis)

  // Confirm creation
  const { shouldCreate } = await inquirer.prompt([{
    type: 'confirm',
    name: 'shouldCreate',
    message: 'Create this prediction?',
    default: true
  }])

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
    id: createHash('sha256').update(answers.statement).digest('hex').substring(0, 8),
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
${Object.entries(frontmatter).map(([key, value]) => `${key}: ${typeof value === 'string' ? `"${value}"` : value}`).join('\n')}
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

${analysis.suggestions.length ? `### Suggestions\n${analysis.suggestions.map(s => `- ${s}`).join('\n')}\n` : ''}
${analysis.strengths.length ? `### Strengths\n${analysis.strengths.map(s => `- ${s}`).join('\n')}\n` : ''}
${analysis.concerns.length ? `### Concerns\n${analysis.concerns.map(c => `- ${c}`).join('\n')}\n` : ''}

## Notes

_Created with the Prediction Quality Wizard_
`

  const filename = `${slug}.md`
  const filepath = join(process.cwd(), 'content', 'predictions', filename)

  try {
    await fs.mkdir(join(process.cwd(), 'content', 'predictions'), { recursive: true })
    await fs.writeFile(filepath, content)
    
    consola.success(`Prediction saved: ${filepath}`)
    consola.info(`Prediction ID: ${predictionData.id}`)
    
    // Optionally commit to git
    const { shouldCommit } = await inquirer.prompt([{
      type: 'confirm', 
      name: 'shouldCommit',
      message: 'Commit to git?',
      default: false
    }])

    if (shouldCommit) {
      try {
        execSync(`git add "${filepath}"`)
        execSync(`git commit -m "Add prediction: ${answers.statement.substring(0, 50)}..."`)
        consola.success('Committed to git')
      } catch (error) {
        consola.warn('Git commit failed:', error.message)
      }
    }

  } catch (error) {
    consola.error('Failed to save prediction:', error.message)
  }
}

// Main execution
if (import.meta.url === `file://${process.argv[1]}`) {
  createPrediction().catch(console.error)
}