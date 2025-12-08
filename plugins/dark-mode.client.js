import { useDark } from '@vueuse/core'
export default defineNuxtPlugin(() => {
  // VueUse handles dark mode automatically (localStorage + system preference)
  if (import.meta.client) {
    useDark() // Auto-syncs with 'dark' class and localStorage
  }
})
