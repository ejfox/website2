/**
 * @file monkeytype.get.ts
 * @description Fetches MonkeyType typing test statistics including WPM, accuracy, and test completion data
 * @endpoint GET /api/monkeytype
 * @returns Typing statistics with best WPM, average WPM, tests completed, accuracy, consistency, and recent test results
 */
import { defineEventHandler, createError } from 'h3'
import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { dirname, join } from 'node:path'

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

// Stale-while-error cache + 5-minute TTL.
// MonkeyType ApeKey rate-limits aggressively (HTTP 479) when we hit /users/*
// from every request — caching keeps us under the threshold and survives
// upstream blips. lastGoodResponse never expires; freshExpiresAt gates the
// "is the current cache fresh enough to serve without re-fetching" check.
//
// Persisted to disk so cold container restarts don't reset to null. The cache
// path defaults to .cache/monkeytype-last-good.json relative to cwd; in Docker
// this should be a mounted volume so it survives container rebuilds (see
// docker-compose.yml volumes for the runtime-cache mount).
const FRESH_TTL_MS = 5 * 60 * 1000
const CACHE_FILE =
  process.env.MONKEYTYPE_CACHE_PATH ||
  join(process.cwd(), '.cache', 'monkeytype-last-good.json')

let lastGoodResponse: {
  typingStats: unknown
  lastUpdated: string
} | null = null
let freshExpiresAt = 0
let diskCacheLoaded = false

const loadDiskCache = async () => {
  if (diskCacheLoaded) return
  diskCacheLoaded = true
  try {
    const data = await readFile(CACHE_FILE, 'utf-8')
    const parsed = JSON.parse(data)
    if (parsed && parsed.typingStats) {
      lastGoodResponse = parsed
      console.warn(
        `MonkeyType: loaded persisted cache from ${parsed.lastUpdated}`
      )
    }
  } catch {
    // No cache file yet — first run after deploy. Will be created on first
    // successful upstream fetch.
  }
}

const persistDiskCache = async () => {
  if (!lastGoodResponse) return
  try {
    await mkdir(dirname(CACHE_FILE), { recursive: true })
    await writeFile(CACHE_FILE, JSON.stringify(lastGoodResponse))
  } catch (err) {
    console.warn('MonkeyType: failed to persist cache:', err)
  }
}

const staleOrNull = (reason: string) => {
  if (lastGoodResponse) {
    console.warn(`MonkeyType serving stale response (${reason})`)
    return { ...lastGoodResponse, stale: true }
  }
  return {
    typingStats: null,
    lastUpdated: new Date().toISOString(),
  }
}

export default defineEventHandler(async () => {
  // First request after process start: hydrate in-memory cache from disk so
  // container restarts don't drop us back to null until the next successful
  // upstream fetch.
  await loadDiskCache()

  // Serve fresh cache without a network call when within TTL
  if (lastGoodResponse && Date.now() < freshExpiresAt) {
    return lastGoodResponse
  }

  const config = useRuntimeConfig()
  const token = config.MONKEYTYPE_TOKEN

  if (!token?.trim()) {
    console.warn('MonkeyType token not configured')
    return staleOrNull('token not configured')
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
      // 404 = no data (e.g. user hasn't enabled results endpoint)
      // 429/479 = ApeKey rate-limited; fall back to whatever we have cached
      // rather than poisoning the response with an exception.
      if (
        response.status === 404 ||
        response.status === 429 ||
        response.status === 479
      ) {
        return null
      }
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
      makeOptionalRequest<MonkeyTypeStats>('/users/stats'),
      makeOptionalRequest<MonkeyTypePB>('/users/personalBests', {
        mode: 'time',
      }),
      makeOptionalRequest<MonkeyTypePB>('/users/personalBests', {
        mode: 'words',
      }),
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
      return staleOrNull('upstream returned no test data')
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

    // MonkeyType omits the `language` field entirely when the test was in
    // english (the account default), so a missing field means english — not
    // unknown. Without this, ~85% of typical histories silently drop out of
    // the language breakdown.
    const getTestLanguage = (
      test: MonkeyTypeTest | MonkeyTypeResult
    ): string => {
      const raw =
        ('language' in test && test.language) ||
        ('lang' in test && test.lang) ||
        ''
      return raw.trim() || 'english'
    }

    // Get recent tests from history when available
    const recentTestsSource = historyTests.length ? historyTests : allTests
    const recentTests = [...recentTestsSource]
      .sort((a, b) => getTestTimestamp(b) - getTestTimestamp(a))
      .slice(0, 5)
      .map((test) => ({
        timestamp: new Date(getTestTimestamp(test)).toISOString(),
        wpm: getTestWpm(test),
        accuracy: getTestAccuracy(test),
        language: getTestLanguage(test),
      }))

    const languageMap = new Map<
      string,
      { language: string; tests: number; totalWpm: number; bestWpm: number }
    >()

    const addLanguageStat = (language: string, wpm: number) => {
      const entry = languageMap.get(language) || {
        language,
        tests: 0,
        totalWpm: 0,
        bestWpm: 0,
      }
      entry.tests += 1
      entry.totalWpm += wpm
      entry.bestWpm = Math.max(entry.bestWpm, wpm)
      languageMap.set(language, entry)
    }

    historyTests.forEach((test) =>
      addLanguageStat(getTestLanguage(test), getTestWpm(test))
    )

    // Fallback: PB data carries `language` reliably on every entry. Use it
    // when /results is unavailable.
    if (!languageMap.size) {
      const addFromPersonalBests = (pb: MonkeyTypePB | null) => {
        Object.values(pb?.data || {}).forEach((tests) => {
          tests.forEach((test) =>
            addLanguageStat(getTestLanguage(test), test.wpm)
          )
        })
      }

      addFromPersonalBests(timeTests)
      addFromPersonalBests(wordTests)
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

    const response = {
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
    lastGoodResponse = response
    freshExpiresAt = Date.now() + FRESH_TTL_MS
    // Fire-and-forget disk persistence — don't block the response on filesystem.
    void persistDiskCache()
    return response
  } catch (error) {
    console.error('MonkeyType API error details:', error)
    return staleOrNull('upstream threw')
  }
})
