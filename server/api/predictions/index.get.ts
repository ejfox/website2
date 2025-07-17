import type { Prediction, PredictionStats } from '~/types/prediction'
import { readFile, writeFile } from 'fs/promises'
import { join } from 'path'

const PREDICTIONS_FILE = join(process.cwd(), 'data/predictions.json')

interface PredictionsData {
  predictions: Prediction[]
}

// Helper to ensure file exists
async function ensurePredictionsFile(): Promise<void> {
  try {
    await readFile(PREDICTIONS_FILE)
  } catch (_error) {
    // File doesn't exist, create it with empty data
    const emptyData: PredictionsData = { predictions: [] }
    await writeFile(PREDICTIONS_FILE, JSON.stringify(emptyData, null, 2))
  }
}

// Calculate Brier score for predictions
function calculateBrierScore(predictions: Prediction[]): number {
  const resolvedPredictions = predictions.filter(p => p.resolvedAt)
  if (resolvedPredictions.length === 0) return 0

  const squaredDiffs = resolvedPredictions.map(p => {
    const probability = p.confidence / 100
    const outcome = p.resolution ? 1 : 0
    return Math.pow(probability - outcome, 2)
  })

  return squaredDiffs.reduce((sum, diff) => sum + diff, 0) / resolvedPredictions.length
}

export default defineEventHandler(async () => {
  await ensurePredictionsFile()

  try {
    const fileContent = await readFile(PREDICTIONS_FILE, 'utf-8')
    const data: PredictionsData = JSON.parse(fileContent)
    
    // Calculate stats
    const resolved = data.predictions.filter(p => p.resolvedAt)
    const correct = resolved.filter(p => p.resolution === true)
    const incorrect = resolved.filter(p => p.resolution === false)
    const pending = data.predictions.filter(p => !p.resolvedAt)

    // Calculate category counts
    const categoryCounts: Record<string, number> = {}
    data.predictions.forEach(p => {
      p.categories.forEach(cat => {
        categoryCounts[cat] = (categoryCounts[cat] || 0) + 1
      })
    })

    // Calculate confidence buckets
    const confidenceBuckets = {
      low: data.predictions.filter(p => p.confidence <= 33).length,
      medium: data.predictions.filter(p => p.confidence > 33 && p.confidence <= 66).length,
      high: data.predictions.filter(p => p.confidence > 66).length
    }

    const stats: PredictionStats = {
      total: data.predictions.length,
      resolved: resolved.length,
      correct: correct.length,
      incorrect: incorrect.length,
      pending: pending.length,
      accuracy: resolved.length > 0 ? (correct.length / resolved.length) : 0,
      brierScore: calculateBrierScore(data.predictions),
      categoryCounts,
      confidenceBuckets
    }

    return {
      predictions: data.predictions.sort((a, b) => 
        new Date(b.createdAt || b.created).getTime() - new Date(a.createdAt || a.created).getTime()
      ),
      stats
    }
  } catch (error) {
    console.error('Error reading predictions:', error)
    return {
      predictions: [],
      stats: {
        total: 0,
        resolved: 0,
        correct: 0,
        incorrect: 0,
        pending: 0,
        accuracy: 0,
        brierScore: 0,
        categoryCounts: {},
        confidenceBuckets: { low: 0, medium: 0, high: 0 }
      }
    }
  }
})