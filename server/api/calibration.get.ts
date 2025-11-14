/**
 * Calibration Analysis API Endpoint
 *
 * Serves pre-generated calibration analysis from data/calibration-analysis.json
 * Run `node scripts/calibration-analysis.mjs` to regenerate the analysis
 */

import { readFile } from 'fs/promises'
import { join } from 'path'

export default defineEventHandler(async (event) => {
  try {
    const dataPath = join(process.cwd(), 'data', 'calibration-analysis.json')
    const rawData = await readFile(dataPath, 'utf-8')
    const analysis = JSON.parse(rawData)

    return analysis
  } catch (error) {
    // If file doesn't exist or is invalid, return empty analysis
    console.warn('Calibration analysis file not found or invalid:', error)

    return {
      generated_at: null,
      summary: {
        total_predictions: 0,
        resolved: 0,
        pending: 0,
        correct: 0,
        incorrect: 0,
        accuracy: null
      },
      brier_score: null,
      calibration: [],
      by_category: [],
      update_analysis: null,
      market_comparison: null
    }
  }
})
