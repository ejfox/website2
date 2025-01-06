import { defineEventHandler, createError } from 'h3'

interface RescueTimeRow {
  date: string
  seconds: number
  activity: string
  category: string
  productivity: number
}

interface TimeBreakdown {
  seconds: number
  minutes: number
  hours: number
  hoursDecimal: number
  formatted: string
}

interface ProcessedData {
  categories: Array<{
    name: string
    time: TimeBreakdown
    percentageOfTotal: number
    productivity: number
  }>
  activities: Array<{
    name: string
    time: TimeBreakdown
    percentageOfTotal: number
    category: string
    productivity: number
  }>
  summary: {
    total: TimeBreakdown
    productive: {
      time: TimeBreakdown
      percentage: number
    }
    distracting: {
      time: TimeBreakdown
      percentage: number
    }
    neutral: {
      time: TimeBreakdown
      percentage: number
    }
  }
  lastUpdated: string
}

interface RescueTimeResponse {
  rows: Array<[string, number, number, string, string, number]>
  row_headers: string[]
}

function calculateTimeBreakdown(seconds: number): TimeBreakdown {
  return {
    seconds,
    minutes: Math.floor(seconds / 60),
    hours: Math.floor(seconds / 3600),
    hoursDecimal: Math.round((seconds / 3600) * 100) / 100,
    formatted: `${Math.floor(seconds / 3600)}h ${Math.floor(
      (seconds % 3600) / 60
    )}m`
  }
}

export default defineEventHandler(async () => {
  const config = useRuntimeConfig()
  const token = config.rescuetimeToken

  if (!token) {
    throw createError({
      statusCode: 500,
      message: 'RescueTime token not configured'
    })
  }

  try {
    // Following the documented example query format:
    // https://www.rescuetime.com/anapi/data?key=YOUR_API_KEY&perspective=rank&restrict_kind=overview&restrict_begin=2020-01-01&restrict_end=2020-01-01&format=json
    const response = await $fetch<RescueTimeResponse>(
      'https://www.rescuetime.com/anapi/data',
      {
        params: {
          key: token,
          format: 'json',
          perspective: 'rank',
          restrict_kind: 'overview',
          restrict_begin: '2024-01-01',
          restrict_end: '2024-01-05'
        }
      }
    )

    const rows: RescueTimeRow[] = response.rows.map((row: any[]) => ({
      date: row[0],
      seconds: row[1],
      activity: row[3],
      category: row[4],
      productivity: row[5]
    }))

    const totalSeconds = rows.reduce((sum, row) => sum + row.seconds, 0)

    // Group by category
    const categoryMap = new Map()
    rows.forEach((row) => {
      if (!categoryMap.has(row.category)) {
        categoryMap.set(row.category, {
          name: row.category,
          seconds: 0,
          productivity: row.productivity
        })
      }
      const cat = categoryMap.get(row.category)
      cat.seconds += row.seconds
    })

    // Group by activity (only store top 10 by time)
    const activityMap = new Map()
    rows.forEach((row) => {
      if (!activityMap.has(row.activity)) {
        activityMap.set(row.activity, {
          name: row.activity,
          seconds: 0,
          category: row.category,
          productivity: row.productivity
        })
      }
      const act = activityMap.get(row.activity)
      act.seconds += row.seconds
    })

    // Sort activities by time and get top 10
    const activities = Array.from(activityMap.values())
      .sort((a, b) => b.seconds - a.seconds)
      .slice(0, 10)
      .map((act) => ({
        name: act.name,
        time: calculateTimeBreakdown(act.seconds),
        percentageOfTotal: Math.round((act.seconds / totalSeconds) * 100),
        category: act.category,
        productivity: act.productivity
      }))

    // Process categories
    const categories = Array.from(categoryMap.values())
      .sort((a, b) => b.seconds - a.seconds)
      .map((cat) => ({
        name: cat.name,
        time: calculateTimeBreakdown(cat.seconds),
        percentageOfTotal: Math.round((cat.seconds / totalSeconds) * 100),
        productivity: cat.productivity
      }))

    // Calculate summary
    const productiveSeconds = rows
      .filter((row) => row.productivity > 0)
      .reduce((sum, row) => sum + row.seconds, 0)

    const distractingSeconds = rows
      .filter((row) => row.productivity < 0)
      .reduce((sum, row) => sum + row.seconds, 0)

    const neutralSeconds = rows
      .filter((row) => row.productivity === 0)
      .reduce((sum, row) => sum + row.seconds, 0)

    return {
      categories,
      activities,
      summary: {
        total: calculateTimeBreakdown(totalSeconds),
        productive: {
          time: calculateTimeBreakdown(productiveSeconds),
          percentage: Math.round((productiveSeconds / totalSeconds) * 100)
        },
        distracting: {
          time: calculateTimeBreakdown(distractingSeconds),
          percentage: Math.round((distractingSeconds / totalSeconds) * 100)
        },
        neutral: {
          time: calculateTimeBreakdown(neutralSeconds),
          percentage: Math.round((neutralSeconds / totalSeconds) * 100)
        }
      },
      lastUpdated: new Date().toISOString()
    }
  } catch (error: any) {
    console.error('RescueTime API error:', error)
    throw createError({
      statusCode: 500,
      message: `Failed to fetch RescueTime data: ${error.message}`
    })
  }
})
