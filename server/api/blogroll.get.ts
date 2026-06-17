/**
 * @file blogroll.get.ts
 * @description Parses newsboat RSS feeds from ~/.newsboat/urls and returns categorized feed list
 * @endpoint GET /api/blogroll
 * @returns RSS feeds grouped by category with stats including total count and category distribution
 */

import { promises as fs } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'

interface Feed {
  url: string
  name: string
  category: string
  domain: string
}

// Build-time snapshot lives in data/blogroll.urls; fall back to local newsboat
// config in dev so changes to the running list don't require a rebuild.
async function readBlogrollFile(): Promise<string> {
  const bundled = join(process.cwd(), 'data', 'blogroll.urls')
  try {
    return await fs.readFile(bundled, 'utf-8')
  } catch {
    const home = join(homedir(), '.newsboat', 'urls')
    return await fs.readFile(home, 'utf-8')
  }
}

export default defineEventHandler(async () => {
  try {
    const content = await readBlogrollFile()

    const feeds: Feed[] = []
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
    const byCategory = feeds.reduce((acc: Record<string, Feed[]>, feed) => {
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
        (acc: Record<string, number>, [cat, catFeeds]) => {
          acc[cat] = (catFeeds as Feed[]).length
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
  } catch (error) {
    const err = error as Error
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to read newsboat feeds',
      message: err.message,
    })
  }
})
