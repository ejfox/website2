// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  // SSR configuration
  ssr: false,

  // Add compatibility date
  compatibilityDate: '2024-02-23',

  // Enable View Transitions API
  experimental: {
    viewTransition: true
  },

  modules: [
    '@nuxt/ui',
    '@nuxt/icon',
    '@vueuse/nuxt',
    '@nuxtjs/google-fonts',
    'nuxt-umami',
    '@nuxtjs/tailwindcss'
    // Temporarily removing Sentry
    // '@sentry/nuxt/module'
  ],

  // Component loading optimization
  build: {
    transpile: ['vue-toastification'],
    analyze: process.env.ANALYZE === 'true'
  },

  umami: {
    id: '9350451a-f9e6-4689-982a-8cca95c64978',
    host: 'https://umami.tools.ejfox.com',
    autoTrack: true,
    ignoreLocalhost: true
  },

  runtimeConfig: {
    // Private keys that are exposed to the server
    MONKEYTYPE_TOKEN: process.env.MONKEYTYPE_TOKEN || '',
    githubToken: process.env.GITHUB_TOKEN || '',
    GITHUB_TOKEN: process.env.GITHUB_TOKEN || '',
    CHESS_USERNAME: process.env.CHESS_USERNAME || '',
    RESCUETIME_TOKEN: process.env.RESCUETIME_TOKEN || '',

    public: {
      baseUrl:
        process.env.NODE_ENV === 'production'
          ? 'https://ejfox.com'
          : 'http://localhost:3000',
      apiBase:
        process.env.NODE_ENV === 'production'
          ? 'https://ejfox.com/api'
          : 'http://localhost:3000/api',
      debug: process.env.DEBUG === 'true'
    }
  },

  nitro: {
    preset: 'netlify',
    experimental: {
      asyncContext: true
    },
    prerender: {
      failOnError: false,
      crawlLinks: false,
      routes: ['/']
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
  },

  tailwindcss: {
    configPath: './tailwind.config.js',
    exposeConfig: true,
    quiet: true
  },

  sourcemap: {
    client: 'hidden'
  },

  // Add global CSS for transitions
  css: ['~/assets/css/transitions.css']
})
