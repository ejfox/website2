/**
 * First-touch attribution for the consulting pipeline.
 *
 * On the first page load of a browser that has never been here, store
 * `ej_first_touch` = {source, medium, campaign, landing, ts} in localStorage.
 * It is never overwritten. Cal.com booking links and embeds carry it forward,
 * as utm_* (shown on the booking) and metadata[*] (returned to
 * /api/webhooks/calcom), so a booking can be traced to the channel that first
 * brought the person here.
 *
 * Privacy: only a source class, a bare referrer domain, utm values and the
 * landing PATH (no query string) are stored. No referrer URL, nothing personal.
 * Every storage access is wrapped, because private mode and blocked storage throw.
 *
 * (utils/attribution.ts is an older, broader first/last-touch store under
 * `ejfox_attribution*`. This one is deliberately small and is the one wired
 * into Cal.com.)
 */

export interface FirstTouch {
  source: string
  medium: string
  campaign: string
  landing: string
  ts: string
}

export const FIRST_TOUCH_KEY = 'ej_first_touch'

// Referrer host → source class. Keep in step with the funnel SQL.
// A host matches a domain when it IS that domain or a subdomain of it.
const REFERRER_CLASSES: Array<[string, string[]]> = [
  ['x', ['x.com', 'twitter.com', 't.co']],
  ['bluesky', ['bsky.app', 'bsky.social']],
  [
    'mastodon',
    [
      'mastodon.social',
      'mastodon.online',
      'hachyderm.io',
      'fosstodon.org',
      'infosec.exchange',
      'mas.to',
      'mstdn.social',
      'social.coop',
      'indieweb.social',
    ],
  ],
  ['youtube', ['youtube.com', 'youtu.be']],
  ['github', ['github.com']],
  ['hn', ['news.ycombinator.com']],
  [
    'search',
    [
      'bing.com',
      'duckduckgo.com',
      'search.brave.com',
      'kagi.com',
      'ecosia.org',
      'yahoo.com',
      'baidu.com',
      'startpage.com',
    ],
  ],
]
// google.com, google.co.uk, …; yandex.ru, …
const SEARCH_FAMILIES = /(?:^|\.)(?:google|yandex)\.[a-z.]+$/

function matchesDomain(host: string, domain: string): boolean {
  return host === domain || host.endsWith(`.${domain}`)
}

/** Classify a referrer URL into a source. Self-referrals count as direct. */
export function classifyReferrer(
  referrer: string,
  selfHost = 'ejfox.com'
): string {
  if (!referrer) return 'direct'
  let host: string
  try {
    host = new URL(referrer).hostname.toLowerCase().replace(/^www\./, '')
  } catch {
    return 'direct'
  }
  if (!host || host === selfHost || host.endsWith(`.${selfHost}`))
    return 'direct'
  for (const [cls, domains] of REFERRER_CLASSES) {
    if (domains.some((d) => matchesDomain(host, d))) return cls
  }
  if (SEARCH_FAMILIES.test(host)) return 'search'
  // Unlisted Mastodon instances usually say so in the hostname.
  if (/(?:^|\.)(?:mastodon|mstdn)\./.test(host)) return 'mastodon'
  return host
}

function clean(value: string | null | undefined, max = 64): string {
  return (value || '').trim().slice(0, max)
}

/** Build the first-touch record for the current page load. */
export function captureFirstTouch(loc: Location, referrer: string): FirstTouch {
  const params = new URLSearchParams(loc.search)
  const utmSource = clean(params.get('utm_source')).toLowerCase()
  const source = utmSource || classifyReferrer(referrer, loc.hostname)
  const medium =
    clean(params.get('utm_medium')).toLowerCase() ||
    (utmSource || source === 'direct'
      ? 'none'
      : source === 'search'
        ? 'organic'
        : 'referral')
  return {
    source,
    medium,
    campaign: clean(params.get('utm_campaign')),
    landing: clean(loc.pathname, 200) || '/',
    ts: new Date().toISOString(),
  }
}

export function readFirstTouch(): FirstTouch | null {
  try {
    const raw = window.localStorage.getItem(FIRST_TOUCH_KEY)
    if (!raw) return null
    const v = JSON.parse(raw)
    return v && typeof v.source === 'string' ? (v as FirstTouch) : null
  } catch {
    return null
  }
}

/** Store the first touch only if none exists. Returns the stored value. */
export function rememberFirstTouch(): FirstTouch | null {
  const existing = readFirstTouch()
  if (existing) return existing
  const ft = captureFirstTouch(window.location, document.referrer)
  try {
    if (!window.localStorage.getItem(FIRST_TOUCH_KEY)) {
      window.localStorage.setItem(FIRST_TOUCH_KEY, JSON.stringify(ft))
    }
  } catch {
    // storage unavailable: still usable for this page view
  }
  return ft
}

/** Query params Cal.com understands: utm_* (shown on booking) + metadata[*] (webhook). */
export function calParams(ft: FirstTouch | null): Record<string, string> {
  if (!ft) return {}
  const out: Record<string, string> = {
    utm_source: ft.source,
    utm_medium: ft.medium,
    'metadata[utm_source]': ft.source,
    'metadata[utm_medium]': ft.medium,
    'metadata[landing]': ft.landing,
  }
  if (ft.campaign) {
    out.utm_campaign = ft.campaign
    out['metadata[utm_campaign]'] = ft.campaign
  }
  return out
}

/** True for a Cal.com booking URL (cal.com or app.cal.com, not the embed script). */
export function isCalBookingUrl(url: URL): boolean {
  return (
    /^(?:app\.)?cal\.com$/i.test(url.hostname) &&
    !url.pathname.startsWith('/embed')
  )
}

/** Return `href` with first-touch params added, keeping its query and any values already set. */
export function withFirstTouch(href: string, ft: FirstTouch | null): string {
  let url: URL
  try {
    url = new URL(href)
  } catch {
    return href
  }
  for (const [k, v] of Object.entries(calParams(ft))) {
    if (!url.searchParams.has(k)) url.searchParams.set(k, v)
  }
  return url.toString()
}
