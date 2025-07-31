export default defineEventHandler(async (_event) => {
  try {
    const steamId = '76561198072533815'
    const apiKey = process.env.STEAM_API_KEY
    
    if (!apiKey) {
      console.warn('STEAM_API_KEY not configured')
      return {
        error: 'Steam API key not configured',
        stats: {
          totalGames: 0,
          recentlyPlayed: [],
          topGames: [],
          totalPlaytime: 0
        }
      }
    }

    // Get owned games
    const ownedGamesUrl = `https://api.steampowered.com/IPlayerService/GetOwnedGames/v0001/?key=${apiKey}&steamid=${steamId}&format=json&include_appinfo=1&include_played_free_games=1`
    
    // Get recently played games
    const recentGamesUrl = `https://api.steampowered.com/IPlayerService/GetRecentlyPlayedGames/v0001/?key=${apiKey}&steamid=${steamId}&format=json&count=10`
    
    const [ownedResponse, recentResponse] = await Promise.all([
      $fetch(ownedGamesUrl),
      $fetch(recentGamesUrl)
    ])

    const ownedGames = ownedResponse.response?.games || []
    const recentGames = recentResponse.response?.games || []
    
    // Calculate stats
    const totalPlaytime = ownedGames.reduce((sum, game) => sum + (game.playtime_forever || 0), 0)
    const gamesWithPlaytime = ownedGames.filter(game => game.playtime_forever > 0)
    
    // Top games by playtime (minimum 30 minutes)
    const topGames = ownedGames
      .filter(game => game.playtime_forever >= 30)
      .sort((a, b) => b.playtime_forever - a.playtime_forever)
      .slice(0, 10)
      .map(game => ({
        name: game.name,
        appid: game.appid,
        playtime_hours: Math.round(game.playtime_forever / 60 * 10) / 10,
        img_icon_url: game.img_icon_url,
        steamStoreUrl: `https://store.steampowered.com/app/${game.appid}/`
      }))
    
    // Recently played with better formatting
    const recentlyPlayed = recentGames.map(game => ({
      name: game.name,
      appid: game.appid,
      playtime_2weeks: Math.round((game.playtime_2weeks || 0) / 60 * 10) / 10,
      playtime_forever: Math.round((game.playtime_forever || 0) / 60 * 10) / 10,
      img_icon_url: game.img_icon_url,
      steamStoreUrl: `https://store.steampowered.com/app/${game.appid}/`
    }))

    const stats = {
      totalGames: ownedGames.length,
      gamesWithPlaytime: gamesWithPlaytime.length,
      totalPlaytime: Math.round(totalPlaytime / 60), // Convert to hours
      averagePlaytime: gamesWithPlaytime.length > 0 
        ? Math.round(totalPlaytime / gamesWithPlaytime.length / 60 * 10) / 10 
        : 0,
      recentlyPlayed,
      topGames,
      profileUrl: `https://steamcommunity.com/profiles/${steamId}/`
    }
    
    return {
      stats,
      lastUpdated: new Date().toISOString()
    }
    
  } catch (error) {
    console.error('Steam API error:', error)
    return {
      error: 'Failed to fetch Steam data',
      stats: {
        totalGames: 0,
        recentlyPlayed: [],
        topGames: [],
        totalPlaytime: 0
      }
    }
  }
})