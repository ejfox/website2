export default defineEventHandler(async (_event) => {
  const _config = useRuntimeConfig()

  try {
    // Get next 7 days to find available slots
    const startDate = new Date()
    const endDate = new Date()
    endDate.setDate(startDate.getDate() + 7)

    const startISO = startDate.toISOString()
    const endISO = endDate.toISOString()

    // Cal.com API call for your 30min event type
    const response = await $fetch('https://api.cal.com/v2/slots', {
      method: 'GET',
      headers: {
        Authorization: `Bearer cal_live_556d97a3add1c087738058a73b2d697c`,
        'Content-Type': 'application/json',
        'cal-api-version': '2024-09-04'
      },
      query: {
        eventTypeSlug: '30min',
        username: 'ejfox',
        start: startISO,
        end: endISO,
        timeZone: 'America/New_York',
        format: 'range'
      }
    })

    if (!response.data) {
      return { slots: [] }
    }

    // Flatten and sort all available slots
    const allSlots: Array<{ start: string; end?: string; date: string }> = []

    Object.entries(response.data).forEach(([date, slots]) => {
      if (Array.isArray(slots)) {
        slots.forEach((slot: any) => {
          allSlots.push({
            start: slot.start,
            end: slot.end,
            date
          })
        })
      }
    })

    // Sort by start time and take next 3
    const sortedSlots = allSlots
      .filter((slot) => new Date(slot.start) > new Date()) // Only future slots
      .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
      .slice(0, 3)

    // Format for display - natural like "9AM Monday?"
    const formattedSlots = sortedSlots.map((slot) => {
      const startTime = new Date(slot.start)
      const timeOptions: Intl.DateTimeFormatOptions = {
        timeZone: 'America/New_York',
        hour: 'numeric',
        hour12: true
      }
      const dayOptions: Intl.DateTimeFormatOptions = {
        timeZone: 'America/New_York',
        weekday: 'long'
      }

      const time = startTime
        .toLocaleString('en-US', timeOptions)
        .replace(' ', '')
        .toLowerCase() // "9am"
      const day = startTime.toLocaleString('en-US', dayOptions) // "Monday"

      return {
        time,
        day,
        naturalTime: `${time} ${day}?`, // "9am Monday?"
        datetime: slot.start,
        bookingUrl: `https://cal.com/ejfox/30min?date=${startTime.toISOString().split('T')[0]}&slot=${encodeURIComponent(slot.start)}`
      }
    })

    return {
      slots: formattedSlots,
      lastUpdated: new Date().toISOString()
    }
  } catch (error) {
    console.error('Cal.com API error:', error)
    return {
      slots: [],
      error: 'Failed to fetch available slots'
    }
  }
})
