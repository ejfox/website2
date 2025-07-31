export default defineEventHandler(async (_event) => {
  try {
    // Letterboxd RSS is empty, so scrape the HTML profile directly
    const profileUrl = 'https://letterboxd.com/ejfox/'
    
    const response = await $fetch(profileUrl, {
      responseType: 'text',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; EJFox Website Bot)'
      }
    })
    
    const films = []
    
    // Extract film data from the activity timeline
    const activityMatches = response.match(/<li><p>[\s\S]*?<\/p><\/li>/g) || []
    
    for (const activityHtml of activityMatches) {
      try {
        // Extract film title and URL
        const filmLinkMatch = activityHtml.match(/<a href="\/film\/([^/]*)\/" class="target">([^<]*)<\/a>/)
        
        // Extract rating (count stars and check for half star)
        const starsMatch = activityHtml.match(/★+/)
        const halfStarMatch = activityHtml.match(/½/)
        const rating = starsMatch ? starsMatch[0].length + (halfStarMatch ? 0.5 : 0) : null
        
        // Extract date
        const dateMatch = activityHtml.match(/datetime="([^"]*)"/)
        
        if (filmLinkMatch) {
          const slug = filmLinkMatch[1]
          const title = filmLinkMatch[2]
          const watchedDate = dateMatch ? dateMatch[1] : new Date().toISOString()
          
          films.push({
            title: title,
            slug: slug,
            rating: rating,
            letterboxdUrl: `https://letterboxd.com/film/${slug}/`,
            watchedDate: watchedDate
          })
        }
      } catch (err) {
        console.warn('Failed to parse film:', err)
      }
    }
    
    // Also try to extract from the stats section
    const statsMatches = response.match(/(\d+) films?/i)
    const totalFilms = statsMatches ? parseInt(statsMatches[1]) : films.length
    
    // Calculate stats
    const thisYear = films.filter(f => 
      new Date(f.watchedDate).getFullYear() === new Date().getFullYear()
    ).length
    
    const ratedFilms = films.filter(f => f.rating)
    const averageRating = ratedFilms.length > 0 
      ? ratedFilms.reduce((sum, f) => sum + f.rating, 0) / ratedFilms.length 
      : 0
    
    const stats = {
      totalFilms: totalFilms,
      thisYear: thisYear,
      thisMonth: films.filter(f => {
        const filmDate = new Date(f.watchedDate)
        const now = new Date()
        return filmDate.getFullYear() === now.getFullYear() && 
               filmDate.getMonth() === now.getMonth()
      }).length,
      averageRating: Math.round(averageRating * 10) / 10,
      rewatches: 0, // Hard to detect from this scraping method
      topRatedFilms: films.filter(f => f.rating >= 4).slice(0, 10),
      recentFilms: films.slice(0, 10),
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
      error: 'HTML scraping failed - ' + (error.message || 'Unknown error'),
      source: 'HTML scraping (RSS was empty)'
    }
  }
})