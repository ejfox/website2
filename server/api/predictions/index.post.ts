import type { Prediction, CreatePredictionInput } from '~/types/prediction'
import { readFile, writeFile } from 'fs/promises'
import { join } from 'path'
import { nanoid } from 'nanoid'

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

export default defineEventHandler(async (event) => {
  await ensurePredictionsFile()

  try {
    const body = await readBody<CreatePredictionInput>(event)
    
    // Validate input
    if (!body.statement || !body.deadline || body.confidence === undefined) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Missing required fields'
      })
    }

    // Create new prediction
    const newPrediction: Prediction = {
      id: nanoid(),
      statement: body.statement,
      confidence: body.confidence,
      deadline: body.deadline,
      categories: body.categories || [],
      evidence: body.evidence,
      visibility: body.visibility || 'public',
      created: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    }

    // Read existing predictions
    const fileContent = await readFile(PREDICTIONS_FILE, 'utf-8')
    const data: PredictionsData = JSON.parse(fileContent)
    
    // Add new prediction
    data.predictions.unshift(newPrediction)
    
    // Save to file
    await writeFile(PREDICTIONS_FILE, JSON.stringify(data, null, 2))
    
    return {
      prediction: newPrediction
    }
  } catch (error) {
    console.error('Error creating prediction:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to create prediction'
    })
  }
})