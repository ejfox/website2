import {
  defineEventHandler,
  readBody,
  getRouterParam,
  createError,
  getMethod
} from 'h3'
import { promises as fs } from 'fs'
import { join } from 'path'
import matter from 'gray-matter'

const predictionsDir = join(process.cwd(), 'content/predictions')

async function findPredictionFile(id: string): Promise<string | null> {
  // Handle different ID formats
  // Could be: "ai-models-2025" (flat) or "2025-ai-adoption" (year-based)

  // Try flat structure first
  let filePath = join(predictionsDir, `${id}.md`)
  try {
    await fs.access(filePath)
    return filePath
  } catch {
    // File doesn't exist, try next location
  }

  // Try year-based structure
  if (id.includes('-')) {
    const parts = id.split('-')
    const year = parts[0]
    const filename = parts.slice(1).join('-') + '.md'

    // Try year/filename
    filePath = join(predictionsDir, year, filename)
    try {
      await fs.access(filePath)
      return filePath
    } catch {
      // File doesn't exist, try next location
    }

    // Try reconstructed filename
    filePath = join(predictionsDir, year, `${id.substring(5)}.md`)
    try {
      await fs.access(filePath)
      return filePath
    } catch {
      // File doesn't exist, continue to return null
    }
  }

  return null
}

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const method = getMethod(event)

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Prediction ID required'
    })
  }

  if (method === 'PATCH') {
    // Update a prediction (typically to resolve it)
    const body = await readBody(event)

    try {
      const filePath = await findPredictionFile(id)
      if (!filePath) {
        throw new Error('File not found')
      }

      const content = await fs.readFile(filePath, 'utf-8')
      const { data, content: markdownBody } = matter(content)

      // Update the frontmatter with the outcome
      if (body.outcome) {
        data.outcome = {
          resolved: body.outcome.resolved,
          correct: body.outcome.correct,
          notes: body.outcome.notes
        }
      }

      // Rebuild the markdown file
      const newContent = matter.stringify(markdownBody, data)
      await fs.writeFile(filePath, newContent)

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
        evidence: markdownBody.trim()
      }
    } catch (_error) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Prediction not found'
      })
    }
  }

  throw createError({
    statusCode: 405,
    statusMessage: 'Method not allowed'
  })
})
