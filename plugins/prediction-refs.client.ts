import { createApp, h } from 'vue'

export default defineNuxtPlugin(() => {
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

  const router = useRouter()
  router.afterEach(() => {
    nextTick(hydrate)
  })
})
