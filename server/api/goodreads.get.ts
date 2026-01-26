/**
 * @file goodreads.get.ts
 * @description Fetches Goodreads reading data via RSS feed parsing to extract books, ratings, and reading statistics
 * @endpoint GET /api/goodreads
 * @returns Book data with currently reading, recently read, ratings, and calculated statistics
 */

interface GoodreadsBook {
  id: string
  title: string
  author: string
  rating: number | null
  averageRating: number | null
  numPages: number | null
  dateRead: string | null
  dateAdded: string | null
  shelf: string
  imageUrl: string | null
  goodreadsUrl: string
}

interface GoodreadsStats {
  totalRead: number
  booksThisYear: number
  booksThisMonth: number
  averageRating: number
  pagesReadThisYear: number
  currentlyReading: number
  profileUrl: string
}

// Strip CDATA wrappers from a string
function stripCdata(str: string | null): string | null {
  if (!str) return null
  return str.replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1').trim()
}

function parseRssFeed(xml: string, shelf: string): GoodreadsBook[] {
  const books: GoodreadsBook[] = []
  const itemPattern = /<item>([\s\S]*?)<\/item>/g
  let itemMatch

  while ((itemMatch = itemPattern.exec(xml)) !== null) {
    const itemXml = itemMatch[1]

    try {
      // Handle both CDATA-wrapped and plain titles
      const titleMatch =
        itemXml.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/) ||
        itemXml.match(/<title>(.*?)<\/title>/)
      const bookIdMatch = itemXml.match(/<book_id>(.*?)<\/book_id>/)
      const authorMatch = itemXml.match(/<author_name>(.*?)<\/author_name>/)
      const userRatingMatch = itemXml.match(/<user_rating>(.*?)<\/user_rating>/)
      const avgRatingMatch = itemXml.match(
        /<average_rating>(.*?)<\/average_rating>/
      )
      const numPagesMatch = itemXml.match(/<num_pages>(.*?)<\/num_pages>/)
      const readAtMatch = itemXml.match(/<user_read_at>(.*?)<\/user_read_at>/)
      const dateAddedMatch = itemXml.match(
        /<user_date_added>(.*?)<\/user_date_added>/
      )
      const imageMatch = itemXml.match(
        /<book_medium_image_url>(.*?)<\/book_medium_image_url>/
      )
      const linkMatch = itemXml.match(/<link>(.*?)<\/link>/)

      const userRating = userRatingMatch
        ? Number.parseInt(userRatingMatch[1])
        : null
      const avgRating = avgRatingMatch
        ? Number.parseFloat(avgRatingMatch[1])
        : null
      const numPages = numPagesMatch ? Number.parseInt(numPagesMatch[1]) : null

      books.push({
        id: bookIdMatch ? bookIdMatch[1] : '',
        title: titleMatch ? titleMatch[1] : '',
        author: authorMatch ? authorMatch[1] : '',
        rating: userRating && userRating > 0 ? userRating : null,
        averageRating: avgRating,
        numPages: numPages && numPages > 0 ? numPages : null,
        dateRead: stripCdata(readAtMatch ? readAtMatch[1] : null) || null,
        dateAdded:
          stripCdata(dateAddedMatch ? dateAddedMatch[1] : null) || null,
        shelf: shelf,
        imageUrl: stripCdata(imageMatch ? imageMatch[1] : null) || null,
        goodreadsUrl: stripCdata(linkMatch ? linkMatch[1] : null) || '',
      })
    } catch (err) {
      console.warn('Failed to parse Goodreads RSS item:', err)
    }
  }

  return books
}

export default defineEventHandler(async (_event) => {
  const userId = '9273959' // EJ Fox's Goodreads ID
  const profileUrl = `https://www.goodreads.com/user/show/${userId}`

  try {
    // Fetch both shelves in parallel
    const [currentlyReadingResponse, readResponse] = await Promise.all([
      $fetch<string>(
        `https://www.goodreads.com/review/list_rss/${userId}?shelf=currently-reading`,
        {
          responseType: 'text',
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; EJFox Website Bot)',
          },
        }
      ),
      $fetch<string>(
        `https://www.goodreads.com/review/list_rss/${userId}?shelf=read`,
        {
          responseType: 'text',
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; EJFox Website Bot)',
          },
        }
      ),
    ])

    const currentlyReading = parseRssFeed(
      currentlyReadingResponse,
      'currently-reading'
    )
    const readBooks = parseRssFeed(readResponse, 'read')

    // Calculate stats
    const now = new Date()
    const thisYear = now.getFullYear()
    const thisMonth = now.getMonth()

    const booksReadThisYear = readBooks.filter((b) => {
      if (!b.dateRead) return false
      const readDate = new Date(b.dateRead)
      return readDate.getFullYear() === thisYear
    })

    const booksReadThisMonth = booksReadThisYear.filter((b) => {
      if (!b.dateRead) return false
      const readDate = new Date(b.dateRead)
      return readDate.getMonth() === thisMonth
    })

    const ratedBooks = readBooks.filter((b) => b.rating !== null)
    const averageRating =
      ratedBooks.length > 0
        ? ratedBooks.reduce((sum, b) => sum + (b.rating || 0), 0) /
          ratedBooks.length
        : 0

    const pagesReadThisYear = booksReadThisYear.reduce(
      (sum, b) => sum + (b.numPages || 0),
      0
    )

    const stats: GoodreadsStats = {
      totalRead: readBooks.length,
      booksThisYear: booksReadThisYear.length,
      booksThisMonth: booksReadThisMonth.length,
      averageRating: Math.round(averageRating * 10) / 10,
      pagesReadThisYear,
      currentlyReading: currentlyReading.length,
      profileUrl,
    }

    return {
      currentlyReading,
      recentlyRead: readBooks.slice(0, 10),
      stats,
      lastUpdated: new Date().toISOString(),
      source: 'RSS feed',
    }
  } catch (error) {
    console.error('Goodreads RSS parsing error:', error)

    return {
      currentlyReading: [],
      recentlyRead: [],
      stats: {
        totalRead: 0,
        booksThisYear: 0,
        booksThisMonth: 0,
        averageRating: 0,
        pagesReadThisYear: 0,
        currentlyReading: 0,
        profileUrl,
      },
      lastUpdated: new Date().toISOString(),
      error:
        'RSS parsing failed - ' +
        (error instanceof Error ? error.message : 'Unknown error'),
      source: 'RSS feed',
    }
  }
})
