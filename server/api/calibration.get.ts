/**
 * @file calibration.get.ts
 * @description GET /api/calibration. Pre-generated prediction calibration from
 *   data/calibration-analysis.json (regenerate with
 *   scripts/meta/calibration-analysis.mjs): Brier scores as signed (published
 *   confidence) and as updated (last logged change), accuracy, category breakdown,
 *   market comparison. Used by composables/useCalibration.ts.
 *   Never throws: a missing or bad file returns the same shape, zeroed/null.
 */

import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

export default defineEventHandler(async (_event) => {
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
        accuracy: null,
      },
      brier: { as_signed: null, as_updated: null },
      calibration_as_signed: [],
      calibration_as_updated: [],
      brier_score: null,
      calibration: [],
      by_category: [],
      update_analysis: null,
      market_comparison: null,
    }
  }
})
