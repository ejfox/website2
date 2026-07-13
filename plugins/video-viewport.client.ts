/**
 * @file plugins/video-viewport.client.ts
 * @description Viewport-driven playback for autoplay videos (the muted looping
 *   demo clips remarkEnhanceImages emits, plus any video with data-autoplay).
 *   Videos play only while ≥20% visible and pause offscreen — a page with a
 *   dozen demo loops decodes only the ones actually being looked at.
 *
 *   Respects prefers-reduced-motion: reduce → autoplay is stripped and nothing
 *   plays automatically (videos remain playable via their own controls if any).
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

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      videos.forEach((v) => {
        v.removeAttribute('autoplay')
        v.pause()
      })
      return
    }

    observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const video = entry.target as HTMLVideoElement
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
