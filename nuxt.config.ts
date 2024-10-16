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
            'EJ Fox: Hacker, Journalist, & Dataviz Specialist finding interesting ways to look at the world by exploring and explaining data ',
        },

        // opengraph tags
        { property: 'og:title', content: 'EJ Fox' },
        {
          property: 'og:description',
          content:
            'EJ Fox: Hacker, Journalist, & Dataviz Specialist finding interesting ways to look at the world by exploring and explaining data ',
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
            'EJ Fox: Hacker, Journalist, & Dataviz Specialist finding interesting ways to look at the world by exploring and explaining data ',
        },
        { name: 'twitter:image', content: 'https://ejfox.com/og-image.png' },
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
    // add the openai api key to the runtime config
    public: {
      // baseUrl: process.env.BASE_URL,
      baseUrl: 'https://localhost:3000',
      OPENAI_API_KEY: process.env.OPENAI_API_KEY,
      PRODUCTION: process.env.PRODUCTION
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
      '/rss.xml': { prerender: true }
    }
  }
})
