#!/usr/bin/env node
/**
 * @file fetch-goodreads.mjs
 * @description Fetch Goodreads reading data from RSS feeds and generate comprehensive stats (books read, ratings, reading pace, top authors)
 * @usage node scripts/fetch-goodreads.mjs
 * @env None required - uses public Goodreads RSS feeds
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const outputDir = path.join(__dirname, '../content/processed')
const outputFile = path.join(outputDir, 'goodreads-stats.json')

const userId = '9273959'

async function fetchGoodreadsData() {
  console.info('📚 Fetching Goodreads data...')

  const shelves = ['currently-reading', 'read', 'to-read']
  const allBooks = []

  for (const shelf of shelves) {
    try {
      const baseUrl = 'https://www.goodreads.com/review/list_rss'
      const rssUrl = `${baseUrl}/${userId}?shelf=${shelf}&per_page=200`

      console.info(`  Fetching ${shelf}...`)

      const response = await fetch(rssUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36',
        },
      })

      const text = await response.text()

      // Parse RSS XML manually
      const itemMatches = text.match(/<item>([\s\S]*?)<\/item>/g) || []

      const books = itemMatches
        .map((itemXml) => {
          // Extract data using regex - Goodreads uses specific field names
          const titleMatch = itemXml.match(
            /<title><!\[CDATA\[(.*?)\]\]><\/title>/
          )
          const linkMatch = itemXml.match(/<link><!\[CDATA\[(.*?)\]\]><\/link>/)
          const pubDateMatch = itemXml.match(
            /<pubDate><!\[CDATA\[(.*?)\]\]><\/pubDate>/
          )
          const authorMatch = itemXml.match(/<author_name>(.*?)<\/author_name>/)
          const ratingMatch = itemXml.match(/<user_rating>(\d+)<\/user_rating>/)
          const coverPattern =
            '<book_large_image_url><!\\[CDATA\\[' +
            '(.*?)\\]\\]><\\/book_large_image_url>'

          const coverMatch = itemXml.match(new RegExp(coverPattern))
          const bookIdMatch = itemXml.match(/<book_id>(\d+)<\/book_id>/)
          const dateAddedMatch = itemXml.match(
            /<user_date_added><!\[CDATA\[(.*?)\]\]><\/user_date_added>/
          )
          const dateReadMatch = itemXml.match(
            /<user_date_created><!\[CDATA\[(.*?)\]\]><\/user_date_created>/
          )
          const numPagesMatch = itemXml.match(/<num_pages>(\d+)<\/num_pages>/)
          const pubYearMatch = itemXml.match(/<book_published>(\d{4})/)

          const title = titleMatch ? titleMatch[1].trim() : ''
          const author = authorMatch ? authorMatch[1].trim() : ''
          const rating = ratingMatch ? Number.parseInt(ratingMatch[1]) : null
          const link = linkMatch ? linkMatch[1] : ''
          const cover = coverMatch ? coverMatch[1] : null
          const bookId = bookIdMatch ? bookIdMatch[1] : ''
          const pubDate = pubDateMatch ? pubDateMatch[1] : ''
          const dateAdded = dateAddedMatch ? dateAddedMatch[1] : pubDate
          const dateRead = dateReadMatch ? dateReadMatch[1] : null
          const numPages = numPagesMatch ? Number.parseInt(numPagesMatch[1]) : 0
          const pubYear = pubYearMatch ? Number.parseInt(pubYearMatch[1]) : null

          return {
            title,
            author,
            rating: rating && rating > 0 ? rating : null,
            shelf,
            link,
            cover,
            dateAdded: new Date(dateAdded).toISOString(),
            dateRead: dateRead ? new Date(dateRead).toISOString() : null,
            bookId,
            numPages,
            pubYear,
          }
        })
        .filter((book) => book.title)

      allBooks.push(...books)
      console.info(`  ✓ Fetched ${books.length} books from ${shelf}`)
    } catch (error) {
      console.warn(`  ✗ Failed to fetch ${shelf}:`, error.message)
    }
  }

  // Separate books by shelf
  const currentlyReading = allBooks.filter(
    (b) => b.shelf === 'currently-reading'
  )
  const read = allBooks.filter((b) => b.shelf === 'read')
  const toRead = allBooks.filter((b) => b.shelf === 'to-read')

  // Calculate stats
  const thisYear = new Date().getFullYear()
  const booksThisYear = read.filter(
    (b) => new Date(b.dateAdded).getFullYear() === thisYear
  )

  const thisMonth = new Date().getMonth()
  const booksThisMonth = read.filter((book) => {
    const bookDate = new Date(book.dateAdded)
    return (
      bookDate.getFullYear() === thisYear && bookDate.getMonth() === thisMonth
    )
  })

  const ratedBooks = read.filter((book) => book.rating && book.rating > 0)
  const averageRating =
    ratedBooks.length > 0
      ? ratedBooks.reduce((sum, book) => sum + (book.rating || 0), 0) /
        ratedBooks.length
      : 0

  // Rating distribution
  const ratingDistribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
  ratedBooks.forEach((book) => {
    if (book.rating) ratingDistribution[book.rating]++
  })

  // Top rated books
  const topRatedBooks = read
    .filter((book) => book.rating === 5)
    .sort(
      (a, b) =>
        new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime()
    )
    .slice(0, 15)

  // Recent reads
  const recentReads = read
    .sort(
      (a, b) =>
        new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime()
    )
    .slice(0, 15)

  // Reading by month
  const readingByMonth = read.reduce((acc, book) => {
    const date = new Date(book.dateAdded)
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const monthKey = `${date.getFullYear()}-${month}`
    acc[monthKey] = (acc[monthKey] || 0) + 1
    return acc
  }, {})

  // Reading by year
  const readingByYear = read.reduce((acc, book) => {
    const year = new Date(book.dateAdded).getFullYear()
    acc[year] = (acc[year] || 0) + 1
    return acc
  }, {})

  // Pages read stats
  const totalPagesRead = read.reduce(
    (sum, book) => sum + (book.numPages || 0),
    0
  )
  const avgPagesPerBook =
    read.length > 0 ? Math.round(totalPagesRead / read.length) : 0

  // Author stats
  const authorMap = {}
  read.forEach((book) => {
    authorMap[book.author] = (authorMap[book.author] || 0) + 1
  })
  const topAuthors = Object.entries(authorMap)
    .map(([author, count]) => ({ author, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)

  const stats = {
    totalRead: read.length,
    currentlyReading: currentlyReading.length,
    toRead: toRead.length,
    thisYear: booksThisYear.length,
    thisMonth: booksThisMonth.length,
    averageRating: Math.round(averageRating * 10) / 10,
    ratingDistribution,
    totalPagesRead,
    avgPagesPerBook,
    topAuthors,
    readingByMonth,
    readingByYear,
    topRatedBooks,
    recentReads,
    profileUrl: `https://www.goodreads.com/user/show/${userId}`,
  }

  const output = {
    books: {
      currentlyReading,
      read: recentReads,
      toRead: toRead.slice(0, 30),
    },
    stats,
    lastUpdated: new Date().toISOString(),
  }

  // Ensure output directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true })
  }

  // Write to file
  fs.writeFileSync(outputFile, JSON.stringify(output, null, 2))
  console.info(
    `✅ Goodreads data saved to ${path.relative(process.cwd(), outputFile)}`
  )

  return output
}

// Run it
fetchGoodreadsData().catch((error) => {
  console.error('❌ Error fetching Goodreads data:', error)
  process.exit(1)
})
