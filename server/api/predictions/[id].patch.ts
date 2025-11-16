import type { Prediction, UpdatePredictionInput } from '~/types/prediction'
import { readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { getRouterParam } from 'h3'

const PREDICTIONS_FILE = join(process.cwd(), 'data/predictions.json')

interface PredictionsData {
  predictions: Prediction[]
}

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Prediction ID required'
    })
  }

  try {
    const body = await readBody<Partial<UpdatePredictionInput>>(event)

    // Read existing predictions
    const fileContent = await readFile(PREDICTIONS_FILE, 'utf-8')
    const data: PredictionsData = JSON.parse(fileContent)

    // Find the prediction to update
    const predictionIndex = data.predictions.findIndex((p) => p.id === id)

    if (predictionIndex === -1) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Prediction not found'
      })
    }

    // Update the prediction
    const prediction = data.predictions[predictionIndex]!

    if (body.resolution !== undefined) {
      prediction.resolution = body.resolution
      prediction.resolvedAt = new Date()
    }

    if (body.notes !== undefined) {
      prediction.notes = body.notes
    }

    prediction.updatedAt = new Date()

    // Save to file
    await writeFile(PREDICTIONS_FILE, JSON.stringify(data, null, 2))

    return {
      prediction
    }
  } catch (error) {
    console.error('Error updating prediction:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to update prediction'
    })
  }
})
