#!/usr/bin/env node
/**
 * Calibration Analysis for Predictions
 *
 * Analyzes all resolved predictions and calculates:
 * - Brier score (lower is better, 0 = perfect)
 * - Calibration by confidence bucket
 * - Performance vs Kalshi markets
 * - Prediction update patterns
 *
 * Run: node scripts/calibration-analysis.mjs
 * Output: data/calibration-analysis.json
 */

import { readFile, writeFile } from 'fs/promises'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

/**
 * Calculate Brier score for a set of predictions
 * Brier score = average of (prediction - outcome)^2
 * Range: 0 (perfect) to 1 (worst)
 * < 0.25 = good, < 0.20 = excellent
 */
function calculateBrierScore(predictions) {
  const resolved = predictions.filter(p =>
    p.resolved &&
    (p.status === 'correct' || p.status === 'incorrect') &&
    typeof p.confidence === 'number'
  )

  if (resolved.length === 0) return null

  const scores = resolved.map(p => {
    const predicted = p.confidence / 100 // Convert to 0-1
    const outcome = p.status === 'correct' ? 1 : 0
    return Math.pow(predicted - outcome, 2)
  })

  return scores.reduce((sum, s) => sum + s, 0) / scores.length
}

/**
 * Group predictions into calibration buckets
 * e.g., "Did my 70-79% predictions actually happen 70-79% of the time?"
 */
function calculateCalibration(predictions) {
  const resolved = predictions.filter(p =>
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
    { min: 90, max: 100, label: '90-100%' }
  ]

  return buckets.map(bucket => {
    const inBucket = resolved.filter(p =>
      p.confidence >= bucket.min && p.confidence <= bucket.max
    )

    if (inBucket.length === 0) return null

    const correct = inBucket.filter(p => p.status === 'correct').length
    const accuracy = correct / inBucket.length
    const expectedMidpoint = (bucket.min + bucket.max) / 2 / 100

    return {
      ...bucket,
      count: inBucket.length,
      correct,
      accuracy: Math.round(accuracy * 100),
      expected: Math.round(expectedMidpoint * 100),
      delta: Math.round((accuracy - expectedMidpoint) * 100)
    }
  }).filter(Boolean)
}

/**
 * Analyze performance by category
 */
