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

  umami: {
    id: 'd9e7297b-be5d-4f91-a116-38f9c960a9af',
    host: 'https://umami.tools.ejfox.com',
    autoTrack: true,
    ignoreLocalhost: true
  },

  runtimeConfig: {
    // Private keys that are exposed to the server
    MONKEYTYPE_TOKEN: process.env.MONKEYTYPE_TOKEN,
    githubToken: process.env.GITHUB_TOKEN,
    GITHUB_TOKEN: process.env.GITHUB_TOKEN,
    CHESS_USERNAME: process.env.CHESS_USERNAME,
    RESCUETIME_TOKEN: process.env.RESCUETIME_TOKEN,

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
    },
    routeRules: {
      '/api/**': {
        cors: true,
        headers: {
          'Access-Control-Allow-Methods': 'GET,HEAD,PUT,PATCH,POST,DELETE',
          'Access-Control-Allow-Origin': '*'
        }
      }
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
      'Red Hat Mono': [300, 400],
      'Fjalla One': [400]
    }
  }
})
