import { defineEventHandler, createError } from 'h3'

interface LastFmTrack {
  name: string
  artist: {
    name: string
    url: string
  }
  url: string
  date?: {
    uts: string
    '#text': string
  }
  image: Array<{
    size: string
    '#text': string
  }>
  playcount?: string
}

interface LastFmArtist {
  name: string
  playcount: string
  url: string
  image: Array<{
    size: string
    '#text': string
  }>
}

interface LastFmAlbum {
  name: string
  playcount: string
  artist: {
    name: string
    url: string
  }
  url: string
  image: Array<{
    size: string
    '#text': string
  }>
}

interface LastFmResponse {
  recentTracks: {
    tracks: LastFmTrack[]
    total: number
  }
  topArtists: {
    artists: LastFmArtist[]
    total: number
  }
  topAlbums: {
    albums: LastFmAlbum[]
    total: number
  }
  topTracks: {
    tracks: LastFmTrack[]
    total: number
  }
  userInfo: {
    playcount: number
    registered: {
      unixtime: string
      formatted: string
    }
    url: string
    image: string
  }
  stats: {
    totalScrobbles: number
    uniqueArtists: number
    uniqueTracks: number
    averagePerDay: number
    topGenres: Array<{
      name: string
      count: number
    }>
  }
  lastUpdated: string
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const apiKey = config.LASTFM_API_KEY || process.env.LASTFM_API_KEY
  const sharedSecret = config.LASTFM_SHARED_SECRET || process.env.LASTFM_SHARED_SECRET
  const username = 'pseudoplacebo' // Hardcoded username as specified

  if (!apiKey) {
    console.warn('Last.fm API key not configured')
    throw createError({
      statusCode: 500,
      message: 'Last.fm API key not configured'
    })
  }

  const makeRequest = async <T>(method: string, params: Record<string, string> = {}): Promise<T> => {
    const url = new URL('https://ws.audioscrobbler.com/2.0/')
    url.searchParams.append('method', method)
    url.searchParams.append('user', username)
    url.searchParams.append('api_key', apiKey)
    url.searchParams.append('format', 'json')
    
    // Add additional params
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, value)
    })

    console.log(`Fetching Last.fm data: ${method}`)

    const response = await fetch(url.toString())

    if (!response.ok) {
      console.error(`Last.fm API error: ${response.status} ${response.statusText}`)
      const errorText = await response.text().catch(() => 'Could not read error response')
      console.error('Last.fm API error response:', errorText)
      throw createError({
        statusCode: response.status,
        message: `Last.fm API error: ${response.statusText}`,
        data: { errorText }
      })
    }

    const data = await response.json()
    
    // Check for Last.fm API errors in the response
    if (data.error) {
      console.error(`Last.fm API returned error code ${data.error} with message: ${data.message}`)
      throw createError({
        statusCode: 500,
        message: `Last.fm API error: ${data.message || 'Unknown error'}`,
        data: { errorCode: data.error }
      })
    }
    
    return data as T
  }

  try {
    console.log('Last.fm API key:', apiKey ? `${apiKey.substring(0, 4)}...${apiKey.substring(apiKey.length - 4)}` : 'Not set')
    console.log('Last.fm shared secret:', sharedSecret ? `${sharedSecret.substring(0, 4)}...${sharedSecret.substring(sharedSecret.length - 4)}` : 'Not set')
    
    // Test the API connection first
    try {
      const testResponse = await makeRequest('user.getinfo')
      console.log('Last.fm API test successful:', testResponse.user?.name === username ? 'Username matches' : 'Username mismatch')
    } catch (testError) {
      console.error('Last.fm API test failed:', testError)
      throw testError
    }
    
    // Fetch all data in parallel
    const [recentTracks, topArtists, topAlbums, topTracks, userInfo] = await Promise.all([
      makeRequest('user.getrecenttracks', { limit: '10' }),
      makeRequest('user.gettopartists', { period: '1month', limit: '10' }),
      makeRequest('user.gettopalbums', { period: '1month', limit: '10' }),
      makeRequest('user.gettoptracks', { period: '1month', limit: '10' }),
      makeRequest('user.getinfo')
    ])

    // Process recent tracks
    const processedRecentTracks = {
      tracks: recentTracks.recenttracks?.track?.map((track: any) => ({
        name: track.name,
        artist: {
          name: track.artist['#text'],
          url: track.artist.url || ''
        },
        url: track.url,
        date: track.date,
        image: track.image || []
      })) || [],
      total: parseInt(recentTracks.recenttracks?.['@attr']?.total || '0')
    }

    // Process top artists
    const processedTopArtists = {
      artists: topArtists.topartists?.artist?.map((artist: any) => ({
        name: artist.name,
        playcount: artist.playcount,
        url: artist.url,
        image: artist.image || []
      })) || [],
      total: parseInt(topArtists.topartists?.['@attr']?.total || '0')
    }

    // Process top albums
    const processedTopAlbums = {
      albums: topAlbums.topalbums?.album?.map((album: any) => ({
        name: album.name,
        playcount: album.playcount,
        artist: {
          name: album.artist.name,
          url: album.artist.url
        },
        url: album.url,
        image: album.image || []
      })) || [],
      total: parseInt(topAlbums.topalbums?.['@attr']?.total || '0')
    }

    // Process top tracks
    const processedTopTracks = {
      tracks: topTracks.toptracks?.track?.map((track: any) => ({
        name: track.name,
        artist: {
          name: track.artist.name,
          url: track.artist.url
        },
        url: track.url,
        playcount: track.playcount,
        image: track.image || []
      })) || [],
      total: parseInt(topTracks.toptracks?.['@attr']?.total || '0')
    }

    // Process user info
    const processedUserInfo = {
      playcount: parseInt(userInfo.user?.playcount || '0'),
      registered: userInfo.user?.registered || { unixtime: '0', '#text': '' },
      url: userInfo.user?.url || '',
      image: userInfo.user?.image?.[1]?.['#text'] || ''
    }

    // Calculate some additional stats
    const totalScrobbles = processedUserInfo.playcount
    const uniqueArtists = processedTopArtists.total
    const uniqueTracks = processedTopTracks.total
    
    // Calculate average scrobbles per day
    const registeredDate = new Date(parseInt(processedUserInfo.registered.unixtime) * 1000)
    const now = new Date()
    const daysSinceRegistered = Math.floor((now.getTime() - registeredDate.getTime()) / (1000 * 60 * 60 * 24))
    const averagePerDay = Math.round((totalScrobbles / daysSinceRegistered) * 10) / 10

    const result = {
      recentTracks: processedRecentTracks,
      topArtists: processedTopArtists,
      topAlbums: processedTopAlbums,
      topTracks: processedTopTracks,
      userInfo: processedUserInfo,
      stats: {
        totalScrobbles,
        uniqueArtists,
        uniqueTracks,
        averagePerDay,
        topGenres: [] // Last.fm API doesn't provide genre info directly
      },
      lastUpdated: new Date().toISOString()
    }
    
    // Log a summary of the data we're returning
    console.log('Last.fm API data summary:', {
      recentTracksCount: processedRecentTracks.tracks.length,
      topArtistsCount: processedTopArtists.artists.length,
      topAlbumsCount: processedTopAlbums.albums.length,
      topTracksCount: processedTopTracks.tracks.length,
      totalScrobbles,
      uniqueArtists,
      uniqueTracks,
      averagePerDay
    })
    
    return result
  } catch (error: any) {
    console.error('Last.fm API error details:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || 'Failed to fetch Last.fm data'
    })
  }
})
