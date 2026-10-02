// Dev only. Pairs with watchContentAndReload (scripts/dev/content-watch.mjs,
// wired in via nuxt.config.ts): when a content/blog/*.md file is
// reprocessed, it sends a custom Vite HMR event instead of a full-reload,
// and this refetches the page's data in place (no white-flash hard refresh,
// scroll position preserved).
import { defineNuxtPlugin, refreshNuxtData } from '#app'

export default defineNuxtPlugin(() => {
  if (!import.meta.hot) return

  import.meta.hot.on('content:updated', () => {
    refreshNuxtData()
  })
})
