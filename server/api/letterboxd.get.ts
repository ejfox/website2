export default defineEventHandler(async (_event) => {
  try {
    // Fetch RSS feed (much more reliable than HTML scraping!)
    const rssUrl = 'https://letterboxd.com/ejfox/rss/'

    const rssResponse = await $fetch(rssUrl, {
      responseType: 'text',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; EJFox Website Bot)'
      }
    })

    const xml = rssResponse as string
    const films = []

    // Parse RSS XML for film entries
    // Each item has: <letterboxd:filmTitle>, <letterboxd:filmYear>, <letterboxd:watchedDate>, <letterboxd:memberRating>, <letterboxd:rewatch>
    const itemPattern = /<item>([\s\S]*?)<\/item>/g
    let itemMatch

    while ((itemMatch = itemPattern.exec(xml)) !== null) {
      const itemXml = itemMatch[1]

      try {
        // Extract film data from RSS item
        const titleMatch = itemXml.match(/<letterboxd:filmTitle>(.*?)<\/letterboxd:filmTitle>/)
        const yearMatch = itemXml.match(/<letterboxd:filmYear>(.*?)<\/letterboxd:filmYear>/)
        const watchedDateMatch = itemXml.match(/<letterboxd:watchedDate>(.*?)<\/letterboxd:watchedDate>/)
        const ratingMatch = itemXml.match(/<letterboxd:memberRating>(.*?)<\/letterboxd:memberRating>/)
        const rewatchMatch = itemXml.match(/<letterboxd:rewatch>(.*?)<\/letterboxd:rewatch>/)
        const linkMatch = itemXml.match(/<link>(.*?)<\/link>/)

        const title = titleMatch ? titleMatch[1] : ''
        const year = yearMatch ? yearMatch[1] : ''
        const watchedDate = watchedDateMatch ? watchedDateMatch[1] : null
        const rating = ratingMatch ? parseFloat(ratingMatch[1]) : null
        const isRewatch = rewatchMatch ? rewatchMatch[1] === 'Yes' : false

        // Extract slug from link (e.g., https://letterboxd.com/ejfox/film/friendship-2024/)
        let slug = ''
        if (linkMatch) {
          const slugMatch = linkMatch[1].match(/\/film\/([^\/]+)\//)
          if (slugMatch) {
            slug = slugMatch[1]
          }
        }

        films.push({
          title: year ? `${title} (${year})` : title,
          slug: slug,
          rating: rating,
          letterboxdUrl: linkMatch ? linkMatch[1] : `https://letterboxd.com/film/${slug}/`,
          watchedDate: watchedDate,
          isRewatch: isRewatch
        })
      } catch (err) {
        console.warn('Failed to parse RSS item:', err)
      }
    }

    console.log(`Parsed ${films.length} films from RSS feed`)

    // Calculate stats
    const now = new Date()
    const thisYear = films.filter(
      (f) =>
        f.watchedDate &&
        new Date(f.watchedDate).getFullYear() === now.getFullYear()
    ).length

    const thisMonth = films.filter((f) => {
      if (!f.watchedDate) return false
      const filmDate = new Date(f.watchedDate)
      return (
        filmDate.getFullYear() === now.getFullYear() &&
        filmDate.getMonth() === now.getMonth()
      )
    }).length

    const ratedFilms = films.filter((f) => f.rating !== null)
    const averageRating =
      ratedFilms.length > 0
        ? ratedFilms.reduce((sum, f) => sum + (f.rating || 0), 0) / ratedFilms.length
        : 0

    const rewatches = films.filter((f) => f.isRewatch).length

    const stats = {
      totalFilms: films.length,
      thisYear: thisYear,
      thisMonth: thisMonth,
      averageRating: Math.round(averageRating * 10) / 10,
      rewatches: rewatches,
      topRatedFilms: films.filter((f) => f.rating && f.rating >= 4),
      recentFilms: films.slice(0, 10), // Most recent 10 films
      filmsByMonth: {}
    }

    return {
      films,
      stats,
      lastUpdated: new Date().toISOString(),
      source: 'RSS feed'
    }
  } catch (error) {
    console.error('Letterboxd RSS parsing error:', error)

    // Return empty stats with error info
    return {
      films: [],
      stats: {
        totalFilms: 0,
        thisYear: 0,
        thisMonth: 0,
        averageRating: 0,
        rewatches: 0,
        topRatedFilms: [],
        recentFilms: [],
        filmsByMonth: {}
      },
      lastUpdated: new Date().toISOString(),
      error:
        'RSS parsing failed - ' +
        (error instanceof Error ? error.message : 'Unknown error'),
      source: 'RSS feed'
    }
  }
})
