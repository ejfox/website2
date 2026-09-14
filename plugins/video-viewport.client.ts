/**
 * @file plugins/video-viewport.client.ts
 * @description Viewport-driven playback for autoplay videos (the muted looping
 *   demo clips remarkEnhanceImages emits, plus any video with data-autoplay).
 *   Videos play only while ≥20% visible and pause offscreen — a page with a
 *   dozen demo loops decodes only the ones actually being looked at.
 *
 *   Respects prefers-reduced-motion: reduce → autoplay is stripped, nothing
 *   plays automatically, and native controls are added so the demos stay
 *   watchable on demand (reduced motion, not removed content).
 *
 *   WCAG 2.2.2 (Pause, Stop, Hide): article demo videos (native [autoplay])
 *   get native controls so readers can pause the loop. Index living tiles
 *   ([data-autoplay]) stay chrome-free — they're navigation cards; clicking
 *   navigates, and offscreen they pause via the observer.
 *
 *   Progressive enhancement: the markup keeps the native autoplay attribute,
 *   so with JS disabled videos simply autoplay as before.
 */
export default defineNuxtPlugin((nuxtApp) => {
  let observer: IntersectionObserver | null = null

  const scan = () => {
    observer?.disconnect()
    observer = null

    const videos = document.querySelectorAll<HTMLVideoElement>(
      'video[autoplay], video[data-autoplay]'
    )
    if (!videos.length) return

    // Article demo videos get a pause affordance (WCAG 2.2.2). Living tiles
    // on the index ([data-autoplay]) are excluded — controls inside a
    // navigation card fight the card's click.
    document
      .querySelectorAll<HTMLVideoElement>(
        'video[autoplay]:not([data-autoplay])'
      )
      .forEach((v) => {
        v.controls = true
      })

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      videos.forEach((v) => {
        v.removeAttribute('autoplay')
        v.pause()
        // reduced ≠ removed: leave the demo playable on demand
        v.controls = true
      })
      return
    }

    // Below-fold tiles carry data-poster instead of poster (the poster
    // attribute is fetched immediately by the preload scanner and can't be
    // lazy-loaded — ~196KB of below-fold JPEGs contended with the LCP).
    // Swap it in one viewport ahead of arrival.
    const posterVideos =
      document.querySelectorAll<HTMLVideoElement>('video[data-poster]')
    if (posterVideos.length) {
      const posterObserver = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (!entry.isIntersecting) continue
            const v = entry.target as HTMLVideoElement
            if (v.dataset.poster) {
              v.poster = v.dataset.poster
              delete v.dataset.poster
            }
            posterObserver.unobserve(v)
          }
        },
        { rootMargin: '100% 0px' }
      )
      posterVideos.forEach((v) => posterObserver.observe(v))
    }

    observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const video = entry.target as HTMLVideoElement
          // A reader's explicit pause (data-user-paused, set by the tile's
          // pause toggle) outranks viewport-driven playback.
          if (video.dataset.userPaused) continue
          if (entry.isIntersecting) {
            // Autoplay policy requires muted; Vue renders muted as an
            // attribute which doesn't always set the property.
            video.muted = true
            video.play().catch(() => {})
          } else {
            video.pause()
          }
        }
      },
      { threshold: 0.2 }
    )
    videos.forEach((v) => observer!.observe(v))
  }

  // Content (v-html post bodies) lands after mount; small delay like the
  // footnotes plugin. Re-scan on every page navigation.
  nuxtApp.hook('page:finish', () => setTimeout(scan, 250))
  if (document.readyState === 'complete') {
    setTimeout(scan, 250)
  } else {
    window.addEventListener('load', () => setTimeout(scan, 250), {
      once: true,
    })
  }
})
