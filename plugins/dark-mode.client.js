import { useDark } from '@vueuse/core'
// eslint-disable-next-line no-undef
export default defineNuxtPlugin(() => {
  // VueUse handles dark mode automatically (localStorage + system preference)
  if (import.meta.client) {
    useDark() // Auto-syncs with 'dark' class and localStorage
  }
})
