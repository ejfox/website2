#!/usr/bin/env node
/**
 * @file predict-pro.mjs
 * @description Interactive prediction CLI (inquirer prompts).
 *
 * yarn predict                          — create new prediction
 * yarn predict --update <filename.md>   — update confidence
 * yarn predict --resolve <filename.md>  — resolve prediction
 *
 * Writes content/predictions/<slug>.md and runs `git commit -- <that file>`
 * itself on every create/update/resolve (no push); create/update add a second
 * commit recording the first one's SHA in frontmatter. Not signed: the stored `hash` is SHA-256 of
 * a gray-matter serialization that later rewrites change, so it doesn't
 * reproduce; the git commit is the only checkable proof (see CLAUDE.md,
 * Predictions). Scoring: scripts/meta/calibration-analysis.mjs.
 */

import { promises as fs } from 'node:fs'
import { join } from 'node:path'
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import matter from 'gray-matter'
import { consola } from 'consola'
import inquirer from 'inquirer'

// Relative to cwd: run from the repo root (yarn does).
const predictionsDir = join(process.cwd(), 'content', 'predictions')

// ── Helpers ─────────────────────────────────────────────────

function makeSlug(statement) {
  return statement
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .substring(0, 60)
}

function hashContent(content) {
  return createHash('sha256').update(content).digest('hex')
}

// Commits ONLY `filepath` (`git commit -- <path>`), so anything else already
// staged stays staged and out of the prediction's commit. execFileSync with an
// args array, never a shell string: the message carries the statement, and a
// `"`, `$` or backtick in it must stay text.
function gitCommit(filepath, message) {
  const git = (...args) =>
    execFileSync('git', args, { encoding: 'utf8', stdio: 'pipe' })
  try {
    git('add', '--', filepath)
    git('commit', '-m', message, '--', filepath)
    return git('rev-parse', 'HEAD').trim()
  } catch (error) {
    consola.warn('Git commit failed:', error.message)
    return null
  }
}

// A commit can't contain its own SHA (amending changes it), so the SHA of the
// prediction's commit is written back and recorded in a second commit scoped
// to the same file. The FIRST commit is the proof; this one just indexes it.
async function recordCommitSha(filepath, content, label) {
  await fs.writeFile(filepath, content)
  return gitCommit(filepath, `predict: record commit sha for ${label}`)
}

// ── Create ──────────────────────────────────────────────────

async function createPrediction() {
  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'statement',
      message: 'What do you predict?',
      validate: (input) =>
        input.length >= 10 || 'Be more specific (min 10 chars)',
    },
    {
      type: 'number',
      name: 'confidence',
      message: 'Confidence (5-95%):',
      validate: (input) =>
        (input >= 5 && input <= 95) || 'Must be between 5-95%',
    },
    {
      type: 'input',
      name: 'deadline',
      message: 'Deadline (YYYY-MM-DD):',
      validate: (input) => {
        const d = new Date(input)
        return !Number.isNaN(d.getTime()) || 'Enter a valid date'
      },
    },
    {
      type: 'input',
      name: 'resolutionCriteria',
      message: 'How will this be verified?',
      validate: (input) =>
        input.length >= 10 || 'Be more specific (min 10 chars)',
    },
    {
      type: 'input',
      name: 'categories',
      message: 'Categories (comma-separated):',
      filter: (input) =>
        input
          .split(',')
          .map((c) => c.trim().toLowerCase())
          .filter(Boolean),
    },
    {
      type: 'input',
      name: 'evidence',
      message: 'Why do you believe this? (reasoning)',
      default: '',
    },
  ])

  const slug = makeSlug(answers.statement)
  const now = new Date().toISOString()

  const frontmatter = {
    id: slug,
    statement: answers.statement,
    resolutionCriteria: answers.resolutionCriteria,
    confidence: answers.confidence,
    deadline: new Date(answers.deadline).toISOString(),
    categories: answers.categories,
    created: now,
    visibility: 'public',
  }

  if (answers.evidence) {
    frontmatter.evidence = answers.evidence
  }

  const body = `
# Resolution Criteria

${answers.resolutionCriteria}

# Evidence and Reasoning

${answers.evidence || '_No reasoning provided._'}
`

  // Hash covers the file as it is BEFORE `hash` (and later `gitCommit`) are
  // added, so re-hashing the saved file never matches.
  const content = matter.stringify(body, frontmatter)
  const hash = hashContent(content)
  frontmatter.hash = hash

  const finalContent = matter.stringify(body, frontmatter)
  const filename = `${slug}.md`
  const filepath = join(predictionsDir, filename)

  await fs.mkdir(predictionsDir, { recursive: true })
  await fs.writeFile(filepath, finalContent)

  consola.success(`Saved: content/predictions/${filename}`)

  const commitHash = gitCommit(
    filepath,
    `predict: ${answers.statement.substring(0, 60)}`
  )

  if (commitHash) {
    frontmatter.gitCommit = commitHash
    await recordCommitSha(
      filepath,
      matter.stringify(body, frontmatter),
      commitHash.substring(0, 8)
    )
    consola.success(`Committed: ${commitHash.substring(0, 8)}`)
  }
}

