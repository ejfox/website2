/**
 * @file cal/available-slots.get.ts
 * @description Fetches next available calendar slots from Cal.com API for booking meetings
 * @endpoint GET /api/cal/available-slots
 * @query duration - '30min' or '1hr' (default: '1hr')
 * @query days - number of days to look ahead (default: 14)
 * @returns Formatted calendar slots with natural time display and booking URLs
 */
export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const query = getQuery(event)

  const duration = (query.duration as string) || '1hr'
  const daysAhead = Number(query.days) || 14

  if (!config.calcomApiKey) {
    console.warn('CAL_COM_API_KEY not configured')
    return { slots: [], error: 'Calendar not configured' }
  }

  try {
    const startDate = new Date()
    const endDate = new Date()
    endDate.setDate(startDate.getDate() + daysAhead)

    const startISO = startDate.toISOString()
    const endISO = endDate.toISOString()

    // Cal.com API call - event type is "30min" but supports multiple durations
    // Duration options: 20, 45, 60, 90 minutes
    const eventTypeSlug = '30min' // The event type slug on Cal.com
    const durationMinutes = duration === '30min' ? 20 : 60 // Default meeting lengths

    const response = (await $fetch('https://api.cal.com/v2/slots', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${config.calcomApiKey}`,
        'Content-Type': 'application/json',
        'cal-api-version': '2024-09-04',
      },
      query: {
        eventTypeSlug,
        username: 'ejfox',
        start: startISO,
        end: endISO,
        timeZone: 'America/New_York',
        format: 'range',
      },
    })) as { data?: Record<string, Array<{ start: string; end?: string }>> }

    if (!response.data) {
      return { slots: [] }
    }

    // Flatten and sort all available slots
    const allSlots: Array<{ start: string; end?: string; date: string }> = []

    Object.entries(response.data).forEach(([date, slots]) => {
      if (Array.isArray(slots)) {
        slots.forEach((slot) => {
          allSlots.push({
            start: slot.start,
            end: slot.end,
            date,
          })
        })
      }
    })

    // Sort by start time, dedupe by datetime, take next 3
    const seenTimes = new Set<string>()
    const sortedSlots = allSlots
      .filter((slot) => new Date(slot.start) > new Date()) // Only future slots
      .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
      .filter((slot) => {
        if (seenTimes.has(slot.start)) return false
        seenTimes.add(slot.start)
        return true
      })
      .slice(0, 3)

    // Format for display - verbose date/time info
    const formattedSlots = sortedSlots.map((slot) => {
      const startTime = new Date(slot.start)
      const now = new Date()

      const timeOptions: Intl.DateTimeFormatOptions = {
        timeZone: 'America/New_York',
        hour: 'numeric',
        hour12: true,
      }
      const dayOptions: Intl.DateTimeFormatOptions = {
        timeZone: 'America/New_York',
        weekday: 'long',
      }
      const dateOptions: Intl.DateTimeFormatOptions = {
        timeZone: 'America/New_York',
        month: 'short',
        day: 'numeric',
      }

      const time = startTime
        .toLocaleString('en-US', timeOptions)
        .replace(' ', '')
        .toLowerCase() // "9am"
      const day = startTime.toLocaleString('en-US', dayOptions) // "Monday"
      const date = startTime.toLocaleString('en-US', dateOptions) // "Jan 1"

      // Calculate relative description
      const diffDays = Math.floor(
        (startTime.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      )
      let relative = ''
      if (diffDays === 0) relative = 'Today'
      else if (diffDays === 1) relative = 'Tomorrow'
      else if (diffDays < 7) relative = 'This week'
      else if (diffDays < 14) relative = 'Next week'

      return {
        time,
        day,
        date, // "Jan 1"
        relative, // "Tomorrow", "This week", etc.
        naturalTime: `${time} ${day}?`, // "9am Monday?"
        datetime: slot.start,
        bookingUrl: `https://cal.com/ejfox/${eventTypeSlug}?duration=${durationMinutes}&date=${startTime.toISOString().split('T')[0]}&slot=${encodeURIComponent(slot.start)}`,
      }
    })

    return {
      slots: formattedSlots,
      lastUpdated: new Date().toISOString(),
    }
  } catch (error) {
    console.error('Cal.com API error:', error)
    return {
      slots: [],
      error: 'Failed to fetch available slots',
    }
  }
})
