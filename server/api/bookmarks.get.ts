/**
 * @file bookmarks.get.ts
 * @description Fetches bookmarks from Pinboard API with optional tag filtering and count limiting
 * @endpoint GET /api/bookmarks
 * @params count: number - Number of bookmarks to fetch (default: 300, max: 1000), tag: string - Filter by tag (defaults to !news)
 * @returns Processed Pinboard bookmarks with tags, titles, descriptions, and read status
 */
import { defineEventHandler, getQuery } from 'h3'

interface PinboardBookmark {
  href: string
  description: string
  extended: string
  meta: string
  hash: string
  time: string
  shared: string
  toread: string
  tags: string
}

interface ProcessedBookmark {
  url: string
  title: string
  description: string
  tags: string[]
  time: string
  shared: boolean
  toread: boolean
  hash: string
}

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event)
    const parsedCount = Number.parseInt(query.count as string) || 300
    const count = Math.min(parsedCount, 1000) // Max 1000, default 300
    const tag = query.tag as string // Optional tag filter

    const pinboardToken =
      process.env.PINBOARD_TOKEN || 'ejfox:6BCADA7AD389C5F5D7CE'

    // Build Pinboard API URL
    const baseUrl = 'https://api.pinboard.in/v1/posts/all'
    let apiUrl =
      `${baseUrl}?auth_token=${pinboardToken}` + `&format=json&results=${count}`
    if (tag) {
      apiUrl += `&tag=${encodeURIComponent(tag)}`
    }

    // Fetch from Pinboard API
    const response = await fetch(apiUrl, {
      headers: {
        'User-Agent': 'ejfox.com/bookmarks-api',
      },
    })

    if (!response.ok) {
      throw new Error(`Pinboard API error: ${response.status}`)
    }

    const bookmarks: PinboardBookmark[] = await response.json()

    // Process bookmarks into cleaner format
    const processedBookmarks: ProcessedBookmark[] = bookmarks.map(
      (bookmark) => ({
        url: bookmark.href,
        title: bookmark.description,
        description: bookmark.extended,
        tags: bookmark.tags.split(' ').filter((tag) => tag.length > 0),
        time: bookmark.time,
        shared: bookmark.shared === 'yes',
        toread: bookmark.toread === 'yes',
        hash: bookmark.hash,
      })
    )

    // Filter by !news tag if no specific tag requested (for ejfox-news)
    const newsBookmarks = tag
      ? processedBookmarks
      : processedBookmarks.filter((bookmark) => bookmark.tags.includes('!news'))

    return {
      bookmarks: newsBookmarks,
      count: newsBookmarks.length,
      total: processedBookmarks.length,
      tag: tag || '!news',
      cached_at: new Date().toISOString(),
    }
  } catch (error: any) {
    console.error('Error fetching bookmarks:', error)

    // Return error response
    return {
      error: 'Failed to fetch bookmarks',
      message: error.message,
      bookmarks: [],
      count: 0,
    }
  }
})
