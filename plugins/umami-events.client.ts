/**
 * Site-wide Umami funnel events (see CLAUDE.md "Umami funnel events").
 *
 * Umami itself (plugins/umami.client.js) auto-tracks any element carrying
 * `data-umami-event`. This plugin covers the behaviour that can't be expressed
 * as a static attribute:
 *
 *   outbound      click on a link to another host     { host }
 *   contact-email click on a mailto: link             (no props — never the address)
 *   rss-click     click on a link to a *.xml feed      { feed }
 *   read-complete reader passed ~85% of the article,  { 'path-type': blog|dispatch }
 *                 after at least 10s on the page
 *
 * Privacy: no new tracker, no PII in props — hostnames and site paths only.
 * Events fired before the deferred Umami script loads are dropped, by design.
 */
import { useEventListener } from '@vueuse/core'

type UmamiProps = Record<string, string>
declare global {
  interface Window {
    umami?: { track: (name: string, props?: UmamiProps) => void }
  }
}

/** A page must be open this long before reaching the 85% mark counts as a read. */
const READ_MIN_DWELL_MS = 10_000

function track(name: string, props?: UmamiProps) {
  try {
    window.umami?.track(name, props)
  } catch {
    // analytics must never break the page
  }
}

export default defineNuxtPlugin((nuxtApp) => {
  // ── (a, c, d) Link clicks, one delegated listener ─────────────────────────
  useEventListener(
    document,
    'click',
    (e: MouseEvent) => {
      const target = e.target as Element | null
      const link = target?.closest?.('a[href]') as HTMLAnchorElement | null
      if (!link) return
      // Already tagged: Umami's own auto-tracking reports it. Don't double up.
      if (link.closest('[data-umami-event]')) return

      const href = link.getAttribute('href') || ''
      if (href.toLowerCase().startsWith('mailto:')) {
        track('contact-email')
        return
      }

      let url: URL
      try {
        url = new URL(link.href, window.location.href)
      } catch {
        return
      }
      if (!/^https?:$/.test(url.protocol)) return

      if (/\.xml$/i.test(url.pathname)) {
        track('rss-click', { feed: url.pathname })
        return
      }

      if (url.hostname !== window.location.hostname) {
        track('outbound', { host: url.hostname.replace(/^www\./, '') })
      }
    },
    { capture: true, passive: true }
  )

  // ── (b) read-complete via an injected sentinel at 85% of the body ─────────
  let stopObserver: (() => void) | null = null
  let sentinel: HTMLElement | null = null

  const armReadComplete = () => {
    stopObserver?.()
    stopObserver = null
    sentinel?.remove()
    sentinel = null

    const path = window.location.pathname
    const pathType = path.startsWith('/blog/')
      ? 'blog'
      : path.startsWith('/dispatch/')
        ? 'dispatch'
        : null
    if (!pathType) return

    // Both post templates render their body as `.e-content` (h-entry).
    const body = document.querySelector<HTMLElement>('.h-entry .e-content')
    if (!body) return

    if (getComputedStyle(body).position === 'static') {
      body.style.position = 'relative'
    }
    sentinel = document.createElement('span')
    sentinel.setAttribute('aria-hidden', 'true')
    sentinel.dataset.readSentinel = pathType
    sentinel.style.cssText =
      'position:absolute;top:85%;left:0;width:1px;height:1px;pointer-events:none'
    body.appendChild(sentinel)

    // Native IntersectionObserver, NOT VueUse's useIntersectionObserver: its
    // `useSupported()` guard is backed by useMounted(), which never flips
    // outside a component, so in a plugin it silently observes nothing
    // (verified 2026-10-03 against @vueuse/core 14.1). Fires once, then
    // disconnects. No scroll listener.
    //
    // "Passed" = visible OR already above the viewport: a fast flick / End key
    // jumps clean over a 1px sentinel and IO never reports it as visible.
    // A minimum dwell keeps a short piece whose 85% mark is on screen at load
    // from counting as "read" the instant it opens.
    const armedAt = performance.now()
    const el = sentinel
    let dwellTimer: ReturnType<typeof setTimeout> | undefined
    const passed = () => el.getBoundingClientRect().top < window.innerHeight
    const fire = (obs: IntersectionObserver) => {
      obs.disconnect()
      clearTimeout(dwellTimer)
      track('read-complete', { 'path-type': pathType })
    }
    const observer = new IntersectionObserver(([entry], obs) => {
      if (!entry) return
      if (!entry.isIntersecting && entry.boundingClientRect.top >= 0) return
      const wait = READ_MIN_DWELL_MS - (performance.now() - armedAt)
      if (wait <= 0) return fire(obs)
      clearTimeout(dwellTimer)
      dwellTimer = setTimeout(() => passed() && fire(obs), wait)
    })
    observer.observe(el)
    stopObserver = () => {
      observer.disconnect()
      clearTimeout(dwellTimer)
    }
  }

  // Once per page view: re-arm after every client navigation renders.
  // setTimeout, not requestAnimationFrame: rAF never fires in a background
  // tab, so a post opened with cmd-click would never be armed. (IO itself
  // waits until the tab is visible, which is what we want.)
  nuxtApp.hook('page:finish', () => {
    setTimeout(armReadComplete, 0)
  })
})