// ── Update confidence ───────────────────────────────────────

async function updatePrediction(filename) {
  const filepath = join(predictionsDir, filename)

  let fileContent
  try {
    fileContent = await fs.readFile(filepath, 'utf8')
  } catch {
    consola.error(`Not found: ${filename}`)
    const files = await fs.readdir(predictionsDir)
    consola.info('Available:', files.join(', '))
    process.exit(1)
  }

  const parsed = matter(fileContent)
  const currentConfidence = parsed.data.confidence

  consola.info(`Statement: ${parsed.data.statement}`)
  consola.info(`Current confidence: ${currentConfidence}%\n`)

  const answers = await inquirer.prompt([
    {
      type: 'number',
      name: 'confidence',
      message: 'New confidence (5-95%):',
      default: currentConfidence,
      validate: (input) =>
        (input >= 5 && input <= 95) || 'Must be between 5-95%',
    },
    {
      type: 'input',
      name: 'reasoning',
      message: 'Why the change?',
      validate: (input) =>
        input.length >= 10 || 'Be more specific (min 10 chars)',
    },
  ])

  // updates[0].confidenceBefore is what calibration treats as the confidence
  // the prediction was published with ("as signed" in calibration-analysis).
  const timestamp = new Date().toISOString()
  const update = {
    timestamp,
    confidenceBefore: currentConfidence,
    confidenceAfter: answers.confidence,
    reasoning: answers.reasoning,
  }

  const updatedData = {
    ...parsed.data,
    confidence: answers.confidence,
    updatedAt: timestamp,
    updates: [...(parsed.data.updates || []), update],
  }

  const newContent = matter.stringify(parsed.content, updatedData)
  await fs.writeFile(filepath, newContent)

  consola.success(`${currentConfidence}% → ${answers.confidence}%`)

  const commitHash = gitCommit(
    filepath,
    `predict: update "${parsed.data.statement.substring(0, 40)}..." (${currentConfidence}% → ${answers.confidence}%)`
  )

  if (commitHash) {
    updatedData.updates[updatedData.updates.length - 1].gitCommit = commitHash
    await recordCommitSha(
      filepath,
      matter.stringify(parsed.content, updatedData),
      commitHash.substring(0, 8)
    )
  }
}

// ── Resolve ─────────────────────────────────────────────────

async function resolvePrediction(filename) {
  const filepath = join(predictionsDir, filename)

  let fileContent
  try {
    fileContent = await fs.readFile(filepath, 'utf8')
  } catch {
    consola.error(`Not found: ${filename}`)
    const files = await fs.readdir(predictionsDir)
    consola.info('Available:', files.join(', '))
    process.exit(1)
  }

  const parsed = matter(fileContent)

  consola.info(`Statement: ${parsed.data.statement}`)
  consola.info(`Confidence: ${parsed.data.confidence}%`)
  consola.info(`Deadline: ${parsed.data.deadline}\n`)

  const answers = await inquirer.prompt([
    {
      type: 'list',
      name: 'status',
      message: 'Result:',
      choices: [
        { name: 'Correct', value: 'correct' },
        { name: 'Incorrect', value: 'incorrect' },
        { name: 'Ambiguous', value: 'ambiguous' },
      ],
    },
    {
      type: 'input',
      name: 'resolution',
      message: 'What happened? (sources, evidence):',
      validate: (input) =>
        input.length >= 20 || 'Be more detailed (min 20 chars)',
    },
  ])

  const updatedData = {
    ...parsed.data,
    resolved: true,
    resolved_date: new Date().toISOString(),
    status: answers.status,
    resolution: answers.resolution,
  }

  const newContent = matter.stringify(parsed.content, updatedData)
  await fs.writeFile(filepath, newContent)

  const icon =
    answers.status === 'correct'
      ? 'correct'
      : answers.status === 'incorrect'
        ? 'incorrect'
        : 'ambiguous'
  consola.success(`Resolved as ${icon}`)

  gitCommit(
    filepath,
    `predict: resolve "${parsed.data.statement.substring(0, 40)}..." as ${answers.status}`
  )
}

// ── Main ────────────────────────────────────────────────────
const args = process.argv.slice(2)
const updateIndex = args.indexOf('--update')
const resolveIndex = args.indexOf('--resolve')

const fail = (error) => {
  console.error(error)
  process.exit(1)
}

if (resolveIndex !== -1 && args[resolveIndex + 1]) {
  resolvePrediction(args[resolveIndex + 1]).catch(fail)
} else if (updateIndex !== -1 && args[updateIndex + 1]) {
  updatePrediction(args[updateIndex + 1]).catch(fail)
} else {
  createPrediction().catch(fail)
}
