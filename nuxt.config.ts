import pkg from './package.json'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  app: {
    head: {
      title: 'EJ Fox',
      meta: [
        {
          name: 'description',
          content:
            'EJ Fox: Hacker, Journalist, & Dataviz Specialist finding interesting ways to look at the world by exploring and explaining data '
        },
        { property: 'og:title', content: 'EJ Fox' },
        {
          property: 'og:description',
          content:
            'EJ Fox: Hacker, Journalist, & Dataviz Specialist finding interesting ways to look at the world by exploring and explaining data '
        },
        { property: 'og:image', content: 'https://ejfox.com/og-image.png' },
        { property: 'og:url', content: 'https://ejfox.com' },
        { property: 'og:type', content: 'website' },
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:site', content: '@mrejfox' },
        { name: 'twitter:creator', content: '@mrejfox' },
        { name: 'twitter:title', content: 'EJ Fox' },
        {
          name: 'twitter:description',
          content:
            'EJ Fox: Hacker, Journalist, & Dataviz Specialist finding interesting ways to look at the world by exploring and explaining data '
        },
        { name: 'twitter:image', content: 'https://ejfox.com/og-image.png' }
      ]
    }
  },

  // SSR configuration
  ssr: true,

  devtools: { enabled: true },

  modules: [
    '@nuxt/ui',
    '@nuxt/icon',
    '@unlok-co/nuxt-stripe',
    '@vueuse/nuxt',
    '@vueuse/motion/nuxt',
    [
      '@nuxtjs/google-fonts',
      {
        families: {
          Figtree: [400, 700]
        }
      }
    ],
    'nuxt-umami'
  ],

  // Component loading optimization
  build: {
    transpile: ['vue-toastification']
  },

  runtimeConfig: {
    rescuetimeToken: process.env.RESCUETIME_TOKEN,
    CHESS_USERNAME: process.env.CHESS_USERNAME,
    MONKEYTYPE_TOKEN: process.env.MONKEYTYPE_TOKEN,
    githubToken: process.env.GITHUB_TOKEN,

    public: {
      baseUrl:
        process.env.NODE_ENV === 'production'
          ? 'https://ejfox.com'
          : 'http://localhost:3000',
      OPENAI_API_KEY: process.env.OPENAI_API_KEY,
      PRODUCTION: process.env.PRODUCTION,
      donations: {
        crypto: {
          BTC: '3DE42VUyUKSikQ9eUeFKv2EkKVms7Pmd1G',
          ETH: '0x63958715F8e9Fd6CF0652394a89bb2AdD0a11686',
          SOL: '97V8rDTyHuL1oTTt3qC3oUXckTKSQVM7Fhd3rj5692cL'
        },
        github: 'ejfox',
        kofi: 'ejfox'
      },
      MONKEY_TYPE_API: process.env.MONKEY_TYPE_API,
      LASTFM_API: process.env.LASTFM_API || 'https://ws.audioscrobbler.com/2.0',
      LASTFM_USER: process.env.LASTFM_USER,
      LASTFM_TOKEN: process.env.LASTFM_TOKEN,
      STRAVA_API: process.env.STRAVA_API,
      STRAVA_TOKEN: process.env.STRAVA_TOKEN,
      GITHUB_API: process.env.GITHUB_API || 'https://api.github.com',
      GITHUB_TOKEN: process.env.GITHUB_TOKEN,
      CHESS_API: process.env.CHESS_API,
      CHESS_USER: process.env.CHESS_USER,
      RESCUETIME_API: process.env.RESCUETIME_API,
      RESCUETIME_TOKEN: process.env.RESCUETIME_TOKEN,
      FLICKR_API_KEY: process.env.FLICKR_API_KEY,
      FLICKR_USER_ID: process.env.FLICKR_USER_ID,
      INSTAGRAM_TOKEN: process.env.INSTAGRAM_TOKEN,
      OPENWEATHER_API_KEY: process.env.OPENWEATHER_API_KEY,
      HOME_LAT: process.env.HOME_LAT,
      HOME_LNG: process.env.HOME_LNG,
      SUPABASE_URL: process.env.SUPABASE_URL,
      SUPABASE_KEY: process.env.SUPABASE_KEY,
      apiBase:
        process.env.NODE_ENV === 'production'
          ? 'https://ejfox.com/api'
          : 'http://localhost:3000/api'
    }
  },

  umami: {
    id: '9350451a-f9e6-4689-982a-8cca95c64978',
    host: 'https://umami.tools.ejfox.com',
    autoTrack: true
  },

  googleFonts: {
    prefetch: true,
    families: {
      'Signika Negative': [200, 300, 400, 500, 600, 700, 800],
      'Fjalla One': [400],
      'Red Hat Mono': [300, 400]
    }
  },

  stripe: {
    server: {
      key: process.env.STRIPE_SECRET_KEY,
      options: {}
    },
    client: {
      key: process.env.STRIPE_PUBLISHABLE_KEY,
      options: {}
    }
  },

  nitro: {
    preset: 'node-server',
    routeRules: {
      '/stats': { ssr: true },
      '/rss.xml': { prerender: true },
      '/pgp.txt': {
        headers: {
          'content-type': 'application/pgp-keys'
        }
      }
    },
    // Add content directory to public assets
    publicAssets: [
      {
        dir: 'content/processed',
        maxAge: 60 * 60 * 24 * 7 // 1 week
      }
    ]
  },

  imports: {
    imports: [
      {
        from: '#imports',
        name: 'queryContent'
      }
    ]
  },

  components: {
    dirs: [
      {
        path: '~/components',
        pathPrefix: false
      }
    ]
  }
})
