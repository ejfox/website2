import pkg from './package.json'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  app: {
    head: {
      title: pkg.name,
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: pkg.version }
      ]
    }
  },

  // for netlify deploy
  ssr: true,

  devtools: { enabled: true },

  modules: [
    '@nuxt/ui',
    '@nuxt/icon',
    // '@nuxtjs/supabase',
    // '@nuxt/content'
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

  runtimeConfig: {
    // add the openai api key to the runtime config
    public: {
      OPENAI_API_KEY: process.env.OPENAI_API_KEY,
      PRODUCTION: process.env.PRODUCTION
    }
  },

  googleFonts: {
    prefetch: true,
    families: {
      'Signika Negative': [200, 300, 400, 500, 600, 700, 800],
      // "Paytone One": [400],
      'Fjalla One': [400],
      // Finlandica: [400, 500, 700],
      'Red Hat Mono': [400]
    }
  },

  compatibilityDate: '2024-09-15'
})
