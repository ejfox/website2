/**
 * @file floating-vue.ts
 * @description Universal (server + client). Installs FloatingVue globally,
 *   which registers the v-tooltip / VDropdown directives and components used
 *   across components/ (stats, gear, github). Also pulls in FloatingVue's CSS
 *   on every page.
 */
import FloatingVue from 'floating-vue'
import 'floating-vue/dist/style.css'

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.use(FloatingVue, {
    themes: {
      tooltip: {
        delay: { show: 300, hide: 0 },
        distance: 6,
        placement: 'top',
      },
    },
  })
})
