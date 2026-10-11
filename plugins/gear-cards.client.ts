/**
 * Gear card inline mounter.
 *
 * The remark pipeline outputs placeholder divs inside rendered blog post HTML:
 *   <div class="gear-card-inline" data-gear-slug="SLUG"></div>
 *
 * This plugin finds those placeholders after navigation and mounts a
 * GearCardInline Vue app on each one. Apps are tracked and unmounted before
 * the next route change to prevent memory leaks.
 */

import { createApp, defineAsyncComponent, h } from 'vue'

// Lazy-import the component to avoid pulling it into the main bundle
const GearCardInline = defineAsyncComponent(
  () => import('~/components/GearCardInline.vue')
)

export default defineNuxtPlugin((nuxtApp) => {
  if (import.meta.server) return

  // Registry of mounted sub-apps keyed by their host element.
  // Using a Map lets us unmount exactly the apps we created this navigation.
  const mountedApps = new Map<Element, ReturnType<typeof createApp>>()

  const unmountAll = () => {
    mountedApps.forEach((app) => {
      try {
        app.unmount()
      } catch {
        // Already unmounted — ignore
      }
    })
    mountedApps.clear()
  }

  const mountGearCards = () => {
    const placeholders = document.querySelectorAll<HTMLElement>(
      'div.gear-card-inline[data-gear-slug]'
    )

    if (!placeholders.length) return

    placeholders.forEach((el) => {
      // Skip if we already mounted on this element
      if (mountedApps.has(el)) return

      const slug = el.dataset.gearSlug
      if (!slug) return

      // Clear any server-rendered placeholder content (e.g., the empty div)
      el.innerHTML = ''

      // Create a minimal Vue app that renders just the inline card.
      // We inject the parent Nuxt app's vueApp so Nuxt composables
      // (useFetch, useNuxtApp, etc.) resolve against the same instance.
      const app = createApp({
        render: () => h(GearCardInline, { gearSlug: slug }),
      })

      // Inherit global plugins (router, pinia, vue-query, etc.) from the
      // host Nuxt app so useFetch and other composables work correctly.
      app.config.globalProperties = nuxtApp.vueApp.config.globalProperties
      // ...its global components (RouterLink) and its provides (Nuxt
      // context, router). _context is internal but stable across Vue 3.x.
      // Object.assign, not Object.keys: vue-router provides under Symbol
      // keys, and without them the card's NuxtLinks rendered nothing.
      Object.assign(app._context.components, nuxtApp.vueApp._context.components)
      Object.assign(app._context.provides, nuxtApp.vueApp._context.provides)

      app.mount(el)
      mountedApps.set(el, app)
    })
  }

  // Run after the initial page is ready
  onNuxtReady(() => {
    nextTick(mountGearCards)
  })

  // On each navigation: unmount old cards, then mount fresh ones
  const router = useRouter()

  router.beforeEach(() => {
    unmountAll()
  })

  router.afterEach(() => {
    nextTick(mountGearCards)
  })
})
