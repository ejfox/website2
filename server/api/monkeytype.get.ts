/**
 * @file monkeytype.get.ts
 * @description Fetches MonkeyType typing test statistics including WPM, accuracy, and test completion data
 * @endpoint GET /api/monkeytype
 * @returns Typing statistics with best WPM, average WPM, tests completed, accuracy, consistency, and recent test results
 */
import { defineEventHandler, createError } from 'h3'

interface MonkeyTypeTest {
  wpm: number
  raw: number
  rawWpm?: number
  acc: number
  accuracy?: number
  timestamp: number
  consistency: number
  language?: string
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

interface MonkeyTypeResult {
  wpm?: number
  rawWpm?: number
  raw?: number
  acc?: number
  accuracy?: number
  timestamp: number | string
  consistency?: number
  language?: string
  lang?: string
}

interface MonkeyTypeHistory {
  message: string
  data?:
    | MonkeyTypeResult[]
    | { results?: MonkeyTypeResult[]; data?: MonkeyTypeResult[] }
  results?: MonkeyTypeResult[]
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
      lastUpdated: new Date().toISOString(),
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
          Accept: 'application/json',
        },
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
        message:
          error.message || `MonkeyType API error: ${response.statusText}`,
      })
    }

    const data = await response.json()
    return data as T
  }

  const makeOptionalRequest = async <T>(
    url: string,
    params?: Record<string, string>
  ): Promise<T | null> => {
    const queryString = params
      ? '?' + new URLSearchParams(params).toString()
      : ''
    const response = await fetch(
      `https://api.monkeytype.com${url}${queryString}`,
      {
        headers: {
          Authorization: `ApeKey ${token.trim()}`,
          Accept: 'application/json',
        },
      }
    )

    if (!response.ok) {
      if (response.status === 404) return null
      console.error(
        `MonkeyType API error: ${response.status} ${response.statusText}`
      )
      const error = await response
        .json()
        .catch(() => ({ message: 'Unknown error' }))
      throw createError({
        statusCode: response.status,
        message:
          error.message || `MonkeyType API error: ${response.statusText}`,
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
      makeRequest<MonkeyTypePB>('/users/personalBests', { mode: 'words' }),
      makeOptionalRequest<MonkeyTypeHistory>('/users/results', {
        limit: '200',
      }),
    ])

    const statsData =
      results[0].status === 'fulfilled' ? results[0].value : null
    const timeTests =
      results[1].status === 'fulfilled' ? results[1].value : null
    const wordTests =
      results[2].status === 'fulfilled' ? results[2].value : null
    let historyData =
      results[3].status === 'fulfilled' ? results[3].value : null

    if (!historyData) {
      historyData = await makeOptionalRequest<MonkeyTypeHistory>('/results', {
        limit: '200',
      })
    }

    // Find best WPM across all test types
    const allTimeTests = Object.values(timeTests?.data || {}).flat()
    const allWordTests = Object.values(wordTests?.data || {}).flat()
    const allTests = [...allTimeTests, ...allWordTests] as MonkeyTypeTest[]

    if (!allTests.length || !statsData?.data) {
      console.warn('No MonkeyType test data found')
      return {
        typingStats: null,
        lastUpdated: new Date().toISOString(),
      }
    }

    const bestWPM = allTests.reduce((max, test) => Math.max(max, test.wpm), 0)
    const bestTest = allTests.find((test) => test.wpm === bestWPM)

    const extractHistoryTests = (
      history: MonkeyTypeHistory | null
    ): MonkeyTypeResult[] => {
      if (!history) return []
      if (Array.isArray(history.data)) return history.data
      if (Array.isArray(history.results)) return history.results
      if (Array.isArray(history.data?.results)) return history.data.results
      if (Array.isArray(history.data?.data)) return history.data.data
      return []
    }

    const getTestWpm = (test: MonkeyTypeTest | MonkeyTypeResult): number =>
      test.wpm ?? test.rawWpm ?? test.raw ?? 0

    const getTestAccuracy = (test: MonkeyTypeTest | MonkeyTypeResult): number =>
      test.acc ?? test.accuracy ?? 0

    const getTestTimestamp = (
      test: MonkeyTypeTest | MonkeyTypeResult
    ): number => {
      if (typeof test.timestamp === 'number') return test.timestamp
      const parsed = Date.parse(test.timestamp)
      return Number.isNaN(parsed) ? 0 : parsed
    }

    const historyTests = extractHistoryTests(historyData)

    // Get recent tests from history when available
    const recentTestsSource = historyTests.length ? historyTests : allTests
    const recentTests = [...recentTestsSource]
      .sort((a, b) => getTestTimestamp(b) - getTestTimestamp(a))
      .slice(0, 5)
      .map((test) => ({
        timestamp: new Date(getTestTimestamp(test)).toISOString(),
        wpm: getTestWpm(test),
        accuracy: getTestAccuracy(test),
        language:
          'language' in test
            ? test.language
            : 'lang' in test
              ? test.lang
              : undefined,
      }))

    const parseLanguageFromKey = (key: string): string | null => {
      if (!/[a-z]/i.test(key)) return null
      const cleaned = key
        .replace(/[_-]+/g, ' ')
        .replace(/\b\d+\b/g, '')
        .replace(/\s+/g, ' ')
        .trim()
      return cleaned.length ? cleaned : null
    }

    const languageMap = new Map<
      string,
      { language: string; tests: number; totalWpm: number; bestWpm: number }
    >()

    const addLanguageStat = (language: string | null, wpm: number) => {
      if (!language) return
      const normalized = language.trim()
      if (!normalized) return
      const entry = languageMap.get(normalized) || {
        language: normalized,
        tests: 0,
        totalWpm: 0,
        bestWpm: 0,
      }
      entry.tests += 1
      entry.totalWpm += wpm
      entry.bestWpm = Math.max(entry.bestWpm, wpm)
      languageMap.set(normalized, entry)
    }

    historyTests.forEach((test) =>
      addLanguageStat(test.language || test.lang || null, getTestWpm(test))
    )

    if (!languageMap.size) {
      const addFromPersonalBests = (pb: MonkeyTypePB | null) => {
        Object.entries(pb?.data || {}).forEach(([key, tests]) => {
          const language = parseLanguageFromKey(key)
          if (!language) return
          tests.forEach((test) => addLanguageStat(language, test.wpm))
        })
      }

      addFromPersonalBests(timeTests)
      addFromPersonalBests(wordTests)
    }

    if (!languageMap.size) {
      recentTests.forEach((test) =>
        addLanguageStat(test.language || null, test.wpm)
      )
    }

    const languageBreakdown = Array.from(languageMap.values())
      .map((entry) => ({
        language: entry.language,
        tests: entry.tests,
        averageWpm:
          entry.tests > 0 ? Math.round(entry.totalWpm / entry.tests) : 0,
        bestWpm: entry.bestWpm,
      }))
      .sort((a, b) =>
        b.tests === a.tests ? b.bestWpm - a.bestWpm : b.tests - a.tests
      )

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
        recentTests,
        languageBreakdown: languageBreakdown.length
          ? languageBreakdown
          : undefined,
      },
      lastUpdated: new Date().toISOString(),
    }
  } catch (error) {
    console.error('MonkeyType API error details:', error)
    // Only return null if we actually failed to fetch data
    return {
      typingStats: null,
      lastUpdated: new Date().toISOString(),
    }
  }
})
