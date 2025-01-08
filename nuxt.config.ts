// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  // SSR configuration
  ssr: false,

  modules: [
    '@nuxt/ui',
    '@nuxt/icon',
    '@vueuse/nuxt',
    '@nuxtjs/google-fonts',
    'nuxt-umami'
  ],

  // Component loading optimization
  build: {
    transpile: ['vue-toastification']
  },

  runtimeConfig: {
    public: {
      baseUrl:
        process.env.NODE_ENV === 'production'
          ? 'https://ejfox.com'
          : 'http://localhost:3000',
      apiBase:
        process.env.NODE_ENV === 'production'
          ? 'https://ejfox.com/api'
          : 'http://localhost:3000/api'
    }
  },

  nitro: {
    preset: 'netlify',
    prerender: {
      failOnError: false
    }
  },

  components: true,

  app: {
    head: {
      title: 'EJ Fox',
      meta: [
        {
          name: 'description',
          content: 'EJ Fox: Hacker, Journalist, & Dataviz Specialist'
        }
      ]
    }
  },

  googleFonts: {
    families: {
      'Signika Negative': [200, 300, 400, 500, 600, 700, 800],
      'Red Hat Mono': [300, 400]
    }
  }
})
