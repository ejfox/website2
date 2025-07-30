export default defineEventHandler(async (event) => {
  try {
    // Letterboxd doesn't have a public API, so we'll scrape the RSS feed
    const rssUrl = 'https://letterboxd.com/ejfox/rss/'
    
    const response = await $fetch(rssUrl, {
      responseType: 'text',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; EJFox Website Bot)'
      }
    })
    
    // Parse RSS XML manually since we're on server-side
    const itemMatches = response.match(/<item>([\s\S]*?)<\/item>/g) || []
    
    const films = itemMatches.map(itemXml => {
      // Extract data using regex
      const titleMatch = itemXml.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/)
      const linkMatch = itemXml.match(/<link>(.*?)<\/link>/)
      const descMatch = itemXml.match(/<description><!\[CDATA\[([\s\S]*?)\]\]><\/description>/)
      const pubDateMatch = itemXml.match(/<pubDate>(.*?)<\/pubDate>/)
      
      const title = titleMatch ? titleMatch[1] : ''
      const link = linkMatch ? linkMatch[1] : ''
      const description = descMatch ? descMatch[1] : ''
      const pubDate = pubDateMatch ? pubDateMatch[1] : ''
      
      // Extract film info from title (format: "Film Name, Year")
      const titleRegex = /^(.+?), (\d{4})$/
      const filmTitleMatch = title.match(titleRegex)
      const filmTitle = filmTitleMatch ? filmTitleMatch[1] : title
      const year = filmTitleMatch ? parseInt(filmTitleMatch[2]) : null
      
      // Extract rating from description if available
      const ratingMatch = description.match(/★+/)
      const rating = ratingMatch ? ratingMatch[0].length : null
      
      // Extract rewatch indicator
      const isRewatch = description.includes('(rewatched)')
      
      return {
        title: filmTitle,
        year,
        rating,
        isRewatch,
        watchedDate: new Date(pubDate).toISOString(),
        letterboxdUrl: link,
        description: description.replace(/<[^>]*>/g, '').trim() // Strip HTML
      }
    }).filter(film => film.title) // Filter out any failed parses
    
    // Calculate stats
    const stats = {
      totalFilms: films.length,
      thisYear: films.filter(f => 
        new Date(f.watchedDate).getFullYear() === new Date().getFullYear()
      ).length,
      thisMonth: films.filter(f => {
        const filmDate = new Date(f.watchedDate)
        const now = new Date()
        return filmDate.getFullYear() === now.getFullYear() && 
               filmDate.getMonth() === now.getMonth()
      }).length,
      averageRating: films
        .filter(f => f.rating)
        .reduce((sum, f) => sum + f.rating, 0) / films.filter(f => f.rating).length || 0,
      rewatches: films.filter(f => f.isRewatch).length,
      topRatedFilms: films
        .filter(f => f.rating === 5)
        .slice(0, 10),
      recentFilms: films.slice(0, 10),
      filmsByMonth: films.reduce((acc, film) => {
        const date = new Date(film.watchedDate)
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
        acc[monthKey] = (acc[monthKey] || 0) + 1
        return acc
      }, {} as Record<string, number>)
    }
    
    return {
      films,
      stats,
      lastUpdated: new Date().toISOString()
    }
    
  } catch (error) {
    console.error('Letterboxd API error:', error)
    
    // Return empty data instead of throwing error
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
      error: 'Letterboxd RSS parsing failed - may need alternative data source'
    }
  }
})