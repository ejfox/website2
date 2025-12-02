/**
 * /api/blogroll
 *
 * Parses newsboat RSS feeds and returns as JSON.
 * Your reading list, machine-readable.
 */

import { promises as fs } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'

export default defineEventHandler(async () => {
  try {
    const newsboatPath = join(homedir(), '.newsboat', 'urls')
    const content = await fs.readFile(newsboatPath, 'utf-8')

    const feeds: any[] = []
    const lines = content
      .split('\n')
      .filter((line) => line.trim() && !line.startsWith('#'))

    for (const line of lines) {
      // Format: URL "Feed Name" "Category"
      const match = line.match(/^(\S+)\s+"([^"]+)"(?:\s+"([^"]+)")?/)
      if (match) {
        const [, url, name, category] = match
        feeds.push({
          url,
          name,
          category: category || 'Uncategorized',
          // Try to extract domain for display
          domain: new URL(url).hostname.replace('www.', ''),
        })
      }
    }

    // Group by category
    const byCategory = feeds.reduce((acc: any, feed) => {
      if (!acc[feed.category]) {
        acc[feed.category] = []
      }
      acc[feed.category].push(feed)
      return acc
    }, {})

    // Calculate stats
    const stats = {
      total: feeds.length,
      categories: Object.keys(byCategory).length,
      byCategoryCount: Object.entries(byCategory).reduce(
        (acc: any, [cat, feeds]: [string, any]) => {
          acc[cat] = feeds.length
          return acc
        },
        {}
      ),
    }

    return {
      meta: {
        endpoint: '/api/blogroll',
        timestamp: new Date().toISOString(),
        source: 'newsboat',
        stats,
      },
      feeds,
      byCategory,
    }
  } catch (error: any) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to read newsboat feeds',
      message: error.message,
    })
  }
})
