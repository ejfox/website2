/**
 * Cal.com Webhook Endpoint
 * Receives booking events from Cal.com for funnel analytics
 *
 * Setup in Cal.com:
 * 1. Go to Settings → Developer → Webhooks
 * 2. Add webhook URL: https://ejfox.com/api/webhooks/calcom
 * 3. Select events: BOOKING_CREATED, BOOKING_CANCELLED, BOOKING_RESCHEDULED
 * 4. Copy the signing secret to CALCOM_WEBHOOK_SECRET env var
 */

interface CalcomBookingPayload {
  triggerEvent: string
  createdAt: string
  payload: {
    title: string
    startTime: string
    endTime: string
    attendees: Array<{
      email: string
      name: string
      timeZone: string
    }>
    organizer: {
      email: string
      name: string
    }
    responses?: Record<string, { value: string }>
    metadata?: Record<string, unknown>
  }
}

export default defineEventHandler(async (event) => {
  const body = await readBody<CalcomBookingPayload>(event)

  // Log for debugging (remove in production or use proper logging)
  console.log('[Cal.com Webhook]', {
    event: body.triggerEvent,
    time: body.createdAt,
    attendee: body.payload?.attendees?.[0]?.email,
  })

  // Extract booking questions responses if available
  const responses = body.payload?.responses || {}
  const projectDescription = responses['what-is-the-project']?.value
  const timeline = responses['timeline']?.value
  const budget = responses['budget-range']?.value
  const source = responses['how-did-you-find-me']?.value

  // Track different events
  switch (body.triggerEvent) {
    case 'BOOKING_CREATED':
      // Log booking with metadata for analysis
      console.log('[Funnel] Booking created', {
        budget,
        timeline,
        source,
        hasProjectDescription: !!projectDescription,
      })
      break

    case 'BOOKING_CANCELLED':
      console.log('[Funnel] Booking cancelled', {
        reason: body.payload?.metadata?.cancellationReason,
      })
      break

    case 'BOOKING_RESCHEDULED':
      console.log('[Funnel] Booking rescheduled')
      break

    case 'BOOKING_NO_SHOW_UPDATED':
      console.log('[Funnel] No-show recorded')
      break
  }

  // Return 200 to acknowledge receipt
  return { received: true, event: body.triggerEvent }
})
