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

interface SpeedHistogram {
  message: string
  data: {
    [key: string]: number // WPM level (multiple of 10) -> count
  }
}

interface MonkeyTypeResponse {
  typingStats: {
    testsCompleted: number
    testsStarted: number
    bestWPM: number
    bestAccuracy: number
    bestConsistency: number
    timePercentile: number
    wordsPercentile: number
  }
  personalBests: {
    time: { [key: string]: MonkeyTypeTest[] }
    words: { [key: string]: MonkeyTypeTest[] }
  }
  speedHistogram: {
    time: { [key: string]: number }
    words: { [key: string]: number }
  }
  lastUpdated: string
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const token = config.MONKEYTYPE_TOKEN

  if (!token) {
    throw createError({
      statusCode: 401,
      message: 'MonkeyType token not configured'
    })
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
    // Fetch all data in parallel
    const [statsData, timeTests, wordTests, histogramTime, histogramWords] =
      await Promise.all([
        makeRequest<MonkeyTypeStats>('/users/stats'),
        makeRequest<MonkeyTypePB>('/users/personalBests', { mode: 'time' }),
        makeRequest<MonkeyTypePB>('/users/personalBests', { mode: 'words' }),
        makeRequest<SpeedHistogram>('/public/speedHistogram', {
          mode: 'time',
          mode2: '60',
          language: 'english'
        }),
        makeRequest<SpeedHistogram>('/public/speedHistogram', {
          mode: 'words',
          mode2: '50',
          language: 'english'
        })
      ])

    // Find best WPM across all test types
    const allTimeTests = Object.values(timeTests?.data || {}).flat()
    const allWordTests = Object.values(wordTests?.data || {}).flat()
    const allTests = [...allTimeTests, ...allWordTests] as MonkeyTypeTest[]

    const bestWPM = allTests.reduce((max, test) => Math.max(max, test.wpm), 0)
    const bestTest = allTests.find((test) => test.wpm === bestWPM)

    // Get percentile from histogram
    const getPercentile = (wpm: number, histogram: SpeedHistogram) => {
      const histogramData = histogram.data
      const totalUsers = Object.values(histogramData).reduce(
        (sum, count) => sum + count,
        0
      )
      const wpmLevel = Math.floor(wpm / 10) * 10
      const usersBelow = Object.entries(histogramData)
        .filter(([level]) => parseInt(level) <= wpmLevel)
        .reduce((sum, [_, count]) => sum + count, 0)

      return ((usersBelow / totalUsers) * 100).toFixed(1)
    }

    // Calculate percentiles for best scores
    const timePercentile = getPercentile(bestWPM, histogramTime)
    const wordsPercentile = getPercentile(bestWPM, histogramWords)

    const response: MonkeyTypeResponse = {
      typingStats: {
        testsCompleted: statsData.data.completedTests,
        testsStarted: statsData.data.startedTests,
        bestWPM,
        bestAccuracy: bestTest?.acc || 0,
        bestConsistency: bestTest?.consistency || 0,
        timePercentile: parseFloat(timePercentile),
        wordsPercentile: parseFloat(wordsPercentile)
      },
      personalBests: {
        time: timeTests?.data || {},
        words: wordTests?.data || {}
      },
      speedHistogram: {
        time: histogramTime?.data || {},
        words: histogramWords?.data || {}
      },
      lastUpdated: new Date().toISOString()
    }

    return response
  } catch (error: any) {
    console.error('MonkeyType API error details:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || 'Failed to fetch MonkeyType data'
    })
  }
})
