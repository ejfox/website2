import pkg from './package.json'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  // experimental: {
  //   viewTransition: true
  // },
  app: {
    head: {
      title: 'EJ Fox',
      meta: [
        {
          name: 'description',
          content:
            'EJ Fox: Hacker, Journalist, & Dataviz Specialist finding interesting ways to look at the world by exploring and explaining data '
        },

        // opengraph tags
        { property: 'og:title', content: 'EJ Fox' },
        {
          property: 'og:description',
          content:
            'EJ Fox: Hacker, Journalist, & Dataviz Specialist finding interesting ways to look at the world by exploring and explaining data '
        },
        { property: 'og:image', content: 'https://ejfox.com/og-image.png' },
        { property: 'og:url', content: 'https://ejfox.com' },
        { property: 'og:type', content: 'website' },

        // twitter opengraph tags
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

  // for netlify deploy
  ssr: true,

  devtools: { enabled: true },

  modules: [
    '@nuxt/ui',
    '@nuxt/icon',
    // 'nuxt-gtag',
    // '@nuxtjs/supabase',
    // '@nuxt/content'
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
    ]
  ],

  // gtag: {
  //   id: 'G-0CBMSSNG8P',
  // },
  runtimeConfig: {
    // Private keys
    MONKEYTYPE_TOKEN: process.env.MONKEYTYPE_TOKEN,

    // Public keys
    public: {
      baseUrl: 'https://localhost:3000',
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
      GITHUB_API: process.env.GITHUB_API,
      GITHUB_TOKEN: process.env.GITHUB_TOKEN || '',
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
      SUPABASE_KEY: process.env.SUPABASE_KEY
    }
  },

  googleFonts: {
    prefetch: true,
    families: {
      // Raleway: [100, 200, 300, 400, 500, 600, 700, 800, 900],
      'Signika Negative': [200, 300, 400, 500, 600, 700, 800],
      'Fjalla One': [400],
      // Finlandica: [400, 500, 700],
      'Red Hat Mono': [300, 400]
    }
  },

  // compatibilityDate: '2024-09-15'
  stripe: {
    // Server
    server: {
      key: process.env.STRIPE_SECRET_KEY,
      options: {}
    },
    client: {
      key: process.env.STRIPE_PUBLISHABLE_KEY,
      options: {}
    }
  },

  compatibilityDate: '2024-10-15',

  nitro: {
    routeRules: {
      '/rss.xml': { prerender: true },
      '/pgp.txt': {
        headers: {
          'content-type': 'application/pgp-keys'
        }
      }
    }
  },

  imports: {
    // ... other imports
    imports: [
      {
        from: '#imports',
        name: 'queryContent'
      }
    ]
  }
})
