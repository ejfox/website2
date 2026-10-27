/**
 * @file dark-mode.client.js
 * @description Client-only. Calls VueUse useDark() once at app start so the
 *   `dark` class on <html> tracks the OS colour scheme. There is no manual
 *   toggle on the site; the background tokens in assets/css/global.css key
 *   off this class AND a prefers-color-scheme media query (the class isn't
 *   there before hydration).
 */
import { useDark } from '@vueuse/core'
export default defineNuxtPlugin(() => {
  // VueUse handles dark mode automatically (localStorage + system preference)
  if (import.meta.client) {
    useDark() // Auto-syncs with 'dark' class and localStorage
  }
})
