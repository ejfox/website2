import { defineEventHandler, createError, getMethod } from 'h3'
import { promises as fs } from 'fs'
import { join } from 'path'
import matter from 'gray-matter'
import type { Prediction } from '~/types/prediction'

const predictionsDir = join(process.cwd(), 'content/predictions')

// Load predictions from markdown files (handles both flat and year-based structure)
async function loadPredictions(): Promise<Prediction[]> {
  try {
    const predictions: Prediction[] = []

    // Read files in root directory
    const rootFiles = await fs.readdir(predictionsDir)

    for (const item of rootFiles) {
      const itemPath = join(predictionsDir, item)
      const stat = await fs.stat(itemPath)

      if (stat.isDirectory()) {
        // Handle year directories
        const yearFiles = await fs.readdir(itemPath)
        for (const file of yearFiles) {
          if (!file.endsWith('.md')) continue

          const filePath = join(itemPath, file)
          const prediction = await loadPredictionFromFile(
            filePath,
            `${item}/${file}`
          )
          if (prediction) predictions.push(prediction)
        }
      } else if (item.endsWith('.md') && item !== 'README.md') {
        // Handle files in root directory
        const prediction = await loadPredictionFromFile(itemPath, item)
        if (prediction) predictions.push(prediction)
      }
    }

    return predictions
  } catch (error) {
    console.error('Error loading predictions:', error)
    return []
  }
}

async function loadPredictionFromFile(
  filePath: string,
  fileIdentifier: string
): Promise<Prediction | null> {
  try {
    const content = await fs.readFile(filePath, 'utf-8')
    const { data, content: body } = matter(content)

    // Generate ID from file identifier
    const id = fileIdentifier.replace('.md', '').replace('/', '-')

    return {
      id,
      statement: data.statement,
      created: new Date(data.created),
      confidence: data.confidence,
      deadline: new Date(data.deadline),
      categories: data.categories || [],
      outcome: data.outcome
        ? {
            resolved: new Date(data.outcome.resolved),
            correct: data.outcome.correct,
            notes: data.outcome.notes || ''
          }
        : undefined,
      visibility: data.visibility || 'public',
      evidence: body.trim(),
      hash: data.hash || null,
      gitCommit: data.gitCommit || null,
      pgpSignature: data.pgpSignature || null,
      signed: data.signed || null,
      blockchainAnchor: data.blockchainAnchor || null
    }
  } catch (error) {
    console.error(`Error loading prediction from ${filePath}:`, error)
    return null
  }
}

export default defineEventHandler(async (event) => {
  const method = getMethod(event)

  if (method === 'GET') {
    return await loadPredictions()
  }

  throw createError({
    statusCode: 405,
    statusMessage: 'Method not allowed'
  })
})
