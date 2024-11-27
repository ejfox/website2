import { defineEventHandler } from 'h3'

export default defineEventHandler(async (event): Promise<any> => {
  try {
    const config = useRuntimeConfig()
    const token = config.MONKEYTYPE_TOKEN
    const baseUrl = 'https://api.monkeytype.com'

    const fetchMonkeyType = async (endpoint: string) => {
      const url = `${baseUrl}${endpoint}`
      console.log('Fetching MonkeyType URL:', url)

      const response = await fetch(url, {
        headers: {
          Authorization: `ApeKey ${token.trim()}`,
          Accept: 'application/json',
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('MonkeyType API Error Response:', {
          status: response.status,
          url,
          error: errorText
        })
        throw createError({
          statusCode: response.status,
          message: `MonkeyType API Error: ${errorText}`
        })
      }

      const text = await response.text()
      console.log('MonkeyType Response:', text)
      return JSON.parse(text)
    }

    const [statsData, pbData] = await Promise.all([
      fetchMonkeyType('/users/stats'),
      fetchMonkeyType('/users/personalBests?mode=time')
    ])

    const stats = statsData?.data || {}
    const personalBests = pbData?.data || {}
    const time60Bests = personalBests['60'] || []

    return {
      Typing: {
        TimeTyping: stats.timeTyping || 0,
        CompletedTests: stats.completedTests || 0,
        StartedTests: stats.startedTests || 0,
        CurrentWPM: time60Bests[0]?.wpm || 0,
        BestWPM:
          time60Bests.length > 0
            ? Math.max(...time60Bests.map((t) => t.wpm))
            : 0,
        Accuracy: time60Bests[0]?.acc || 0,
        TestHistory: time60Bests.map((test) => ({
          Acc: test.acc,
          Consistency: test.consistency,
          Difficulty:
            test.difficulty.charAt(0).toUpperCase() + test.difficulty.slice(1),
          LazyMode: String(test.lazyMode),
          Language:
            test.language.charAt(0).toUpperCase() + test.language.slice(1),
          Punctuation: String(test.punctuation),
          Raw: test.raw,
          Wpm: test.wpm,
          Numbers: String(test.numbers),
          Timestamp: test.timestamp
        })),
        AverageWPM: time60Bests.length
          ? time60Bests.reduce((sum, test) => sum + test.wpm, 0) /
            time60Bests.length
          : 0
      }
    }
  } catch (error) {
    console.error('MonkeyType API Error:', error)
    return {
      Typing: {
        TimeTyping: 0,
        CompletedTests: 0,
        StartedTests: 0,
        CurrentWPM: 0,
        BestWPM: 0,
        Accuracy: 0
      }
    }
  }
})