function analyzeByCategory(predictions) {
  const resolved = predictions.filter(p =>
    p.resolved &&
    (p.status === 'correct' || p.status === 'incorrect')
  )

  if (resolved.length === 0) return []

  // Group by category
  const byCategory = {}
  resolved.forEach(p => {
    const cats = p.categories || ['uncategorized']
    cats.forEach(cat => {
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
      accuracy: Math.round((stats.correct / stats.total) * 100)
    }))
    .sort((a, b) => b.total - a.total)
}

/**
 * Analyze prediction updates
 */
function analyzeUpdates(predictions) {
  const withUpdates = predictions.filter(p =>
    p.updates && p.updates.length > 0
  )

  if (withUpdates.length === 0) return null

  const updateCounts = withUpdates.map(p => p.updates.length)
  const totalUpdates = updateCounts.reduce((sum, c) => sum + c, 0)
  const avgUpdates = totalUpdates / withUpdates.length

  // Analyze confidence changes
  const confidenceDeltas = []
  withUpdates.forEach(p => {
    p.updates.forEach(update => {
      if (update.confidenceBefore && update.confidenceAfter) {
        confidenceDeltas.push(update.confidenceAfter - update.confidenceBefore)
      }
    })
  })

  const avgDelta = confidenceDeltas.length > 0
    ? confidenceDeltas.reduce((sum, d) => sum + d, 0) / confidenceDeltas.length
    : 0

  return {
    predictionsWithUpdates: withUpdates.length,
    totalUpdates,
    avgUpdatesPerPrediction: Math.round(avgUpdates * 10) / 10,
    avgConfidenceChange: Math.round(avgDelta * 10) / 10
  }
}

/**
 * Compare to market baseline (Kalshi positions)
 */
function compareToMarket(predictions, kalshiData) {
  // Find predictions that have corresponding Kalshi positions
  const withMarket = predictions.filter(p =>
    p.resolved &&
    (p.status === 'correct' || p.status === 'incorrect') &&
    p.market?.ticker &&
    kalshiData?.commentaries?.[p.market.ticker]
  )

  if (withMarket.length === 0) return null

  // Calculate accuracy for predictions where you disagreed with market
  const disagreements = withMarket.filter(p => {
    const marketProb = kalshiData.commentaries[p.market.ticker]?.market_comparison?.kalshi_price
    const yourProb = p.confidence / 100
    return marketProb && Math.abs(yourProb - marketProb) > 0.1 // >10% diff
  })

  if (disagreements.length === 0) return null

  const correctDisagreements = disagreements.filter(p => p.status === 'correct').length

  return {
    total: withMarket.length,
    disagreements: disagreements.length,
    correctWhenDisagreed: correctDisagreements,
    accuracyWhenDisagreed: Math.round((correctDisagreements / disagreements.length) * 100)
  }
}

async function main() {
  try {
    console.log('📊 Running calibration analysis...\n')

    // Load predictions
    const predictionsPath = join(__dirname, '..', 'public', 'data', 'predictions.json')
    let predictions = []
    try {
      const data = await readFile(predictionsPath, 'utf-8')
      predictions = JSON.parse(data)
      console.log(`✓ Loaded ${predictions.length} predictions`)
    } catch (error) {
      console.error('⚠️  Could not load predictions.json, using empty set')
    }

    // Load Kalshi data if available
    let kalshiData = null
    try {
      const response = await fetch('http://localhost:3006/api/kalshi')
      kalshiData = await response.json()
      console.log(`✓ Loaded Kalshi data (${kalshiData.positions?.length || 0} positions)`)
    } catch (error) {
      console.log('⚠️  Could not fetch Kalshi data (server may not be running)')
    }

    // Calculate metrics
    const resolved = predictions.filter(p => p.resolved)
    const brierScore = calculateBrierScore(predictions)
    const calibration = calculateCalibration(predictions)
    const byCategory = analyzeByCategory(predictions)
    const updateAnalysis = analyzeUpdates(predictions)
    const marketComparison = compareToMarket(predictions, kalshiData)

    const analysis = {
      generated_at: new Date().toISOString(),
      summary: {
        total_predictions: predictions.length,
        resolved: resolved.length,
        pending: predictions.length - resolved.length,
        correct: predictions.filter(p => p.status === 'correct').length,
        incorrect: predictions.filter(p => p.status === 'incorrect').length,
        accuracy: resolved.length > 0
          ? Math.round((predictions.filter(p => p.status === 'correct').length / resolved.length) * 100)
          : null
      },
      brier_score: brierScore ? Math.round(brierScore * 1000) / 1000 : null,
      calibration: calibration,
      by_category: byCategory,
      update_analysis: updateAnalysis,
      market_comparison: marketComparison
    }

    // Save results
    const outputPath = join(__dirname, '..', 'data', 'calibration-analysis.json')
    await writeFile(outputPath, JSON.stringify(analysis, null, 2))

    // Print summary
    console.log('\n📈 Analysis Complete:\n')
    console.log(`Total Predictions: ${analysis.summary.total_predictions}`)
    console.log(`Resolved: ${analysis.summary.resolved}`)
    if (analysis.summary.accuracy !== null) {
      console.log(`Accuracy: ${analysis.summary.accuracy}%`)
    }
    if (brierScore !== null) {
      console.log(`Brier Score: ${brierScore.toFixed(3)} ${brierScore < 0.20 ? '(excellent)' : brierScore < 0.25 ? '(good)' : '(needs work)'}`)
    }

    if (calibration.length > 0) {
      console.log('\nCalibration:')
      calibration.forEach(bucket => {
        const delta = bucket.delta >= 0 ? `+${bucket.delta}` : bucket.delta
        console.log(`  ${bucket.label}: ${bucket.accuracy}% actual (expected ${bucket.expected}%, ${delta}pp) [n=${bucket.count}]`)
      })
    }

    console.log(`\n✓ Saved to data/calibration-analysis.json`)

  } catch (error) {
    console.error('Error:', error)
    process.exit(1)
  }
}

main()
