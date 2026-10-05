/**
 * @file predictions.get.ts
 * @description Parses all prediction markdown files from content/predictions/ with frontmatter metadata
 * @endpoint GET /api/predictions
 * @returns Array of prediction objects with statement, confidence, deadline, resolution status, and evidence
 */
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
          // Provenance that is actually checkable today: the public commit that
          // recorded the prediction (GitHub shows its timestamp and contents).
          // NOT exposed, deliberately:
          // - `hash`: as of 2026-10-05, 0 of 15 stored SHA-256s reproduce from the
          //   committed file (predict-pro.mjs hashes a gray-matter re-serialization,
          //   which drifts). A hash nobody can reproduce isn't proof.
          // - `signed`: only a timestamp; no PGP signature exists anywhere.
          // TODO: a reproducible hash recipe + real signatures (EJ's signing subkey).
          gitCommit: data.gitCommit,
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
