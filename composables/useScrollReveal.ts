/**
 * useScrollReveal — subtle scroll-triggered animations via IntersectionObserver + anime.js
 *
 * First appearance: translateY + opacity + scale (the full entrance)
 * Re-entry: opacity only (subtle breathing, no bouncing)
 *
 * Usage:
 *   const { revealContainer } = useScrollReveal()
 *   // attach ref to a parent element — its children get animated
 *
 * Or with options:
 *   const { revealContainer } = useScrollReveal({
 *     selector: 'article, .card',
 *     staggerDelay: 40,
 *     translateY: 8,
 *     duration: 200,
 *   })
 */

import type { Ref } from 'vue'

interface ScrollRevealOptions {
  /** CSS selector for children to animate. Default: direct children '*' */
  selector?: string
  /** Stagger delay in ms between siblings. Default: 40 */
  staggerDelay?: number
  /** Starting translateY in px (first appearance only). Default: 8 */
  translateY?: number
  /** Animation duration in ms. Default: 200 */
  duration?: number
}

export function useScrollReveal(options: ScrollRevealOptions = {}) {
  const {
    selector = ':scope > *',
    staggerDelay = 40,
    translateY = 8,
    duration = 200,
  } = options

  const revealContainer: Ref<HTMLElement | null> = ref(null)

  // Track first appearance vs re-entry
  const hasAppeared = new WeakSet<Element>()
  // Elements dimmed because they scrolled out of view (drives re-entry only)
  const dimmed = new WeakSet<Element>()

  onMounted(async () => {
    const container = revealContainer.value
    if (!container) return

    const { animate, stagger } = await import('animejs')

    const children = Array.from(container.querySelectorAll(selector))
    if (!children.length) return

    // Set initial state. Crucially, do NOT hide content that's already on
    // screen at load (above the fold): hiding the LCP element and fading it
    // back in after hydration pushes LCP well past FCP. Above-fold elements
    // stay painted and are marked as already-appeared so they never animate
    // an entrance (they still dim/re-enter if scrolled away and back).
    const viewportH = window.innerHeight || document.documentElement.clientHeight
    children.forEach((el) => {
      const htmlEl = el as HTMLElement
      if (htmlEl.getBoundingClientRect().top < viewportH) {
        hasAppeared.add(htmlEl)
        return
      }
      htmlEl.style.opacity = '0'
      htmlEl.style.transform = `translateY(${translateY}px)`
      htmlEl.style.willChange = 'opacity, transform'
    })

    const observer = new IntersectionObserver(
      (entries) => {
        const entering: HTMLElement[] = []
        const reEntering: HTMLElement[] = []

        entries.forEach((entry) => {
          const el = entry.target as HTMLElement
          if (entry.isIntersecting) {
            if (!hasAppeared.has(el)) {
              hasAppeared.add(el)
              entering.push(el)
            } else if (dimmed.has(el)) {
              // Only re-animate elements that were actually dimmed on exit —
              // keeps above-fold content (already visible) from flashing.
              dimmed.delete(el)
              reEntering.push(el)
            }
          } else if (hasAppeared.has(el)) {
            // Element left viewport — dim it for re-entry
            el.style.opacity = '0.85'
            dimmed.add(el)
          }
        })

        // First appearance: full entrance with translateY + stagger
        if (entering.length > 0) {
          animate(entering, {
            opacity: [0, 1],
            translateY: [translateY, 0],
            scale: [0.98, 1],
            duration,
            ease: 'outQuad',
            delay: stagger(staggerDelay),
            onComplete: () => {
              entering.forEach((el) => {
                el.style.willChange = ''
                el.style.transform = ''
              })
            },
          })
        }

        // Re-entry: just opacity, no movement
        if (reEntering.length > 0) {
          animate(reEntering, {
            opacity: [0.85, 1],
            duration: duration * 0.6,
            ease: 'outQuad',
          })
        }
      },
      {
        threshold: 0.01,
      }
    )

    children.forEach((el) => observer.observe(el))

    onUnmounted(() => {
      observer.disconnect()
    })
  })

  return { revealContainer }
}

/**
 * useRevealOnce — simpler version, just fades in a single element when it enters view
 * Good for hero sections, images, standalone blocks
 */
export function useRevealOnce(
  options: { duration?: number; translateY?: number } = {}
) {
  const { duration = 200, translateY = 6 } = options
  const el: Ref<HTMLElement | null> = ref(null)

  onMounted(async () => {
    if (!el.value) return
    const { animate } = await import('animejs')

    const htmlEl = el.value
    htmlEl.style.opacity = '0'
    htmlEl.style.transform = `translateY(${translateY}px)`

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          observer.disconnect()
          animate(htmlEl, {
            opacity: [0, 1],
            translateY: [translateY, 0],
            duration,
            ease: 'outQuad',
          })
        }
      },
      { threshold: 0.01 }
    )

    observer.observe(htmlEl)
    onUnmounted(() => observer.disconnect())
  })

  return { el }
}
