import { defineEventHandler, createError } from 'h3'

interface MonkeyTypeTest {
  wpm: number
  raw: number
  acc: number
  timestamp: number
  consistency: number
}

interface MonkeyTypeStats {
  message: string
  data: {
    _id: string
    completedTests: number
    startedTests: number
    timeTyping: number
  }
}

interface MonkeyTypePB {
  message: string
  data: {
    [key: string]: MonkeyTypeTest[]
  }
}

// Unused interface SpeedHistogram removed

// Unused interface MonkeyTypeResponse removed

export default defineEventHandler(async () => {
  const config = useRuntimeConfig()
  const token = config.MONKEYTYPE_TOKEN

  if (!token?.trim()) {
    console.warn('MonkeyType token not configured')
    return {
      typingStats: null,
      lastUpdated: new Date().toISOString()
    }
  }

  const makeRequest = async <T>(
    url: string,
    params?: Record<string, string>
  ): Promise<T> => {
    const queryString = params
      ? '?' + new URLSearchParams(params).toString()
      : ''
    const response = await fetch(
      `https://api.monkeytype.com${url}${queryString}`,
      {
        headers: {
          Authorization: `ApeKey ${token.trim()}`,
          Accept: 'application/json'
        }
      }
    )

    if (!response.ok) {
      console.error(
        `MonkeyType API error: ${response.status} ${response.statusText}`
      )
      const error = await response
        .json()
        .catch(() => ({ message: 'Unknown error' }))
      throw createError({
        statusCode: response.status,
        message: error.message || `MonkeyType API error: ${response.statusText}`
      })
    }

    const data = await response.json()
    return data as T
  }

  try {
    // Fetch all data in parallel with error recovery
    const results = await Promise.allSettled([
      makeRequest<MonkeyTypeStats>('/users/stats'),
      makeRequest<MonkeyTypePB>('/users/personalBests', { mode: 'time' }),
      makeRequest<MonkeyTypePB>('/users/personalBests', { mode: 'words' })
    ])

    const statsData = results[0].status === 'fulfilled' ? results[0].value : null
    const timeTests = results[1].status === 'fulfilled' ? results[1].value : null
    const wordTests = results[2].status === 'fulfilled' ? results[2].value : null

    // Find best WPM across all test types
    const allTimeTests = Object.values(timeTests?.data || {}).flat()
    const allWordTests = Object.values(wordTests?.data || {}).flat()
    const allTests = [...allTimeTests, ...allWordTests] as MonkeyTypeTest[]

    if (!allTests.length || !statsData?.data) {
      console.warn('No MonkeyType test data found')
      return {
        typingStats: null,
        lastUpdated: new Date().toISOString()
      }
    }

    const bestWPM = allTests.reduce((max, test) => Math.max(max, test.wpm), 0)
    const bestTest = allTests.find((test) => test.wpm === bestWPM)

    // Get recent tests from personal bests
    const recentTests = allTests
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 5)
      .map((test) => ({
        timestamp: new Date(test.timestamp).toISOString(),
        wpm: test.wpm,
        accuracy: test.acc
      }))

    // Calculate average WPM from all tests
    const averageWpm =
      allTests.length > 0
        ? Math.round(
            allTests.reduce((sum, test) => sum + test.wpm, 0) / allTests.length
          )
        : 0

    return {
      typingStats: {
        bestWPM,
        testsCompleted: statsData.data.completedTests,
        bestAccuracy: bestTest?.acc || 0,
        bestConsistency: bestTest?.consistency || 0,
        averageWpm,
        recentTests
      },
      lastUpdated: new Date().toISOString()
    }
  } catch (error: any) {
    console.error('MonkeyType API error details:', error)
    // Only return null if we actually failed to fetch data
    return {
      typingStats: null,
      lastUpdated: new Date().toISOString()
    }
  }
})
