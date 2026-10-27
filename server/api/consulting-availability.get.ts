/**
 * @file consulting-availability.get.ts
 * @description GET /api/consulting-availability. Hand-edited consulting capacity
 *   from data/consulting-availability.json, for pages/consulting: active client
 *   COUNT and hours (never client names), next-available date, current/next
 *   quarter status + message, all quarters. Read per request, no cache.
 *   Never throws: a missing or bad file returns status 'unknown' with a
 *   hardcoded fallback quarter name.
 */
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

interface Client {
  name: string
  hoursPerWeek: number
  startDate: string
  endDate: string | null
}

interface QuarterInfo {
  status: 'available' | 'limited' | 'full' | 'unknown'
  slotsAvailable: number | null
  notes: string
}

interface AvailabilityData {
  lastUpdated: string
  maxClients: number
  hoursPerWeekRange: [number, number]
  currentClients: Client[]
  nextAvailable?: string
  quarters: Record<string, QuarterInfo>
  statusMessages: Record<string, string>
}

export default defineEventHandler(async () => {
  try {
    const dataPath = join(process.cwd(), 'data', 'consulting-availability.json')
    const rawData = readFileSync(dataPath, 'utf-8')
    const data: AvailabilityData = JSON.parse(rawData)

    // Calculate current quarter
    const now = new Date()
    const quarter = Math.ceil((now.getMonth() + 1) / 3)
    const year = now.getFullYear()
    const currentQuarter = `Q${quarter} ${year}`
    const nextQuarter = `Q${quarter === 4 ? 1 : quarter + 1} ${quarter === 4 ? year + 1 : year}`

    // Get active clients (no end date or end date in future)
    // Client names stay server-side; only the count and summed hours ship.
    const activeClients = data.currentClients.filter(
      (c) => !c.endDate || new Date(c.endDate) > now
    )

    // Calculate total hours committed
    const totalHoursCommitted = activeClients.reduce(
      (sum, c) => sum + c.hoursPerWeek,
      0
    )

    // Get current and next quarter info
    const currentQuarterInfo = data.quarters[currentQuarter] || {
      status: 'unknown',
      slotsAvailable: null,
      notes: 'Check back soon',
    }
    const nextQuarterInfo = data.quarters[nextQuarter] || {
      status: 'unknown',
      slotsAvailable: null,
      notes: 'Check back soon',
    }

    return {
      lastUpdated: data.lastUpdated,
      maxClients: data.maxClients,
      hoursPerWeekRange: data.hoursPerWeekRange,
      activeClientCount: activeClients.length,
      totalHoursCommitted,
      // A past date means "available now", not "opens <old date>"
      nextAvailable:
        data.nextAvailable && new Date(data.nextAvailable) > now
          ? data.nextAvailable
          : null,
      currentQuarter: {
        name: currentQuarter,
        ...currentQuarterInfo,
        message: data.statusMessages[currentQuarterInfo.status],
      },
      nextQuarter: {
        name: nextQuarter,
        ...nextQuarterInfo,
        message: data.statusMessages[nextQuarterInfo.status],
      },
      // Include all quarters for display
      allQuarters: Object.entries(data.quarters).map(([name, info]) => ({
        name,
        ...info,
        message: data.statusMessages[info.status],
        isCurrent: name === currentQuarter,
      })),
    }
  } catch (error) {
    console.error('Error reading consulting availability:', error)
    return {
      // These fallback quarter names are hardcoded and go stale.
      error: 'Could not load availability data',
      currentQuarter: {
        name: 'Q1 2025',
        status: 'unknown',
        message: 'Check back soon',
      },
      nextQuarter: {
        name: 'Q2 2025',
        status: 'unknown',
        message: 'Check back soon',
      },
      allQuarters: [],
      activeClientCount: 0,
      maxClients: 3,
      nextAvailable: null,
    }
  }
})
