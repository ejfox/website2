/**
 * @file cal/availability.get.ts
 * @description Returns quarterly availability status from Cal.com
 * @endpoint GET /api/cal/availability
 * @returns Current quarter, available slots count, and booking status
 */
export default defineEventHandler(async () => {
  const config = useRuntimeConfig()

  // Quarterly capacity - adjust based on your actual capacity
  const SLOTS_PER_QUARTER = 3 // Max clients per quarter

  const now = new Date()
  const quarter = Math.ceil((now.getMonth() + 1) / 3)
  const year = now.getFullYear()
  const quarterName = `Q${quarter} ${year}`

  // Calculate quarter date range
  const quarterStart = new Date(year, (quarter - 1) * 3, 1)
  const quarterEnd = new Date(year, quarter * 3, 0)

  if (!config.calcomApiKey) {
    // Fallback when API key not configured
    return {
      quarter: quarterName,
      slotsTotal: SLOTS_PER_QUARTER,
      slotsBooked: 0,
      slotsAvailable: SLOTS_PER_QUARTER,
      status: 'available',
      message: `${SLOTS_PER_QUARTER} spots open for ${quarterName}`,
      nextQuarter: `Q${quarter === 4 ? 1 : quarter + 1} ${quarter === 4 ? year + 1 : year}`,
    }
  }

  try {
    // Fetch bookings for this quarter from Cal.com
    const response = (await $fetch('https://api.cal.com/v2/bookings', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${config.calcomApiKey}`,
        'Content-Type': 'application/json',
        'cal-api-version': '2024-09-04',
      },
      query: {
        status: 'upcoming,past',
        afterStart: quarterStart.toISOString(),
        beforeEnd: quarterEnd.toISOString(),
      },
    })) as { data?: Array<{ status: string; startTime: string }> }

    // Count confirmed bookings (not cancelled)
    const bookings = response.data || []
    const confirmedBookings = bookings.filter(
      (b) => b.status !== 'CANCELLED' && b.status !== 'REJECTED'
    )

    // For consulting, count unique booking days/engagements
    // This is a simplification - you might want to track actual engagements separately
    const slotsBooked = Math.min(confirmedBookings.length, SLOTS_PER_QUARTER)
    const slotsAvailable = Math.max(0, SLOTS_PER_QUARTER - slotsBooked)

    let status: 'available' | 'limited' | 'full'
    let message: string

    if (slotsAvailable === 0) {
      status = 'full'
      message = `Fully booked for ${quarterName}`
    } else if (slotsAvailable === 1) {
      status = 'limited'
      message = `1 spot left for ${quarterName}`
    } else {
      status = 'available'
      message = `${slotsAvailable} spots open for ${quarterName}`
    }

    return {
      quarter: quarterName,
      slotsTotal: SLOTS_PER_QUARTER,
      slotsBooked,
      slotsAvailable,
      status,
      message,
      nextQuarter: `Q${quarter === 4 ? 1 : quarter + 1} ${quarter === 4 ? year + 1 : year}`,
      lastUpdated: new Date().toISOString(),
    }
  } catch (error) {
    console.error('Cal.com availability API error:', error)

    // Graceful fallback
    return {
      quarter: quarterName,
      slotsTotal: SLOTS_PER_QUARTER,
      slotsBooked: 0,
      slotsAvailable: SLOTS_PER_QUARTER,
      status: 'available',
      message: `${SLOTS_PER_QUARTER} spots open for ${quarterName}`,
      error: 'Could not fetch live availability',
    }
  }
})
