import { promises as fs } from 'node:fs'
import { join } from 'node:path'
import matter from 'gray-matter'
import { glob } from 'glob'

export default defineEventHandler(async () => {
  try {
    const predictionsDir = join(process.cwd(), 'content', 'predictions')

    // Find all markdown files
    const files = await glob('**/*.md', { cwd: predictionsDir })

    const results = await Promise.allSettled(
      files.map(async (file) => {
        const filePath = join(predictionsDir, file)
        const content = await fs.readFile(filePath, 'utf-8')
        const { data, content: body } = matter(content)

        // Generate ID from filename
        const id = file.replace(/\.md$/, '').replace(/\//g, '-')

        return {
          id: data.id || id,
          slug: file.replace(/\.md$/, ''),
          statement: data.statement,
          confidence: data.confidence,
          deadline: data.deadline,
          categories: data.categories || [],
          visibility: data.visibility || 'public',
          created: data.created,
          resolved: data.resolved ?? false,
          resolved_date: data.resolved_date,
          status: data.status,
          evidence: body.trim(),
          resolution: data.resolution,
          related: data.related || [],
          updates: data.updates || [],
          updatedAt: data.updatedAt,
          market: data.market,
        }
      })
    )

    // Filter to fulfilled results only
    const predictions = results
      .filter((r) => r.status === 'fulfilled')
      .map((r) => r.value)

    return predictions
  } catch (error) {
    console.error('Error reading predictions:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to load predictions',
    })
  }
})
