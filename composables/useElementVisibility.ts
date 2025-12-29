/**
 * Element visibility tracking with Intersection Observer
 *
 * Track when specific page sections become visible.
 * More accurate than scroll percentage for tracking content consumption.
 *
 * Usage:
 * <section ref="pricingRef">Pricing</section>
 *
 * const pricingRef = ref(null)
 * useElementVisibility(pricingRef, {
 *   onVisible: () => micro.viewedPricing(),
 *   threshold: 0.5, // 50% visible
 *   once: true, // Only fire once
 * })
 */

export interface ElementVisibilityOptions {
  threshold?: number // 0-1, how much must be visible (default: 0.5)
  once?: boolean // Only trigger once per page load (default: true)
  onVisible?: () => void // Callback when element becomes visible
  onHidden?: () => void // Callback when element leaves viewport
  rootMargin?: string // IntersectionObserver margin (default: '0px')
}

export function useElementVisibility(
  element: Ref<HTMLElement | null>,
  options: ElementVisibilityOptions = {}
) {
  const {
    threshold = 0.5,
    once = true,
    onVisible,
    onHidden,
    rootMargin = '0px',
  } = options

  const isVisible = ref(false)
  const hasBeenVisible = ref(false)

  let observer: IntersectionObserver | null = null

  function createObserver() {
    if (!import.meta.client || !element.value) return

    observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const nowVisible = entry.isIntersecting

          if (nowVisible && !isVisible.value) {
            isVisible.value = true

            if (!hasBeenVisible.value) {
              hasBeenVisible.value = true
              onVisible?.()

              // If once, disconnect after first trigger
              if (once) {
                observer?.disconnect()
              }
            } else if (!once) {
              onVisible?.()
            }
          } else if (!nowVisible && isVisible.value) {
            isVisible.value = false
            if (!once) {
              onHidden?.()
            }
          }
        })
      },
      {
        threshold,
        rootMargin,
      }
    )

    observer.observe(element.value)
  }

  function destroyObserver() {
    observer?.disconnect()
    observer = null
  }

  // Watch for element changes
  watch(element, (el) => {
    destroyObserver()
    if (el) {
      createObserver()
    }
  })

  onMounted(() => {
    if (element.value) {
      createObserver()
    }
  })

  onUnmounted(() => {
    destroyObserver()
  })

  return {
    isVisible,
    hasBeenVisible,
  }
}

/**
 * Track multiple sections on a page
 *
 * Usage:
 * const { trackSection, getSectionStats } = useSectionTracking()
 *
 * <section ref="el => trackSection('pricing', el)">...</section>
 * <section ref="el => trackSection('testimonials', el)">...</section>
 */
export function useSectionTracking() {
  const sections = new Map<
    string,
    { visible: boolean; viewedAt: number | null }
  >()

  function trackSection(name: string, el: HTMLElement | null) {
    if (!el || !import.meta.client) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const existing = sections.get(name)
            if (!existing?.viewedAt) {
              sections.set(name, {
                visible: true,
                viewedAt: Date.now(),
              })

              // Track to Umami
              if (window.umami) {
                window.umami.track('section_viewed', { section: name })
              }
            }
          }
        })
      },
      { threshold: 0.5 }
    )

    observer.observe(el)
  }

  function getSectionStats() {
    return Object.fromEntries(sections)
  }

  return {
    trackSection,
    getSectionStats,
  }
}
