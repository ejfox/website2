/**
 * @file robot/timeline.get.ts
 * @description Chronological aggregation of all life events including blog posts, predictions, prediction updates, and reading annotations
 * @endpoint GET /api/robot/timeline
 * @params from: string - Start date (YYYY-MM-DD), to: string - End date (YYYY-MM-DD), limit: number - Maximum events (default: 100)
 * @returns Sorted timeline events with stats grouped by type and year
 */

import { promises as fs } from 'node:fs'
import { join } from 'node:path'
import matter from 'gray-matter'
import { glob } from 'glob'

// Timeline event types
interface TimelineEvent {
  timestamp: string
  type:
    | 'post'
    | 'prediction'
    | 'prediction_update'
    | 'prediction_resolution'
    | 'reading'
  title: string
  description: string
  url: string
  tags?: string[]
  metadata: Record<string, unknown>
}

interface ManifestPost {
  slug: string
  title: string
  date: string
  description?: string
  tags?: string[]
  wordCount?: number
  readingTime?: number
  draft?: boolean
}

interface PredictionUpdate {
  timestamp: string
  reasoning: string
  confidenceBefore: number
  confidenceAfter: number
}

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const limit = Number.parseInt(query.limit as string) || 100
  const from = query.from as string
  const to = query.to as string

  const events: TimelineEvent[] = []

  // Get all blog posts
  try {
    const manifestPath = join(
      process.cwd(),
      'content/processed/manifest-lite.json'
    )
    const manifestContent = await fs.readFile(manifestPath, 'utf-8')
    const posts = JSON.parse(manifestContent)

    posts
      .filter((p: ManifestPost) => !p.draft && p.date)
      .forEach((post: ManifestPost) => {
        events.push({
          timestamp: post.date,
          type: 'post',
          title: post.title,
          description: post.description || '',
          url: `/blog/${post.slug}`,
          tags: post.tags || [],
          metadata: {
            wordCount: post.wordCount,
            readingTime: post.readingTime,
          },
        })
      })
  } catch {
    // Silent fail
  }

  // Get all predictions
  try {
    const predictionsDir = join(process.cwd(), 'content/predictions')
    const files = await glob('**/*.md', { cwd: predictionsDir })

    await Promise.allSettled(
      files.map(async (file) => {
        const filePath = join(predictionsDir, file)
        const content = await fs.readFile(filePath, 'utf-8')
        const { data } = matter(content)

        // Add prediction creation event
        events.push({
          timestamp: data.created,
          type: 'prediction',
          title: data.statement,
          description: `Predicted with ${data.confidence}% confidence`,
          url: `/predictions/${file.replace(/\.md$/, '')}`,
          metadata: {
            confidence: data.confidence,
            deadline: data.deadline,
            categories: data.categories || [],
            status: data.status,
          },
        })

        // Add prediction updates as events
        if (data.updates && data.updates.length > 0) {
          data.updates.forEach((update: PredictionUpdate) => {
            events.push({
              timestamp: update.timestamp,
              type: 'prediction_update',
              title: `Updated: ${data.statement}`,
              description: update.reasoning,
              url: `/predictions/${file.replace(/\.md$/, '')}`,
              metadata: {
                confidenceBefore: update.confidenceBefore,
                confidenceAfter: update.confidenceAfter,
              },
            })
          })
        }

        // Add resolution event if resolved
        if (data.resolved && data.resolved_date) {
          events.push({
            timestamp: data.resolved_date,
            type: 'prediction_resolution',
            title: `Resolved: ${data.statement}`,
            description: data.resolution || '',
            url: `/predictions/${file.replace(/\.md$/, '')}`,
            metadata: {
              status: data.status,
              originalConfidence: data.confidence,
            },
          })
        }
      })
    )
  } catch {
    // Silent fail
  }

  // Get reading annotations as events
  try {
    const readingDir = join(process.cwd(), 'content/processed/reading')
    const files = await fs.readdir(readingDir)

    await Promise.allSettled(
      files
        .filter((f) => f.endsWith('.json'))
        .map(async (file) => {
          const filePath = join(readingDir, file)
          const content = await fs.readFile(filePath, 'utf-8')
          const book = JSON.parse(content)

          const lastAnnotated =
            book.metadata?.['kindle-sync']?.lastAnnotatedDate
          if (lastAnnotated) {
            events.push({
              timestamp: lastAnnotated,
              type: 'reading',
              title: `Read: ${book.metadata['kindle-sync'].title}`,
              description: `by ${book.metadata['kindle-sync'].author}`,
              url: `/reading/${file.replace(/\.json$/, '')}`,
              metadata: {
                author: book.metadata['kindle-sync'].author,
                highlightsCount: book.metadata['kindle-sync'].highlightsCount,
              },
            })
          }
        })
    )
  } catch {
    // Silent fail
  }

  // Sort chronologically
  events.sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  )

  // Apply date filters
  let filteredEvents = events
  if (from) {
    const fromDate = new Date(from)
    filteredEvents = filteredEvents.filter(
      (e) => new Date(e.timestamp) >= fromDate
    )
  }
  if (to) {
    const toDate = new Date(to)
    filteredEvents = filteredEvents.filter(
      (e) => new Date(e.timestamp) <= toDate
    )
  }

  // Get date range (filter out invalid timestamps)
  const timestamps = filteredEvents
    .map((e) => new Date(e.timestamp).getTime())
    .filter((t) => !Number.isNaN(t))
  const earliest =
    timestamps.length > 0
      ? new Date(Math.min(...timestamps)).toISOString()
      : null
  const latest =
    timestamps.length > 0
      ? new Date(Math.max(...timestamps)).toISOString()
      : null

  return {
    meta: {
      endpoint: '/api/robot/timeline',
      timestamp: new Date().toISOString(),
      count: filteredEvents.slice(0, limit).length,
      totalEvents: events.length,
      dateRange: {
        earliest,
        latest,
        filters: { from, to },
      },
    },
    events: filteredEvents.slice(0, limit),
    stats: {
      byType: {
        posts: events.filter((e) => e.type === 'post').length,
        predictions: events.filter((e) => e.type === 'prediction').length,
        predictionUpdates: events.filter((e) => e.type === 'prediction_update')
          .length,
        predictionResolutions: events.filter(
          (e) => e.type === 'prediction_resolution'
        ).length,
        reading: events.filter((e) => e.type === 'reading').length,
      },
      byYear: events.reduce((acc: Record<number, number>, e) => {
        const year = new Date(e.timestamp).getFullYear()
        acc[year] = (acc[year] || 0) + 1
        return acc
      }, {}),
    },
  }
})
