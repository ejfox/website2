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
