import FloatingVue from 'floating-vue'
import 'floating-vue/dist/style.css'

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.use(FloatingVue, {
    themes: {
      tooltip: {
        delay: { show: 200, hide: 0 },
        distance: 8,
      },
    },
  })
})
