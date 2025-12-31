/**
 * Funnel tracking for consulting pipeline
 * Tracks: page views → scroll depth → cal interactions → bookings
 */

interface FunnelEvent {
  name: string
  data?: Record<string, string | number | boolean>
}

declare global {
  interface Window {
    umami?: {
      track: (
        event: string,
        data?: Record<string, string | number | boolean>
      ) => void
    }
  }
}

export function useFunnelTracking() {
  const route = useRoute()

  /**
   * Track a funnel event to Umami
   */
  function trackEvent(event: FunnelEvent) {
    if (import.meta.client && window.umami) {
      window.umami.track(event.name, event.data)
    }
  }

  /**
   * Track scroll depth on a page
   * Call this in onMounted for pages where scroll depth matters
   */
  function trackScrollDepth(thresholds: number[] = [25, 50, 75, 90]) {
    if (!import.meta.client) return

    const tracked = new Set<number>()

    const handleScroll = () => {
      const scrollTop = window.scrollY
      const docHeight =
        document.documentElement.scrollHeight - window.innerHeight
      const scrollPercent = Math.round((scrollTop / docHeight) * 100)

      for (const threshold of thresholds) {
        if (scrollPercent >= threshold && !tracked.has(threshold)) {
          tracked.add(threshold)
          trackEvent({
            name: 'scroll_depth',
            data: {
              page: route.path,
              depth: threshold,
            },
          })
        }
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })

    onUnmounted(() => {
      window.removeEventListener('scroll', handleScroll)
    })
  }

  /**
   * Track time on page
   * Fires events at specified intervals
   */
  function trackTimeOnPage(intervalsSeconds: number[] = [30, 60, 120, 300]) {
    if (!import.meta.client) return

    const tracked = new Set<number>()
    const startTime = Date.now()

    const interval = setInterval(() => {
      const elapsedSeconds = Math.floor((Date.now() - startTime) / 1000)

      for (const threshold of intervalsSeconds) {
        if (elapsedSeconds >= threshold && !tracked.has(threshold)) {
          tracked.add(threshold)
          trackEvent({
            name: 'time_on_page',
            data: {
              page: route.path,
              seconds: threshold,
            },
          })
        }
      }
    }, 5000)

    onUnmounted(() => {
      clearInterval(interval)
    })
  }

  /**
   * Track consulting funnel specific events
   */
  const funnel = {
    // Page entry points (include attribution context)
    viewedConsulting: () => {
      const { getFirstTouchAttribution } = useAttribution()
      const attr = getFirstTouchAttribution()
      trackEvent({
        name: 'funnel_consulting_view',
        data: attr ? { channel: attr.channel || 'unknown' } : undefined,
      })
    },
    viewedProcess: () => trackEvent({ name: 'funnel_process_view' }),
    viewedCalendar: () => {
      const { getFirstTouchAttribution } = useAttribution()
      const attr = getFirstTouchAttribution()
      trackEvent({
        name: 'funnel_calendar_view',
        data: attr ? { channel: attr.channel || 'unknown' } : undefined,
      })
    },
    viewedWork: () => trackEvent({ name: 'funnel_work_view' }),

    // Consulting page sections (track when scrolled into view)
    sawPricing: () => trackEvent({ name: 'funnel_saw_pricing' }),
    sawSpecialties: () => trackEvent({ name: 'funnel_saw_specialties' }),
    sawNotFit: () => trackEvent({ name: 'funnel_saw_not_fit' }),

    // CTA interactions
    clickedBookCall: (source: string) =>
      trackEvent({
        name: 'funnel_click_book_call',
        data: { source },
      }),

    clickedEmail: () => trackEvent({ name: 'funnel_click_email' }),

    // Calendar page
    calendarLoaded: () => trackEvent({ name: 'funnel_calendar_loaded' }),

    // Cal.com events (called from calendar page when Cal.com fires events)
    calEventSelected: () => trackEvent({ name: 'funnel_cal_event_selected' }),
    calTimeSelected: () => trackEvent({ name: 'funnel_cal_time_selected' }),
    calFormStarted: () => trackEvent({ name: 'funnel_cal_form_started' }),
    calBookingComplete: () =>
      trackEvent({ name: 'funnel_cal_booking_complete' }),
  }

  return {
    trackEvent,
    trackScrollDepth,
    trackTimeOnPage,
    funnel,
  }
}
