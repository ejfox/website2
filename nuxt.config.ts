// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  // SSR configuration
  ssr: false,

  modules: [
    '@nuxt/ui',
    '@nuxt/icon',
    '@vueuse/nuxt',
    '@nuxtjs/google-fonts',
    'nuxt-umami',
    '@nuxtjs/tailwindcss',
    '@sentry/nuxt/module'
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
  },

  tailwindcss: {
    config: {
      content: [
        'content/**/*.md' // Make sure markdown content is included
      ],
      plugins: [require('@tailwindcss/typography')],
      theme: {
        extend: {
          typography: {
            DEFAULT: {
              css: {
                maxWidth: 'none', // Override prose max-width
                color: 'inherit', // Let parent color flow through
                a: {
                  color: 'inherit',
                  '&:hover': {
                    color: 'inherit'
                  }
                }
              }
            }
          }
        }
      }
    }
  },

  sentry: {
    sourceMapsUploadOptions: {
      org: 'ej-fox',
      project: 'website2'
    },
    dsn: 'https://f705c0c6c4843d3f5560ce4af0909611@o4507578103431168.ingest.us.sentry.io/4508847853338624',
    autoInjectServerSentry: 'top-level-import'
  },

  sourcemap: {
    client: 'hidden'
  }
})
