export default defineEventHandler(async (_event) => {
  try {
    // Scrape both profile and films pages to get all movies
    const profileUrl = 'https://letterboxd.com/ejfox/'
    const filmsUrl = 'https://letterboxd.com/ejfox/films/'

    const [profileResponse, filmsResponse] = await Promise.all([
      $fetch(profileUrl, {
        responseType: 'text',
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; EJFox Website Bot)'
        }
      }),
      $fetch(filmsUrl, {
        responseType: 'text',
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; EJFox Website Bot)'
        }
      })
    ])

    // Combine both HTML sources
    const combinedHtml =
      (profileResponse as string) + '\n' + (filmsResponse as string)

    const films = []

    // Extract all film slugs first, then get details for each
    const html = combinedHtml

    // Extract all unique film slugs from href="/film/slug/" patterns
    const filmSlugMatches = html.match(/\/film\/([^/]*)\//g) || []
    const uniqueSlugs = [
      ...new Set(
        filmSlugMatches.map((match) => match.replace(/\/film\/|\/$/g, ''))
      )
    ]

    console.log('Found film slugs:', uniqueSlugs)

    // For each slug, try to find associated data in the HTML
    for (const slug of uniqueSlugs) {
      try {
        // Look for film data around this slug
        const slugPattern = new RegExp(`/film/${slug}/`, 'g')
        const contexts = []

        // Find all contexts where this film appears
        let match
        while ((match = slugPattern.exec(html)) !== null) {
          const start = Math.max(0, match.index - 200)
          const end = Math.min(html.length, match.index + 200)
          contexts.push(html.substring(start, end))
        }

        // Extract title from any context
        let title = slug
          .replace(/-/g, ' ')
          .replace(/\b\w/g, (l) => l.toUpperCase())

        // Try to find actual title from various patterns
        for (const context of contexts) {
          const titlePatterns = [
            new RegExp(`data-film-name="([^"]*)"`, 'i'),
            new RegExp(`title="([^"]*)"`, 'i'),
            new RegExp(`alt="([^"]*)"`, 'i'),
            new RegExp(`>${slug.replace(/-/g, '[\\s-]+')}<`, 'i')
          ]

          for (const pattern of titlePatterns) {
            const titleMatch = context.match(pattern)
            if (titleMatch && titleMatch[1] && titleMatch[1].length > 3) {
              title = titleMatch[1].trim()
              break
            }
          }
          if (
            title !==
            slug.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())
          )
            break
        }

        // Extract rating from contexts
        let rating = null
        for (const context of contexts) {
          const starsMatch = context.match(/★+/)
          const halfStarMatch = context.match(/½/)
          if (starsMatch) {
            rating = starsMatch[0].length + (halfStarMatch ? 0.5 : 0)
            break
          }
        }

        // Extract date from contexts
        let watchedDate = null
        for (const context of contexts) {
          const datePatterns = [
            /datetime="([^"]*)"/,
            /data-date="([^"]*)"/,
            /(\d{4}-\d{2}-\d{2})/
          ]

          for (const pattern of datePatterns) {
            const dateMatch = context.match(pattern)
            if (dateMatch) {
              watchedDate = dateMatch[1]
              break
            }
          }
          if (watchedDate) break
        }

        films.push({
          title: title,
          slug: slug,
          rating: rating,
          letterboxdUrl: `https://letterboxd.com/film/${slug}/`,
          watchedDate: watchedDate
        })
      } catch (err) {
        console.warn('Failed to parse film:', slug, err)
      }
    }

    // Also try to extract from the stats section
    const statsMatches = html.match(/(\d+) films?/i)
    const totalFilms = statsMatches ? parseInt(statsMatches[1]) : films.length

    // Calculate stats
    const thisYear = films.filter(
      (f) =>
        f.watchedDate &&
        new Date(f.watchedDate).getFullYear() === new Date().getFullYear()
    ).length

    const ratedFilms = films.filter((f) => f.rating)
    const averageRating =
      ratedFilms.length > 0
        ? ratedFilms.reduce((sum, f) => sum + (f.rating || 0), 0) /
          ratedFilms.length
        : 0

    const stats = {
      totalFilms: totalFilms,
      thisYear: thisYear,
      thisMonth: films.filter((f) => {
        if (!f.watchedDate) return false
        const filmDate = new Date(f.watchedDate)
        const now = new Date()
        return (
          filmDate.getFullYear() === now.getFullYear() &&
          filmDate.getMonth() === now.getMonth()
        )
      }).length,
      averageRating: Math.round(averageRating * 10) / 10,
      rewatches: 0, // Hard to detect from this scraping method
      topRatedFilms: films.filter((f) => f.rating && f.rating >= 4),
      recentFilms: films,
      filmsByMonth: {}
    }

    return {
      films,
      stats,
      lastUpdated: new Date().toISOString(),
      source: 'HTML scraping (RSS was empty)'
    }
  } catch (error) {
    console.error('Letterboxd scraping error:', error)

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
        'HTML scraping failed - ' +
        (error instanceof Error ? error.message : 'Unknown error'),
      source: 'HTML scraping (RSS was empty)'
    }
  }
})
