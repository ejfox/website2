/**
 * Micro-conversion tracking for granular funnel analysis
 *
 * Tracks small steps that lead to macro conversions (bookings).
 * Each micro-conversion is a signal of intent progression.
 *
 * Based on: https://usermaven.com/blog/conversion-funnel-analysis
 */

interface MicroConversion {
  name: string
  step: number
  value?: number // Optional revenue value attribution
  metadata?: Record<string, string | number | boolean>
}

// Funnel steps with expected conversion rates (B2B benchmarks)
// Source: https://firstpagesage.com/seo-blog/b2b-saas-funnel-conversion-benchmarks-fc/
export const FUNNEL_BENCHMARKS = {
  visitor_to_engaged: 0.35, // 35% of visitors scroll/engage
  engaged_to_interested: 0.2, // 20% click to learn more
  interested_to_calendar: 0.15, // 15% visit calendar
  calendar_to_booking: 0.25, // 25% of calendar visitors book
  booking_to_meeting: 0.8, // 80% of bookings happen (no-show rate 20%)
  meeting_to_proposal: 0.6, // 60% get a proposal
  proposal_to_close: 0.3, // 30% close rate
}

export function useMicroConversions() {
  const { trackEvent } = useFunnelTracking()

  /**
   * Track a micro-conversion event
   */
  function trackMicro(conversion: MicroConversion) {
    trackEvent({
      name: `micro_${conversion.name}`,
      data: {
        step: conversion.step,
        ...(conversion.value ? { value: conversion.value } : {}),
        ...(conversion.metadata || {}),
      },
    })

    // Also track to Clarity if available
    if (
      import.meta.client &&
      (
        window as unknown as {
          clarity?: (cmd: string, ...args: unknown[]) => void
        }
      ).clarity
    ) {
      ;(
        window as unknown as {
          clarity: (cmd: string, ...args: unknown[]) => void
        }
      ).clarity('set', 'funnel_step', conversion.step.toString())
      ;(
        window as unknown as {
          clarity: (cmd: string, ...args: unknown[]) => void
        }
      ).clarity('set', 'micro_conversion', conversion.name)
    }
  }

  // Pre-defined micro-conversions for consulting funnel
  const micro = {
    // Step 1: Awareness (visitor arrives)
    landed: (page: string) =>
      trackMicro({ name: 'landed', step: 1, metadata: { page } }),

    // Step 2: Engagement (shows interest)
    scrolledPastFold: () => trackMicro({ name: 'scrolled_past_fold', step: 2 }),

    readFor30Seconds: () => trackMicro({ name: 'read_30s', step: 2 }),

    readFor60Seconds: () => trackMicro({ name: 'read_60s', step: 2 }),

    // Step 3: Interest (exploring offering)
    viewedPricing: () => trackMicro({ name: 'viewed_pricing', step: 3 }),

    viewedCaseStudies: () =>
      trackMicro({ name: 'viewed_case_studies', step: 3 }),

    viewedProcess: () => trackMicro({ name: 'viewed_process', step: 3 }),

    clickedCTA: (location: string) =>
      trackMicro({ name: 'clicked_cta', step: 3, metadata: { location } }),

    // Step 4: Consideration (calendar page)
    viewedCalendar: () => trackMicro({ name: 'viewed_calendar', step: 4 }),

    calendarLoaded: () => trackMicro({ name: 'calendar_loaded', step: 4 }),

    // Step 5: Intent (interacting with calendar)
    selectedDate: () => trackMicro({ name: 'selected_date', step: 5 }),

    selectedTime: () => trackMicro({ name: 'selected_time', step: 5 }),

    startedForm: () => trackMicro({ name: 'started_form', step: 5 }),

    // Step 6: Conversion (booking complete)
    completedBooking: () => trackMicro({ name: 'completed_booking', step: 6 }),

    // Step 7: Post-booking
    viewedConfirmation: () =>
      trackMicro({ name: 'viewed_confirmation', step: 7 }),

    addedToCalendar: () => trackMicro({ name: 'added_to_calendar', step: 7 }),
  }

  return {
    trackMicro,
    micro,
    FUNNEL_BENCHMARKS,
  }
}
