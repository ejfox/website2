/**
 * /api/robot/mind
 *
 * Recent thoughts, intellectual output, and belief updates.
 * Optimized for AI agents to understand what I'm thinking about.
 */

import { promises as fs } from 'fs'
import { join } from 'path'
import matter from 'gray-matter'
import { glob } from 'glob'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const limit = parseInt(query.limit as string) || 10
  const type = (query.type as string) || 'all'

  const thoughts: any[] = []

  // Get recent blog posts
  if (type === 'all' || type === 'posts') {
    try {
      const manifestPath = join(process.cwd(), 'content/processed/manifest-lite.json')
      const manifestContent = await fs.readFile(manifestPath, 'utf-8')
      const posts = JSON.parse(manifestContent)

      posts
        .filter((p: any) => !p.draft && p.date)
        .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, limit)
        .forEach((post: any) => {
          thoughts.push({
            type: 'post',
            timestamp: post.date,
            title: post.title,
            slug: post.slug,
            excerpt: post.description || '',
            tags: post.tags || [],
            url: `/blog/${post.slug}`,
            wordCount: post.wordCount
          })
        })
    } catch (error) {
      // Silent fail if no posts
    }
  }

  // Get predictions
  if (type === 'all' || type === 'predictions') {
    try {
      const predictionsDir = join(process.cwd(), 'content/predictions')
      const files = await glob('**/*.md', { cwd: predictionsDir })

      const predictions = await Promise.all(
        files.map(async (file) => {
          const filePath = join(predictionsDir, file)
          const content = await fs.readFile(filePath, 'utf-8')
          const { data } = matter(content)

          return {
            type: 'prediction',
            timestamp: data.created,
            statement: data.statement,
            confidence: data.confidence,
            deadline: data.deadline,
            categories: data.categories || [],
            updates: data.updates || [],
            status: data.status,
            slug: file.replace(/\.md$/, ''),
            url: `/predictions/${file.replace(/\.md$/, '')}`
          }
        })
      )

      predictions
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, limit)
        .forEach(p => thoughts.push(p))

      // Also add prediction updates as separate thoughts
      if (type === 'all' || type === 'updates') {
        predictions.forEach(pred => {
          if (pred.updates && pred.updates.length > 0) {
            pred.updates.forEach((update: any) => {
              thoughts.push({
                type: 'prediction_update',
                timestamp: update.timestamp,
                statement: pred.statement,
                confidenceBefore: update.confidenceBefore,
                confidenceAfter: update.confidenceAfter,
                reasoning: update.reasoning,
                predictionSlug: pred.slug,
                url: `/predictions/${pred.slug}`
              })
            })
          }
        })
      }
    } catch (error) {
      // Silent fail if no predictions
    }
  }

  // Sort all thoughts by timestamp
  thoughts.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

  return {
    meta: {
      endpoint: '/api/robot/mind',
      timestamp: new Date().toISOString(),
      count: thoughts.slice(0, limit).length,
      filters: { type, limit }
    },
    thoughts: thoughts.slice(0, limit),
    stats: {
      totalPosts: thoughts.filter(t => t.type === 'post').length,
      totalPredictions: thoughts.filter(t => t.type === 'prediction').length,
      totalUpdates: thoughts.filter(t => t.type === 'prediction_update').length
    }
  }
})
