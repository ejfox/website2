// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  // SSR configuration
  ssr: false,

  // Add compatibility date
  compatibilityDate: '2024-02-23',

  // Remove View Transitions API
  // experimental: {
  //   viewTransition: true
  // },

  // Remove plugin registration
  // plugins: ['~/plugins/viewTransitions.client.ts'],

  // Dev server configuration
  devServer: {
    port: 3006
  },

  // Disable HMR completely
  vite: {
    server: {
      hmr: false
    }
  },

  modules: [
    '@nuxt/ui',
    '@nuxt/icon',
    '@vueuse/nuxt',
    '@nuxtjs/google-fonts',
    'nuxt-umami',
    '@nuxtjs/tailwindcss'
    // Removing nuxt-security as it's causing conflicts
    // 'nuxt-security'
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
    LASTFM_API_KEY: process.env.LASTFM_API_KEY || '',
    LASTFM_SHARED_SECRET: process.env.LASTFM_SHARED_SECRET || '',
    LASTFM_API_KEY: process.env.LASTFM_API_KEY || '',
    LASTFM_SHARED_SECRET: process.env.LASTFM_SHARED_SECRET || '',

    public: {
      baseUrl:
        process.env.NODE_ENV === 'production'
          ? 'https://ejfox.com'
          : 'http://localhost:3006',
      apiBase:
        process.env.NODE_ENV === 'production'
          ? 'https://ejfox.com/api'
          : 'http://localhost:3006/api',
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
      },
      // Add caching for static assets
      '/assets/**': {
        headers: {
          'cache-control': 'public, max-age=31536000, immutable'
        }
      },
      // Add caching for static pages
      '/blog/**': {
        headers: {
          'cache-control': 'public, max-age=3600, s-maxage=86400'
        }
      },
      // Add special handling for Cloudinary images
      '/_ipx/**': {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'cache-control': 'public, max-age=31536000, immutable'
        }
      },
      '/projects': {
        headers: {
          'cache-control': 'public, max-age=3600, s-maxage=86400'
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
        },
        {
          'http-equiv': 'Content-Security-Policy',
          content:
            "default-src 'self'; img-src 'self' data: https://res.cloudinary.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://umami.tools.ejfox.com; frame-src 'self' https://cal.com; connect-src 'self' https://umami.tools.ejfox.com;"
        }
      ],
      link: [
        {
          rel: 'dns-prefetch',
          href: 'https://fonts.gstatic.com'
        },
        {
          rel: 'dns-prefetch',
          href: 'https://res.cloudinary.com'
        }
      ],
      htmlAttrs: {
        lang: 'en'
      }
    },
    pageTransition: {
      name: 'page',
      mode: 'out-in'
    }
  },

  googleFonts: {
    families: {
      'Signika Negative': [200, 300, 400, 500, 600, 700, 800],
      'Red Hat Mono': [300, 400],
      'Fjalla One': [400]
    },
    display: 'swap',
    prefetch: true,
    preconnect: true,
    preload: true,
    download: true
  },

  tailwindcss: {
    configPath: './tailwind.config.js',
    exposeConfig: true,
    quiet: true
  },

  sourcemap: {
    client: 'hidden'
  },

  // Keep basic CSS but remove transitions.css
  css: []
})
