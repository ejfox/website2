export default defineNuxtPlugin(() => {
  if (!import.meta.client) return

  const UMAMI = 'https://umami.tools.ejfox.com'
  const WEBSITE_ID = '165590cb-c361-4ad8-9459-6c6390744c64'

  const add = (src, attrs = {}) => {
    const script = document.createElement('script')
    script.src = src
    script.defer = true
    for (const [k, v] of Object.entries(attrs)) script.setAttribute(k, v)
    document.head.appendChild(script)
  }

  // Defer analytics until after LCP — don't compete with critical rendering.
  // Web Vitals still land: Umami's observers read buffered entries.
  const load = () => {
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
    // Umami heatmaps + masked session replay; sampling lives in the Umami DB
    // (website.replay_config), not here.
    add(`${UMAMI}/recorder.js`, { 'data-website-id': WEBSITE_ID })
  }

  if ('requestIdleCallback' in window) {
    requestIdleCallback(load, { timeout: 3000 })
  } else {
    setTimeout(load, 2000)
  }
})
