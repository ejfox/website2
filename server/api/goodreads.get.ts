export default defineEventHandler(async (_event) => {
  try {
    const userId = '9273959'

    // Goodreads doesn't have a public API anymore, but we can try RSS feeds
    const shelves = ['currently-reading', 'read', 'to-read']
    const allBooks = []

    for (const shelf of shelves) {
      try {
        const baseUrl = 'https://www.goodreads.com/review/list_rss'
        const rssUrl = `${baseUrl}/${userId}?shelf=${shelf}`

        const response = await $fetch(rssUrl, {
          responseType: 'text',
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; EJFox Website Bot)',
          },
        })

        // Parse RSS XML manually
        const itemMatches =
          (response as string).match(/<item>([\s\S]*?)<\/item>/g) || []

        const books = itemMatches
          .map((itemXml: string) => {
            // Extract data using regex - Goodreads uses specific field names
            const titleMatch = itemXml.match(
              /<title><!\[CDATA\[(.*?)\]\]><\/title>/
            )
            const linkMatch = itemXml.match(
              /<link><!\[CDATA\[(.*?)\]\]><\/link>/
            )
            const pubDateMatch = itemXml.match(
              /<pubDate><!\[CDATA\[(.*?)\]\]><\/pubDate>/
            )
            const _guidMatch = itemXml.match(
              /<guid><!\[CDATA\[(.*?)\]\]><\/guid>/
            )
            const authorMatch = itemXml.match(
              /<author_name>(.*?)<\/author_name>/
            )
            const ratingMatch = itemXml.match(
              /<user_rating>(\d+)<\/user_rating>/
            )
            const coverPattern =
              '<book_large_image_url><!\\[CDATA\\[' +
              '(.*?)\\]\\]><\\/book_large_image_url>'

            const coverMatch = itemXml.match(new RegExp(coverPattern))
            const bookIdMatch = itemXml.match(/<book_id>(\d+)<\/book_id>/)
            const dateAddedMatch = itemXml.match(
              /<user_date_added><!\[CDATA\[(.*?)\]\]><\/user_date_added>/
            )

            const title = titleMatch ? titleMatch[1].trim() : ''
            const author = authorMatch ? authorMatch[1].trim() : ''
            const rating = ratingMatch ? Number.parseInt(ratingMatch[1]) : null
            const link = linkMatch ? linkMatch[1] : ''
            const cover = coverMatch ? coverMatch[1] : null
            const bookId = bookIdMatch ? bookIdMatch[1] : ''
            const pubDate = pubDateMatch ? pubDateMatch[1] : ''
            const dateAdded = dateAddedMatch ? dateAddedMatch[1] : pubDate

            return {
              title,
              author,
              // Only include actual ratings
              rating: rating && rating > 0 ? rating : null,
              shelf,
              link,
              cover,
              dateAdded: new Date(dateAdded).toISOString(),
              bookId,
            }
          })
          .filter((book: any) => book.title)

        allBooks.push(...books)
      } catch (shelfError) {
        console.warn(`Failed to fetch ${shelf} shelf:`, shelfError)
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
      (book) => new Date(book.dateAdded).getFullYear() === thisYear
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

    // Top rated books
    const topRatedBooks = read
      .filter((book) => book.rating === 5)
      .sort(
        (a: any, b: any) =>
          new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime()
      )
      .slice(0, 10)

    // Recent reads
    const recentReads = read
      .sort(
        (a: any, b: any) =>
          new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime()
      )
      .slice(0, 10)

    // Reading by month
    const readingByMonth = read.reduce<Record<string, number>>((acc, book) => {
      const date = new Date(book.dateAdded)
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const monthKey = `${date.getFullYear()}-${month}`
      acc[monthKey] = (acc[monthKey] || 0) + 1
      return acc
    }, {})

    const stats = {
      totalRead: read.length,
      currentlyReading: currentlyReading.length,
      toRead: toRead.length,
      thisYear: booksThisYear.length,
      thisMonth: booksThisMonth.length,
      averageRating: Math.round(averageRating * 10) / 10,
      topRatedBooks,
      recentReads,
      readingByMonth,
      profileUrl: `https://www.goodreads.com/user/show/${userId}`,
    }

    return {
      books: {
        currentlyReading,
        // Only return recent reads to keep response size manageable
        read: recentReads,
        toRead: toRead.slice(0, 20), // Limit to-read list
      },
      stats,
      lastUpdated: new Date().toISOString(),
    }
  } catch (error) {
    console.error('Goodreads API error:', error)

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
        topRatedBooks: [],
        recentReads: [],
        readingByMonth: {},
        profileUrl: `https://www.goodreads.com/user/show/9273959`,
      },
      lastUpdated: new Date().toISOString(),
      error: 'Goodreads RSS parsing failed - may need alternative data source',
    }
  }
})
