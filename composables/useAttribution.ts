/**
 * Attribution tracking for marketing channels
 * Captures UTM parameters, referrer, and landing page on first visit
 * Persists through localStorage for first-touch attribution
 */

export interface AttributionData {
  // UTM parameters
  utm_source?: string
  utm_medium?: string
  utm_campaign?: string
  utm_content?: string
  utm_term?: string

  // Additional context
  referrer?: string
  landing_page?: string
  timestamp?: string

  // Computed
  channel?: string // Derived channel grouping
}

const STORAGE_KEY = 'ejfox_attribution'
const STORAGE_KEY_FIRST = 'ejfox_attribution_first' // Never overwritten

/**
 * Channel grouping based on UTM/referrer
 */
function deriveChannel(data: AttributionData): string {
  const source = data.utm_source?.toLowerCase() || ''
  const medium = data.utm_medium?.toLowerCase() || ''
  const referrer = data.referrer?.toLowerCase() || ''

  // Paid channels
  if (medium.includes('cpc') || medium.includes('ppc') || medium.includes('paid')) {
    return 'paid'
  }

  // Social
  if (
    medium === 'social' ||
    source.includes('twitter') ||
    source.includes('linkedin') ||
    source.includes('facebook') ||
    source.includes('instagram') ||
    referrer.includes('twitter.com') ||
    referrer.includes('t.co') ||
    referrer.includes('linkedin.com') ||
    referrer.includes('facebook.com')
  ) {
    return 'social'
  }

  // Email
  if (medium === 'email' || source === 'newsletter') {
    return 'email'
  }

  // Referral
  if (medium === 'referral' || (referrer && !referrer.includes('google') && !referrer.includes('bing'))) {
    return 'referral'
  }

  // Organic search
  if (
    medium === 'organic' ||
    referrer.includes('google.') ||
    referrer.includes('bing.') ||
    referrer.includes('duckduckgo.')
  ) {
    return 'organic'
  }

  // Direct
  if (!referrer && !source) {
    return 'direct'
  }

  return 'other'
}

export function useAttribution() {
  /**
   * Parse UTM parameters from URL
   */
  function parseUTMs(): Partial<AttributionData> {
    if (!import.meta.client) return {}

    const params = new URLSearchParams(window.location.search)
    const utms: Partial<AttributionData> = {}

    const utmKeys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'] as const
    for (const key of utmKeys) {
      const value = params.get(key)
      if (value) {
        utms[key] = value
      }
    }

    return utms
  }

  /**
   * Get current attribution data from URL + context
   */
  function getCurrentAttribution(): AttributionData {
    if (!import.meta.client) return {}

    const utms = parseUTMs()

    const data: AttributionData = {
      ...utms,
      referrer: document.referrer || undefined,
      landing_page: window.location.pathname,
      timestamp: new Date().toISOString(),
    }

    data.channel = deriveChannel(data)

    return data
  }

  /**
   * Get stored attribution (last touch)
   */
  function getStoredAttribution(): AttributionData | null {
    if (!import.meta.client) return null

    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      return stored ? JSON.parse(stored) : null
    } catch {
      return null
    }
  }

  /**
   * Get first touch attribution (never changes after first set)
   */
  function getFirstTouchAttribution(): AttributionData | null {
    if (!import.meta.client) return null

    try {
      const stored = localStorage.getItem(STORAGE_KEY_FIRST)
      return stored ? JSON.parse(stored) : null
    } catch {
      return null
    }
  }

  /**
   * Store attribution data
   * First touch is only set once, last touch updates on each visit with UTMs
   */
  function storeAttribution(data: AttributionData) {
    if (!import.meta.client) return

    try {
      // Always update last touch if we have new UTMs
      if (data.utm_source || data.utm_medium || data.utm_campaign) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
      }

      // Only set first touch once
      if (!localStorage.getItem(STORAGE_KEY_FIRST)) {
        localStorage.setItem(STORAGE_KEY_FIRST, JSON.stringify(data))
      }
    } catch {
      // localStorage might be unavailable
    }
  }

  /**
   * Initialize attribution on page load
   * Call this in app.vue or a plugin
   */
  function initAttribution() {
    if (!import.meta.client) return

    const current = getCurrentAttribution()

    // Only store if we have meaningful attribution data
    if (current.utm_source || current.utm_medium || current.referrer) {
      storeAttribution(current)
    }

    // Track to Umami if we have UTMs
    if (current.utm_source && window.umami) {
      window.umami.track('attribution_captured', {
        source: current.utm_source,
        medium: current.utm_medium || 'none',
        campaign: current.utm_campaign || 'none',
        channel: current.channel || 'unknown',
      })
    }
  }

  /**
   * Get attribution for passing to forms/Cal.com
   * Combines first touch and last touch
   */
  function getAttributionForForm(): Record<string, string> {
    const first = getFirstTouchAttribution()
    const last = getStoredAttribution()

    const result: Record<string, string> = {}

    if (first?.utm_source) result.first_source = first.utm_source
    if (first?.utm_medium) result.first_medium = first.utm_medium
    if (first?.utm_campaign) result.first_campaign = first.utm_campaign
    if (first?.channel) result.first_channel = first.channel

    if (last?.utm_source) result.last_source = last.utm_source
    if (last?.utm_medium) result.last_medium = last.utm_medium
    if (last?.utm_campaign) result.last_campaign = last.utm_campaign
    if (last?.channel) result.last_channel = last.channel

    if (first?.landing_page) result.landing_page = first.landing_page
    if (first?.referrer) result.referrer = first.referrer

    return result
  }

  /**
   * Build URL with attribution params for Cal.com
   * Use this to pre-fill hidden fields
   */
  function getCalcomUrlWithAttribution(baseUrl: string): string {
    const attribution = getAttributionForForm()

    if (Object.keys(attribution).length === 0) return baseUrl

    const params = new URLSearchParams()
    for (const [key, value] of Object.entries(attribution)) {
      if (value) params.set(key, value)
    }

    const separator = baseUrl.includes('?') ? '&' : '?'
    return `${baseUrl}${separator}${params.toString()}`
  }

  return {
    parseUTMs,
    getCurrentAttribution,
    getStoredAttribution,
    getFirstTouchAttribution,
    storeAttribution,
    initAttribution,
    getAttributionForForm,
    getCalcomUrlWithAttribution,
  }
}
