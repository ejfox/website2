/**
 * @file prediction-refs.client.ts
 * @description Client-only. Replaces the `[data-prediction-ref]` placeholders
 *   that scripts/plugins/remarkPredictionRef.mjs leaves in post HTML with live
 *   components: components/blog/PredictionCard.vue for
 *   data-prediction-ref="block", components/blog/PredictionRef.vue otherwise.
 *   Props come from the element's JSON `data-payload`.
 *   Runs on onNuxtReady and after every page:finish (nextTick).
 *   Gotcha: each mount is a standalone createApp() with no Nuxt context or
 *   router, and those apps are never unmounted (compare gear-cards.client.ts).
 */
import { createApp, h } from 'vue'

export default defineNuxtPlugin((nuxtApp) => {
  if (import.meta.server) return

  const mounted = new WeakSet<Element>()
  // Loaded lazily on first use — see hydrate(). Predictions only appear on a
  // handful of posts, so eager-importing these shipped + parsed them on every
  // page (homepage included), for nothing.
  let components: {
    PredictionRef: unknown
    PredictionCard: unknown
  } | null = null

  const hydrate = async () => {
    const nodes = document.querySelectorAll<HTMLElement>(
      '[data-prediction-ref]'
    )
    if (!nodes.length) return

    if (!components) {
      const [ref, card] = await Promise.all([
        import('~/components/blog/PredictionRef.vue'),
        import('~/components/blog/PredictionCard.vue'),
      ])
      components = { PredictionRef: ref.default, PredictionCard: card.default }
    }

    nodes.forEach((el) => {
      if (mounted.has(el)) return
      const raw = el.getAttribute('data-payload')
      if (!raw) return

      let payload: Record<string, unknown>
      try {
        payload = JSON.parse(raw)
      } catch {
        return
      }

      const display = el.getAttribute('data-prediction-ref')
      const Component =
        display === 'block'
          ? components!.PredictionCard
          : components!.PredictionRef

      // Replace element with mount container matching its tag
      const container = document.createElement(
        display === 'block' ? 'div' : 'span'
      )
      container.className = el.className
      el.replaceWith(container)

      const app = createApp({ render: () => h(Component, { payload }) })
      app.mount(container)
      mounted.add(container)
    })
  }

  onNuxtReady(() => {
    nextTick(hydrate)
  })

  nuxtApp.hook('page:finish', () => {
    nextTick(hydrate)
  })
})
