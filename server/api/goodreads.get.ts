/**
 * @file goodreads.get.ts
 * @description Serves pre-processed Goodreads reading data from build-time cached JSON file
 * @endpoint GET /api/goodreads
 * @returns Goodreads data with book lists (currently reading, read, to-read), stats (total read, ratings, pages), and reading trends
 */
import fs from 'node:fs'
import path from 'node:path'

export default defineEventHandler(async () => {
  try {
    const dataPath = path.join(
      process.cwd(),
      'content/processed/goodreads-stats.json'
    )

    if (fs.existsSync(dataPath)) {
      const data = JSON.parse(fs.readFileSync(dataPath, 'utf-8'))
      return data
    }

    // Fallback if file doesn't exist yet
    return {
      books: {
        currentlyReading: [],
        read: [],
        toRead: [],
      },
      stats: {
        totalRead: 0,
        currentlyReading: 0,
        toRead: 0,
        thisYear: 0,
        thisMonth: 0,
        averageRating: 0,
        ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
        totalPagesRead: 0,
        avgPagesPerBook: 0,
        topAuthors: [],
        readingByMonth: {},
        readingByYear: {},
        topRatedBooks: [],
        recentReads: [],
        profileUrl: 'https://www.goodreads.com/user/show/9273959',
      },
      lastUpdated: new Date().toISOString(),
      note: 'Run "yarn goodreads:fetch" to update data',
    }
  } catch (error) {
    console.error('Error reading Goodreads cache:', error)
    return {
      error: 'Failed to load Goodreads data',
      books: { currentlyReading: [], read: [], toRead: [] },
      stats: {
        totalRead: 0,
        currentlyReading: 0,
        toRead: 0,
        thisYear: 0,
        thisMonth: 0,
        averageRating: 0,
        ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
        totalPagesRead: 0,
        avgPagesPerBook: 0,
        topAuthors: [],
        readingByMonth: {},
        readingByYear: {},
        topRatedBooks: [],
        recentReads: [],
        profileUrl: 'https://www.goodreads.com/user/show/9273959',
      },
    }
  }
})
