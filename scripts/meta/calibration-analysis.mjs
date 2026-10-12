#!/usr/bin/env node
/**
 * Calibration Analysis for Predictions
 *
 * Reads prediction markdown files directly and calculates:
 * - Brier score (lower is better, 0 = perfect), on two bases:
 *     as signed  = the confidence each prediction was published with
 *     as updated = the last logged change (current `confidence`)
 * - Calibration by confidence bucket, on both bases
 * - Category breakdown
 *
 * Run: yarn calibrate
 * Output: data/calibration-analysis.json
 */

import { readFile, writeFile, readdir } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import matter from 'gray-matter'
import {
  BASES,
  brierScore,
  calibrationBuckets,
  round3,
} from '../utils/brier.mjs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = join(dirname(__filename), '..')

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
    const brier = {}
    const calibrationBy = {}
    for (const [basis, confOf] of Object.entries(BASES)) {
      brier[basis] = round3(brierScore(predictions, confOf))
      calibrationBy[basis] = calibrationBuckets(predictions, confOf)
    }
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
      // as_signed: confidence at publication; as_updated: last logged change
      brier,
      calibration_as_signed: calibrationBy.as_signed,
      calibration_as_updated: calibrationBy.as_updated,
      // Legacy keys, as updated (what they always meant: current confidence)
      brier_score: brier.as_updated,
      calibration: calibrationBy.as_updated,
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

    const quality = (score) =>
      score < 0.2 ? '(excellent)' : score < 0.25 ? '(good)' : '(needs work)'
    const LABELS = { as_signed: 'as signed', as_updated: 'as updated' }

    for (const [basis, label] of Object.entries(LABELS)) {
      if (typeof brier[basis] === 'number') {
        console.log(
          `Brier ${label.padEnd(10)}: ${brier[basis].toFixed(3)} ${quality(brier[basis])}`
        )
      }
    }

    for (const [basis, label] of Object.entries(LABELS)) {
      if (calibrationBy[basis].length === 0) continue
      console.log(`\nCalibration (${label}):`)
      calibrationBy[basis].forEach((bucket) => {
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
