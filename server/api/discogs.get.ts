export default defineEventHandler(async () => {
  const config = useRuntimeConfig()
  const token = config.DISCOGS_TOKEN || process.env.DISCOGS_TOKEN
  const username = config.DISCOGS_USERNAME || process.env.DISCOGS_USERNAME || 'mrejfox'

  if (!token) {
    console.warn('Discogs token not configured')
    return {
      error: 'Discogs token not configured',
      stats: {
        totalItems: 0,
        totalValue: 0,
        medianValue: 0,
        highestValue: 0,
      },
      collection: [],
      lastUpdated: new Date().toISOString(),
    }
  }

  const makeRequest = async <T>(
    endpoint: string,
    params: Record<string, string> = {}
  ): Promise<T> => {
    const maxRetries = 3
    const timeout = 10000
    let attempt = 0

    while (attempt < maxRetries) {
      try {
        const url = new URL(`https://api.discogs.com${endpoint}`)
        url.searchParams.append('token', token)
        url.searchParams.append('per_page', '250')

        Object.entries(params).forEach(([key, value]) => {
          url.searchParams.append(key, value)
        })

        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), timeout)

        const response = await fetch(url.toString(), {
          signal: controller.signal,
          headers: {
            Accept: 'application/json',
            'User-Agent': 'EJFox-Website/2.0 (https://ejfox.com; ejfox@ejfox.com)',
          },
        })

        clearTimeout(timeoutId)

        if (!response.ok) {
          console.error(
            `Discogs API error: ${response.status} ${response.statusText}`
          )
          throw createError({
            statusCode: response.status,
            message: `Discogs API error: ${response.statusText}`,
          })
        }

        const data = await response.json()
        return data as T
      } catch (error: any) {
        attempt++

        if (error.name === 'AbortError') {
          console.warn(
            `Discogs request timeout for ${endpoint}, attempt ${attempt}/${maxRetries}`
          )
        } else {
          console.error(
            `Error fetching ${endpoint}, attempt ${attempt}/${maxRetries}:`,
            error
          )
        }

        if (attempt === maxRetries) {
          throw error
        }

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
    // Fetch collection data with pagination
    let allItems: any[] = []
    let page = 1
    let hasMore = true

    while (hasMore) {
      const collectionData = await makeRequest<any>(
        `/users/${username}/collection/folders/0/releases`,
        { page: page.toString() }
      )

      if (collectionData.releases) {
        allItems = allItems.concat(collectionData.releases)
      }

      // Check if there are more pages
      if (collectionData.pagination) {
        hasMore = page < collectionData.pagination.pages
        page++
      } else {
        hasMore = false
      }

      // Rate limiting - Discogs recommends rate limiting
      await new Promise((resolve) => setTimeout(resolve, 500))
    }

    // Calculate stats
    const totalItems = allItems.length
    let totalValue = 0
    let values: number[] = []

    allItems.forEach((item: any) => {
      if (item.basic_information) {
        const value = item.basic_information.price || 0
        totalValue += value
        if (value > 0) {
          values.push(value)
        }
      }
    })

    // Calculate median
    values.sort((a, b) => a - b)
    const medianValue =
      values.length > 0
        ? values[Math.floor(values.length / 2)]
        : 0

    const highestValue = values.length > 0 ? Math.max(...values) : 0

    // Group by genre
    const genreMap: Record<string, number> = {}
    allItems.forEach((item: any) => {
      if (item.basic_information?.genres) {
        item.basic_information.genres.forEach((genre: string) => {
          genreMap[genre] = (genreMap[genre] || 0) + 1
        })
      }
    })

    const topGenres = Object.entries(genreMap)
      .map(([genre, count]) => ({ genre, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    // Group by decade
    const decadeMap: Record<string, number> = {}
    allItems.forEach((item: any) => {
      const year = item.basic_information?.year
      if (year) {
        const decade = Math.floor(year / 10) * 10
        const decadeLabel = `${decade}s`
        decadeMap[decadeLabel] = (decadeMap[decadeLabel] || 0) + 1
      }
    })

    const decadeBreakdown = Object.entries(decadeMap)
      .map(([decade, count]) => ({ decade, count }))
      .sort((a, b) => {
        const yearA = parseInt(a.decade)
        const yearB = parseInt(b.decade)
        return yearA - yearB
      })

    // Top artists
    const artistMap: Record<string, number> = {}
    allItems.forEach((item: any) => {
      if (item.basic_information?.artists) {
        item.basic_information.artists.forEach((artist: any) => {
          const artistName = artist.name || 'Unknown'
          artistMap[artistName] = (artistMap[artistName] || 0) + 1
        })
      }
    })

    const topArtists = Object.entries(artistMap)
      .map(([artist, count]) => ({ artist, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    // Pick a random record
    const randomRecord = allItems.length > 0
      ? allItems[Math.floor(Math.random() * allItems.length)]
      : null

    // Get collection value endpoint
    const collectionValue = await makeRequest<any>(
      `/users/${username}/collection/value`
    )

    const result = {
      stats: {
        totalItems,
        totalValue: collectionValue.overall_value || totalValue,
        medianValue,
        highestValue,
        averageValue: totalItems > 0 ? Math.round((totalValue / totalItems) * 100) / 100 : 0,
      },
      topGenres,
      decadeBreakdown,
      topArtists,
      randomRecord: randomRecord ? {
        title: randomRecord.basic_information?.title || 'Unknown',
        artist: randomRecord.basic_information?.artists?.[0]?.name || 'Unknown Artist',
        year: randomRecord.basic_information?.year || 0,
        genres: randomRecord.basic_information?.genres || [],
        price: randomRecord.basic_information?.price || 0,
        uri: randomRecord.uri || '',
        resourceUrl: randomRecord.resource_url || '',
        format: randomRecord.basic_information?.formats?.[0]?.name || 'Unknown Format',
      } : null,
      collection: allItems.slice(0, 20).map((item: any) => ({
        title: item.basic_information?.title || 'Unknown',
        artist: item.basic_information?.artists?.[0]?.name || 'Unknown Artist',
        year: item.basic_information?.year || 0,
        price: item.basic_information?.price || 0,
        uri: item.uri || '',
        resourceUrl: item.resource_url || '',
      })),
      lastUpdated: new Date().toISOString(),
    }

    return result
  } catch (error: any) {
    console.error('Discogs API error details:', error)

    return {
      error: error.message || 'Failed to fetch Discogs collection',
      stats: {
        totalItems: 0,
        totalValue: 0,
        medianValue: 0,
        highestValue: 0,
        averageValue: 0,
      },
      topGenres: [],
      decadeBreakdown: [],
      topArtists: [],
      randomRecord: null,
      collection: [],
      lastUpdated: new Date().toISOString(),
    }
  }
})
