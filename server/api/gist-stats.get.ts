export default defineEventHandler(async () => {
  try {
    // Get all gists
    const gists = await $fetch('/api/gists')
    
    if (!Array.isArray(gists)) {
      throw new Error('Failed to fetch gists')
    }
    
    // Calculate stats
    const languages: Record<string, number> = {}
    const yearStats: Record<number, number> = {}
    let totalFiles = 0
    let totalSize = 0
    
    gists.forEach(gist => {
      const createdDate = new Date(gist.created_at)
      const year = createdDate.getFullYear()
      
      // Year stats
      yearStats[year] = (yearStats[year] || 0) + 1
      
      // Process files in each gist
      Object.values(gist.files).forEach(file => {
        totalFiles++
        totalSize += file.size || 0
        
        // Language stats
        if (file.language && file.language !== 'Text') {
          languages[file.language] = (languages[file.language] || 0) + 1
        }
      })
    })
    
    // Sort languages by usage
    const topLanguages = Object.entries(languages)
      .sort(([,a], [,b]) => (b as number) - (a as number))
      .slice(0, 8)
      .map(([language, count]) => ({ language, count }))
    
    // Get recent gists
    const recentGists = gists
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5)
      .map(gist => ({
        id: gist.id,
        description: gist.description || 'No description',
        created_at: gist.created_at,
        files: Object.keys(gist.files).length,
        languages: [...new Set(Object.values(gist.files).map(f => f.language).filter(Boolean))],
        html_url: gist.html_url
      }))
    
    return {
      stats: {
        totalGists: gists.length,
        totalFiles,
        totalSize,
        averageFilesPerGist: Math.round(totalFiles / gists.length * 10) / 10,
        topLanguages,
        yearStats
      },
      recentGists,
      lastUpdated: new Date().toISOString()
    }
    
  } catch (error) {
    console.error('Gist stats error:', error)
    
    return {
      stats: {
        totalGists: 0,
        totalFiles: 0,
        totalSize: 0,
        averageFilesPerGist: 0,
        topLanguages: [],
        yearStats: {}
      },
      recentGists: [],
      lastUpdated: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Failed to fetch gist stats'
    }
  }
})