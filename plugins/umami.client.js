/**
 * @file umami.client.js
 * @description Client-only. Loads the self-hosted Umami tracker (with Web
 *   Vitals), the shared umami-plus helper, and, when earned, the session
 *   replay recorder. The "when" rules are pure functions in
 *   utils/replayPolicy.ts.
 *   Skips entirely for automation (navigator.webdriver), any host other than
 *   ejfox.com (dev, PR previews), and /bookmarklet.
 *   Scripts load on requestIdleCallback (3s timeout; 2s fallback) so they
 *   don't compete with LCP. Custom events live in umami-events.client.ts;
 *   bump the `?v=` query strings when the remote scripts change (Cloudflare
 *   caches them).
 */
import {
  isFunnelPath,
  deviceAllowsReplay,
  scrollFraction,
  ENGAGED_SCROLL,
  ENGAGED_MS,
} from '~/utils/replayPolicy'

export default defineNuxtPlugin(() => {
  if (!import.meta.client) return
  // Umami only drops *headless* UAs. A headed Playwright/Puppeteer run looks
  // like real Chrome — one QA crawl on 2026-10-11 logged 12k events (100× a
  // normal day). Automation always sets navigator.webdriver, so skip it.
  if (navigator.webdriver) return
  // Only production counts: `yarn dev` and pr-N.preview hosts were ~10% of
  // all events (localhost alone: 371 in 90 days), mostly /kitchen-sink.
  if (location.hostname !== 'ejfox.com') return
  // The bookmarklet popup carries the page text and an `auth=` passphrase in
  // its query string, which Umami stores. It's a tool, not a page: never track.
  if (location.pathname.startsWith('/bookmarklet')) return

  const UMAMI = 'https://umami.tools.ejfox.com'
  const WEBSITE_ID = '165590cb-c361-4ad8-9459-6c6390744c64'

  const add = (src, attrs = {}) => {
    const script = document.createElement('script')
    script.src = src
    script.defer = true
    for (const [k, v] of Object.entries(attrs)) script.setAttribute(k, v)
    document.head.appendChild(script)
  }

  // --- session replay: when to load recorder.js (see utils/replayPolicy.ts)
  let recorderLoaded = false
  let visibleTimer = null
  const opts = { passive: true, capture: true }

  function loadRecorder() {
    if (recorderLoaded) return
    recorderLoaded = true
    disarm()
    add(`${UMAMI}/recorder.js`, { 'data-website-id': WEBSITE_ID })
  }

  // First of: scroll past 25%, a click/tap or key, or 15s of visible time.
  function onScroll() {
    const f = scrollFraction(
      window.scrollY,
      window.innerHeight,
      document.documentElement.scrollHeight
    )
    if (f >= ENGAGED_SCROLL) loadRecorder()
  }
  function startTimer() {
    if (!visibleTimer && document.visibilityState === 'visible')
      visibleTimer = setTimeout(loadRecorder, ENGAGED_MS)
  }
  function onVisibility() {
    if (document.visibilityState === 'visible') return startTimer()
    clearTimeout(visibleTimer)
    visibleTimer = null
  }
  function armEngagement() {
    window.addEventListener('scroll', onScroll, opts)
    window.addEventListener('pointerdown', loadRecorder, opts)
    window.addEventListener('keydown', loadRecorder, opts)
    document.addEventListener('visibilitychange', onVisibility)
    startTimer()
  }
  function disarm() {
    window.removeEventListener('scroll', onScroll, opts)
    window.removeEventListener('pointerdown', loadRecorder, opts)
    window.removeEventListener('keydown', loadRecorder, opts)
    document.removeEventListener('visibilitychange', onVisibility)
    clearTimeout(visibleTimer)
  }

  // Defer analytics until after LCP — don't compete with critical rendering.
  // Web Vitals still land: Umami's observers read buffered entries.
  let analyticsLoaded = false
  const load = () => {
    analyticsLoaded = true
    // ?v= busts Cloudflare's cached pre-3.4 tracker (it lacks data-performance
    // + getSession, which recorder.js needs). Bump on Umami upgrades.
    add(`${UMAMI}/script.js?v=3.4.0`, {
      'data-website-id': WEBSITE_ID,
      'data-performance': 'true', // LCP/INP/CLS/FCP/TTFB → Umami "Performance"
    })
    // Shared behaviour events (chart-desk/infra/umami-plus): scroll-depth,
    // engaged, copy, download, not-found, search, session props. outbound /
    // rss-click / contact-email stay in plugins/umami-events.client.ts, so the
    // helper's copies are switched off here.
    add('https://umami-plus.tools.ejfox.com/umami-plus.js?v=3', {
      'data-outbound': 'false',
      'data-feeds': 'false',
      'data-mailto': 'false',
      'data-notfound-selector': '[data-not-found]',
    })
    // Umami heatmaps + masked session replay (rrweb). Funnel pages record
    // straight away; everywhere else the recorder is earned by engagement.
    // See utils/replayPolicy.ts. Sampling still lives in the Umami DB.
    if (isFunnelPath(location.pathname)) loadRecorder()
    else if (deviceAllowsReplay(navigator)) armEngagement()
  }

  // Navigating into the funnel mid-visit starts the recorder too. Before
  // load() has run, it checks location.pathname itself (recorder.js needs
  // script.js, so it must never load first).
  useRouter().afterEach((to) => {
    if (analyticsLoaded && isFunnelPath(to.path)) loadRecorder()
  })

  if ('requestIdleCallback' in window) {
    requestIdleCallback(load, { timeout: 3000 })
  } else {
    setTimeout(load, 2000)
  }
})
