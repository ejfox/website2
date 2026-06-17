#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * Calibration Analysis for Predictions
 *
 * Reads prediction markdown files directly and calculates:
 * - Brier score (lower is better, 0 = perfect)
 * - Calibration by confidence bucket
 * - Category breakdown
 *
 * Run: yarn calibrate
 * Output: data/calibration-analysis.json
 */

import { readFile, writeFile, readdir } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import matter from 'gray-matter'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const predictionsDir = join(__dirname, '..', 'content', 'predictions')

async function loadPredictions() {
  const files = await readdir(predictionsDir)
  const mdFiles = files.filter((f) => f.endsWith('.md'))

  const predictions = []
  for (const file of mdFiles) {
    const raw = await readFile(join(predictionsDir, file), 'utf-8')
    const { data } = matter(raw)
    predictions.push(data)
  }

  return predictions
}

/**
 * Brier score = average of (prediction - outcome)^2
 * Range: 0 (perfect) to 1 (worst)
 */
function calculateBrierScore(predictions) {
  const resolved = predictions.filter(
    (p) =>
      p.resolved &&
      (p.status === 'correct' || p.status === 'incorrect') &&
      typeof p.confidence === 'number'
  )

  if (resolved.length === 0) return null

  const scores = resolved.map((p) => {
    const predicted = p.confidence / 100
    const outcome = p.status === 'correct' ? 1 : 0
    return Math.pow(predicted - outcome, 2)
  })

  return scores.reduce((sum, s) => sum + s, 0) / scores.length
}

/**
 * "When I say 70%, does it happen ~70% of the time?"
 */
function calculateCalibration(predictions) {
  const resolved = predictions.filter(
    (p) =>
      p.resolved &&
      (p.status === 'correct' || p.status === 'incorrect') &&
      typeof p.confidence === 'number'
  )

  if (resolved.length === 0) return []

  const buckets = [
    { min: 50, max: 59, label: '50-59%' },
    { min: 60, max: 69, label: '60-69%' },
    { min: 70, max: 79, label: '70-79%' },
    { min: 80, max: 89, label: '80-89%' },
    { min: 90, max: 100, label: '90-100%' },
  ]

  return buckets
    .map((bucket) => {
      const inBucket = resolved.filter(
        (p) => p.confidence >= bucket.min && p.confidence <= bucket.max
      )

      if (inBucket.length === 0) return null

      const correct = inBucket.filter((p) => p.status === 'correct').length
      const accuracy = correct / inBucket.length
      const expectedMidpoint = (bucket.min + bucket.max) / 2 / 100

      return {
        ...bucket,
        count: inBucket.length,
        correct,
        accuracy: Math.round(accuracy * 100),
        expected: Math.round(expectedMidpoint * 100),
        delta: Math.round((accuracy - expectedMidpoint) * 100),
      }
    })
    .filter(Boolean)
}

function analyzeByCategory(predictions) {
  const resolved = predictions.filter(
    (p) => p.resolved && (p.status === 'correct' || p.status === 'incorrect')
  )

  if (resolved.length === 0) return []

  const byCategory = {}
  resolved.forEach((p) => {
    const cats = p.categories || ['uncategorized']
    cats.forEach((cat) => {
      if (!byCategory[cat]) {
        byCategory[cat] = { total: 0, correct: 0 }
      }
      byCategory[cat].total++
      if (p.status === 'correct') byCategory[cat].correct++
    })
  })

  return Object.entries(byCategory)
    .map(([category, stats]) => ({
      category,
      total: stats.total,
      correct: stats.correct,
      accuracy: Math.round((stats.correct / stats.total) * 100),
    }))
    .sort((a, b) => b.total - a.total)
}

async function main() {
  try {
    console.log('Running calibration analysis...\n')

    const predictions = await loadPredictions()
    console.log(`Loaded ${predictions.length} predictions from markdown files`)

    const resolved = predictions.filter((p) => p.resolved)
    const correct = predictions.filter((p) => p.status === 'correct')
    const incorrect = predictions.filter((p) => p.status === 'incorrect')
    const brierScore = calculateBrierScore(predictions)
    const calibration = calculateCalibration(predictions)
    const byCategory = analyzeByCategory(predictions)

    const analysis = {
      generated_at: new Date().toISOString(),
      summary: {
        total_predictions: predictions.length,
        resolved: resolved.length,
        pending: predictions.length - resolved.length,
        correct: correct.length,
        incorrect: incorrect.length,
        accuracy:
          resolved.length > 0
            ? Math.round((correct.length / resolved.length) * 100)
            : null,
      },
      brier_score: brierScore ? Math.round(brierScore * 1000) / 1000 : null,
      calibration,
      by_category: byCategory,
    }

    const outputPath = join(
      __dirname,
      '..',
      'data',
      'calibration-analysis.json'
    )
    await writeFile(outputPath, JSON.stringify(analysis, null, 2))

    // Print summary
    console.log(`\nTotal: ${analysis.summary.total_predictions}`)
    console.log(`Resolved: ${analysis.summary.resolved}`)
    console.log(`Correct: ${analysis.summary.correct}`)
    console.log(`Incorrect: ${analysis.summary.incorrect}`)
    console.log(`Pending: ${analysis.summary.pending}`)

    if (analysis.summary.accuracy !== null) {
      console.log(`Accuracy: ${analysis.summary.accuracy}%`)
    }

    if (brierScore !== null) {
      const quality =
        brierScore < 0.2
          ? '(excellent)'
          : brierScore < 0.25
            ? '(good)'
            : '(needs work)'
      console.log(`Brier Score: ${brierScore.toFixed(3)} ${quality}`)
    }

    if (calibration.length > 0) {
      console.log('\nCalibration:')
      calibration.forEach((bucket) => {
        const delta = bucket.delta >= 0 ? `+${bucket.delta}` : bucket.delta
        console.log(
          `  ${bucket.label}: ${bucket.accuracy}% actual (expected ${bucket.expected}%, ${delta}pp) [n=${bucket.count}]`
        )
      })
    }

    console.log(`\nSaved to data/calibration-analysis.json`)
  } catch (error) {
    console.error('Error:', error)
    process.exit(1)
  }
}

main()
