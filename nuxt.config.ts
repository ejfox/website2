// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  // SSR configuration
  ssr: true,

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
    port: 3006,
    host: '0.0.0.0'
  },

  // Disable HMR completely
  vite: {
    server: {
      hmr: false
    }
  },

  modules: [
    '@nuxtjs/tailwindcss',
    '@nuxtjs/google-fonts',
    '@nuxt/icon',
    '@nuxt/image',
    '@nuxtjs/web-vitals'
    // Removing nuxt-security as it's causing conflicts
    // 'nuxt-security'
    // Temporarily removing Sentry
    // '@sentry/nuxt/module'
  ],

  // Google Fonts configuration
  googleFonts: {
    families: {
      'Signika Negative': [300, 400, 500, 600, 700],
      'Red Hat Mono': [300, 400, 500, 600, 700],
      'Fjalla One': [400]
    },
    display: 'swap',
    preload: true,
    prefetch: true,
    preconnect: true,
    download: false,
    base64: false
  },

  // Component loading optimization
  build: {
    transpile: ['vue-toastification'],
    analyze: process.env.ANALYZE === 'true'
  },

  // Image optimization with @nuxt/image
  image: {
    cloudinary: {
      baseURL: 'https://res.cloudinary.com/ejf/image/upload/'
    },
    quality: 80,
    format: ['webp', 'avif'],
    screens: {
      xs: 320,
      sm: 640,
      md: 768,
      lg: 1024,
      xl: 1280,
      xxl: 1536
    },
    presets: {
      avatar: {
        modifiers: {
          format: 'webp',
          width: 50,
          height: 50,
          quality: 80
        }
      },
      cover: {
        modifiers: {
          format: 'webp',
          quality: 80,
          width: 1200
        }
      }
    }
  },

  // Web Vitals configuration
  webVitals: {
    provider: 'log', // Options: 'log', 'ga', 'gtm', 'partytown', etc.
    debug: process.env.NODE_ENV === 'development',
    disabled: false
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
    preset: 'node-server',
    compressPublicAssets: true,
    minify: true,
    experimental: {
      asyncContext: true,
      wasm: true
    },
    prerender: {
      failOnError: false,
      crawlLinks: true,
      routes: ['/'],
      ignore: ['/api/**']
    },
    storage: {
      redis: {
        driver: 'redis',
        // Enable Redis caching in production
        // host: process.env.REDIS_HOST || 'localhost'
      }
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
        },
        prerender: true
      },
      // Cache API responses
      '/api/stats': {
        headers: {
          'cache-control': 'public, max-age=300, s-maxage=600'
        }
      },
      '/api/youtube': {
        headers: {
          'cache-control': 'public, max-age=1800, s-maxage=3600'
        }
      },
      '/api/github': {
        headers: {
          'cache-control': 'public, max-age=1800, s-maxage=3600'
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
          name: 'viewport',
          content: 'width=device-width, initial-scale=1'
        },
        {
          'http-equiv': 'Content-Security-Policy',
          content:
            "default-src 'self'; img-src 'self' data: https://res.cloudinary.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://umami.tools.ejfox.com; frame-src 'self' https://cal.com; connect-src 'self' https://umami.tools.ejfox.com;"
        }
      ],
      link: [
        {
          rel: 'preconnect',
          href: 'https://fonts.gstatic.com',
          crossorigin: ''
        },
        {
          rel: 'preconnect',
          href: 'https://res.cloudinary.com'
        },
        {
          rel: 'dns-prefetch',
          href: 'https://fonts.googleapis.com'
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

  // Performance optimizations
  experimental: {
    payloadExtraction: false, // Reduce hydration payload
    inlineSSRStyles: false,   // Prevent FOUC but reduce initial HTML size
    viewTransition: true      // Modern page transitions
  },

  // Bundle optimization
  optimization: {
    treeShake: {
      body: true
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

  // Keep basic CSS but remove transitions.css
  css: ['~/assets/css/global.css']
})
