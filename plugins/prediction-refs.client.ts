import { createApp, h } from 'vue'
import PredictionRef from '~/components/blog/PredictionRef.vue'
import PredictionCard from '~/components/blog/PredictionCard.vue'

export default defineNuxtPlugin(() => {
  if (import.meta.server) return

  const mounted = new WeakSet<Element>()

  const hydrate = () => {
    const nodes = document.querySelectorAll<HTMLElement>('[data-prediction-ref]')
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
      const Component = display === 'block' ? PredictionCard : PredictionRef

      // Replace element with mount container matching its tag
      const container = document.createElement(display === 'block' ? 'div' : 'span')
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
