export default defineEventHandler(async () => {
  const config = useRuntimeConfig()
  // Use hardcoded API key as fallback if environment variables aren't available
  const apiKey =
    config.LASTFM_API_KEY ||
    process.env.LASTFM_API_KEY ||
    '3e1f9761376a48e5d6b38aa0dba8274f'
  const _sharedSecret =
    config.LASTFM_SHARED_SECRET ||
    process.env.LASTFM_SHARED_SECRET ||
    'f0ba21c7a486f694b889521ca0f26d7a'
  const username = 'pseudoplacebo' // Hardcoded username as specified

  // console.log('Last.fm config:', {
  //   hasApiKey: !!apiKey,
  //   hasSharedSecret: !!sharedSecret,
  //   apiKeyLength: apiKey?.length,
  //   username
  // })

  const makeRequest = async <T>(
    method: string,
    params: Record<string, string> = {}
  ): Promise<T> => {
    const maxRetries = 3
    const timeout = 10000 // 10 seconds
    let attempt = 0

    // Cache disabled - use direct API calls only

    // Rate limiting - ensure at least 250ms between requests
    await new Promise((resolve) => setTimeout(resolve, 250))

    while (attempt < maxRetries) {
      try {
        const url = new URL('https://ws.audioscrobbler.com/2.0/')
        url.searchParams.append('method', method)
        url.searchParams.append('user', username)
        url.searchParams.append('api_key', apiKey)
        url.searchParams.append('format', 'json')

        // Add additional params
        Object.entries(params).forEach(([key, value]) => {
          url.searchParams.append(key, value)
        })

        // console.log(
        //   `Fetching Last.fm data: ${method} (attempt ${
        //     attempt + 1
        //   }/${maxRetries})`
        // )

        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), timeout)

        const response = await fetch(url.toString(), {
          signal: controller.signal,
          headers: {
            Accept: 'application/json',
            'User-Agent':
              'EJFox-Website/2.0 (https://ejfox.com; ejfox@ejfox.com)',
          },
        })

        clearTimeout(timeoutId)

        if (!response.ok) {
          console.error(
            `Last.fm API error: ${response.status} ${response.statusText}`
          )
          const errorText = await response
            .text()
            .catch(() => 'Could not read error response')
          console.error('Last.fm API error response:', errorText)
          throw createError({
            statusCode: response.status,
            message: `Last.fm API error: ${response.statusText}`,
            data: { errorText },
          })
        }

        const data = await response.json()

        // Check for Last.fm API errors in the response
        if (data.error) {
          const errorMsg = data.message || 'Unknown error'
          console.error(
            `Last.fm API returned error code ${data.error} with ` +
              `message: ${errorMsg}`
          )
          throw createError({
            statusCode: 500,
            message: `Last.fm API error: ${errorMsg}`,
            data: { errorCode: data.error },
          })
        }

        // Cache disabled - direct API calls only

        return data as T
      } catch (error: any) {
        attempt++

        if (error.name === 'AbortError') {
          console.warn(
            `Request timeout for ${method}, attempt ${attempt}/${maxRetries}`
          )
        } else {
          console.error(
            `Error fetching ${method}, attempt ${attempt}/${maxRetries}:`,
            error
          )
        }

        if (attempt === maxRetries) {
          throw error
        }

        // Exponential backoff with jitter
        const backoffTime = Math.min(
          1000 * Math.pow(2, attempt) + Math.random() * 1000,
          10000
        )
        await new Promise((resolve) => setTimeout(resolve, backoffTime))
      }
    }

    throw new Error('Should not reach here')
  }

  try {
    // Log API key info (safely)
    // if (apiKey) {
    //   console.log(
    //     'Last.fm API key:',
    //     `${apiKey.substring(0, 4)}...${apiKey.substring(apiKey.length - 4)}`
    //   )
    // } else {
    //   console.warn('Last.fm API key is not set')
    // }

    // if (sharedSecret) {
    //   console.log(
    //     'Last.fm shared secret:',
    //     `${sharedSecret.substring(0, 4)}...${sharedSecret.substring(
    //       sharedSecret.length - 4
    //     )}`
    //   )
    // }

    // Test the API connection first
    try {
      const _testResponse = await makeRequest<any>('user.getinfo')
      // console.log(
      //   'Last.fm API test successful:',
      //   testResponse.user?.name === username
      //     ? 'Username matches'
      //     : 'Username mismatch'
      // )
    } catch (testError) {
      console.error('Last.fm API test failed:', testError)
      // Don't throw here, continue with other requests
    }

    // Fetch all data in parallel with error recovery
    const results = await Promise.allSettled([
      makeRequest<any>('user.getrecenttracks', { limit: '10' }),
      makeRequest<any>('user.gettopartists', {
        period: '1month',
        limit: '10',
      }),
      makeRequest<any>('user.gettopalbums', {
        period: '1month',
        limit: '10',
      }),
      makeRequest<any>('user.gettoptracks', {
        period: '1month',
        limit: '10',
      }),
      makeRequest<any>('user.getinfo'),
    ])

    const recentTracks =
      results[0].status === 'fulfilled'
        ? results[0].value
        : { recenttracks: { track: [] } }
    const topArtists =
      results[1].status === 'fulfilled'
        ? results[1].value
        : { topartists: { artist: [] } }
    const topAlbums =
      results[2].status === 'fulfilled'
        ? results[2].value
        : { topalbums: { album: [] } }
    const topTracks =
      results[3].status === 'fulfilled'
        ? results[3].value
        : { toptracks: { track: [] } }
    const userInfo =
      results[4].status === 'fulfilled' ? results[4].value : { user: {} }

    // Process recent tracks
    const processedRecentTracks = {
      tracks:
        recentTracks.recenttracks?.track?.map((track: any) => ({
          name: track.name,
          artist: {
            name: track.artist['#text'],
            url: track.artist.url || '',
          },
          url: track.url,
          date: track.date,
          image: track.image || [],
        })) || [],
      total: Number.parseInt(
        recentTracks.recenttracks?.['@attr']?.total || '0'
      ),
    }

    // Process top artists
    const processedTopArtists = {
      artists:
        topArtists.topartists?.artist?.map((artist: any) => ({
          name: artist.name,
          playcount: artist.playcount,
          url: artist.url,
          image: artist.image || [],
        })) || [],
      total: Number.parseInt(topArtists.topartists?.['@attr']?.total || '0'),
    }

    // Process top albums
    const processedTopAlbums = {
      albums:
        topAlbums.topalbums?.album?.map((album: any) => ({
          name: album.name,
          playcount: album.playcount,
          artist: {
            name: album.artist.name,
            url: album.artist.url,
          },
          url: album.url,
          image: album.image || [],
        })) || [],
      total: Number.parseInt(topAlbums.topalbums?.['@attr']?.total || '0'),
    }

    // Process top tracks
    const processedTopTracks = {
      tracks:
        topTracks.toptracks?.track?.map((track: any) => ({
          name: track.name,
          artist: {
            name: track.artist.name,
            url: track.artist.url,
          },
          url: track.url,
          playcount: track.playcount,
          image: track.image || [],
        })) || [],
      total: Number.parseInt(topTracks.toptracks?.['@attr']?.total || '0'),
    }

    // Process user info
    const processedUserInfo = {
      playcount: Number.parseInt(userInfo.user?.playcount || '0'),
      registered: userInfo.user?.registered || { unixtime: '0', '#text': '' },
      url: userInfo.user?.url || '',
      image: userInfo.user?.image?.[1]?.['#text'] || '',
    }

    // Calculate some additional stats
    const totalScrobbles = processedUserInfo.playcount
    const uniqueArtists = processedTopArtists.total
    const uniqueTracks = processedTopTracks.total

    // Calculate average scrobbles per day
    const registeredDate = new Date(
      Number.parseInt(processedUserInfo.registered.unixtime) * 1000
    )
    const now = new Date()
    const daysSinceRegistered = Math.floor(
      (now.getTime() - registeredDate.getTime()) / (1000 * 60 * 60 * 24)
    )
    const averagePerDay =
      Math.round((totalScrobbles / daysSinceRegistered) * 10) / 10

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
        topGenres: [], // Last.fm API doesn't provide genre info directly
      },
      lastUpdated: new Date().toISOString(),
    }

    // Log a summary of the data we're returning
    // console.log('Last.fm API data summary:', {
    //   recentTracksCount: processedRecentTracks.tracks.length,
    //   topArtistsCount: processedTopArtists.artists.length,
    //   topAlbumsCount: processedTopAlbums.albums.length,
    //   topTracksCount: processedTopTracks.tracks.length,
    //   totalScrobbles,
    //   uniqueArtists,
    //   uniqueTracks,
    //   averagePerDay
    // })

    return result
  } catch (error: any) {
    console.error('Last.fm API error details:', error)

    // Instead of throwing an error, return fallback data
    return {
      recentTracks: {
        tracks: [],
        total: 0,
      },
      topArtists: {
        artists: [],
        total: 0,
      },
      topAlbums: {
        albums: [],
        total: 0,
      },
      topTracks: {
        tracks: [],
        total: 0,
      },
      userInfo: {
        playcount: 0,
        registered: { unixtime: '0', '#text': '' },
        url: `https://www.last.fm/user/${username}`,
        image: '',
      },
      stats: {
        totalScrobbles: 0,
        uniqueArtists: 0,
        uniqueTracks: 0,
        averagePerDay: 0,
        topGenres: [],
      },
      lastUpdated: new Date().toISOString(),
      error: {
        message: error.message || 'Failed to fetch Last.fm data',
        statusCode: error.statusCode || 500,
      },
    }
  }
})
