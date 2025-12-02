import { readFileSync, existsSync } from 'fs'
import { join } from 'path'

interface DayItem {
  year: number
  [key: string]: any
}

interface DayData {
  [sourceType: string]: DayItem[]
}

// Cache for individual day files
const dayCache: Map<string, { data: DayData, time: number }> = new Map()
const CACHE_TTL = 60 * 60 * 1000 // 1 hour

function loadDay(key: string): DayData {
  const now = Date.now()
  const cached = dayCache.get(key)
  if (cached && now - cached.time < CACHE_TTL) {
    return cached.data
  }

  try {
    const dayPath = join(process.cwd(), `data/on-this-day/${key}.json`)
    if (existsSync(dayPath)) {
      const data = JSON.parse(readFileSync(dayPath, 'utf-8'))
      dayCache.set(key, { data, time: now })
      return data
    }
    return {}
  } catch {
    return {}
  }
}

export default defineEventHandler((event) => {
  const query = getQuery(event)

  // Get month/day from query or use today
  const now = new Date()
  const month = query.month ? Number(query.month) : now.getMonth() + 1
  const day = query.day ? Number(query.day) : now.getDate()

  if (month < 1 || month > 12 || day < 1 || day > 31) {
    throw createError({ statusCode: 400, message: 'Invalid month or day' })
  }

  const key = `${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  const dayData = loadDay(key)

  // Auto-group all source types by year
  const years: { [year: number]: DayData } = {}

  for (const [sourceType, items] of Object.entries(dayData)) {
    if (!Array.isArray(items)) continue

    for (const item of items) {
      if (!item.year) continue
      if (!years[item.year]) years[item.year] = {}
      if (!years[item.year][sourceType]) years[item.year][sourceType] = []
      years[item.year][sourceType].push(item)
    }
  }

  // Sort years descending
  const sortedYears = Object.keys(years)
    .map(Number)
    .sort((a, b) => b - a)
    .map(year => ({ year, ...years[year] }))

  // Auto-generate totals for each source type
  const totals: { [key: string]: number } = {}
  for (const [sourceType, items] of Object.entries(dayData)) {
    if (Array.isArray(items)) {
      totals[`total_${sourceType}`] = items.length
    }
  }

  return {
    month,
    day,
    key,
    ...totals,
    years: sortedYears
  }
})
