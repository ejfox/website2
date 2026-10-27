/**
 * @file cal/available-slots.get.ts
 * @description GET /api/cal/available-slots?duration=30min|1hr&days=14&spread=day.
 *   The next 3 open Cal.com slots for /calendar, /consulting and
 *   NextAvailableSlot.vue: { slots: [{ time, day, date, relative, naturalTime,
 *   datetime, bookingUrl }], lastUpdated }. spread=day takes the earliest slot
 *   on each of the next 3 open days instead of the next 3 (usually
 *   back-to-back) slots. Times formatted in America/New_York.
 *   Env CAL_COM_API_KEY (runtimeConfig calcomApiKey). Cached 2 min with swr.
 *   Never throws: no key or an API error returns { slots: [], error }.
 */
// Cached briefly: /calendar, /consulting and the homepage all hit this, and
// each miss is a live Cal.com API call. Keyed on the full URL (query incl.).
// A slot booked inside the window just fails on Cal.com's side, not ours.
export default defineCachedEventHandler(
  async (event) => {
    const config = useRuntimeConfig()
    const query = getQuery(event)

    const duration = (query.duration as string) || '1hr'
    const daysAhead = Number(query.days) || 14
    const spreadByDay = query.spread === 'day'

    // Fall back to process.env at runtime: production builds on the GH runner
    // without secrets, so the baked runtimeConfig value is empty and the real
    // key only exists in the VPS .env (same pattern as lastfm/github endpoints).
    const calcomApiKey = config.calcomApiKey || process.env.CAL_COM_API_KEY

    if (!calcomApiKey) {
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

      // Explicit generic bypasses Nitro's typed-route inference (TS2321).
      const response = await $fetch<{
        data?: Record<string, Array<{ start: string; end?: string }>>
      }>('https://api.cal.com/v2/slots', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${calcomApiKey}`,
          'Content-Type': 'application/json',
          'cal-api-version': '2024-09-04',
        },
        query: {
          eventTypeSlug,
          username: 'ejfox',
          start: startISO,
          end: endISO,
          timeZone: 'America/New_York',
          duration: durationMinutes,
          format: 'range',
        },
      })

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

      // Sort by start time, dedupe by datetime (or by day with spread=day),
      // take next 3. `date` is Cal.com's day key, already in America/New_York.
      const seen = new Set<string>()
      const sortedSlots = allSlots
        .filter((slot) => new Date(slot.start) > new Date()) // Only future slots
        .sort(
          (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime()
        )
        .filter((slot) => {
          const key = spreadByDay ? slot.date : slot.start
          if (seen.has(key)) return false
          seen.add(key)
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
          minute: '2-digit',
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
          .replace(':00', '')
          .toLowerCase() // "9am", "11:20am"
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
  },
  { maxAge: 120, swr: true, name: 'cal-available-slots' }
)
