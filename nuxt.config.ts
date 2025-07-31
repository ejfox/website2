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

  // Reduce router warnings in dev
  vue: {
    compilerOptions: {
      isCustomElement: (_tag) => false
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

  // Auto-imports configuration
  imports: {
    // Auto-import from these directories
    dirs: [
      'composables',
      'composables/**',
      'utils',
      'utils/**'
    ]
  },
  
  // TypeScript configuration
  typescript: {
    typeCheck: false // Disable type checking during build for performance
  },

  // Disable oxc-parser for Docker compatibility
  experimental: {
    defaults: {
      nuxt: {
        compilerOptions: {
          types: []
        }
      }
    }
  },

  // Additional build configuration for Docker
  build: {
    transpile: ['vue-toastification'],
    analyze: process.env.ANALYZE === 'true'
  },

  // Force disable oxc via feature flags
  features: {
    oxc: false
  },

  // Google Fonts configuration
  googleFonts: {
    families: {
      'Signika Negative': [300, 400, 500, 600, 700],
      'Red Hat Mono': [300, 400, 500, 600, 700],
      'Fjalla One': [400]
    },
    display: 'swap',
    preload: true,
    prefetch: false, // Reduce prefetch to avoid over-fetching
    preconnect: true,
    download: true, // Enable local font download for better performance
    base64: false,
    subsets: ['latin'], // Only load latin subset
    stylePath: 'css/fonts.css' // Optimize CSS delivery
  },


  // Vite optimizations
  vite: {
    server: {
      hmr: false // Disable HMR completely for production-like dev
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            // Separate vendor chunks for better caching
            'vue-vendor': ['vue', 'vue-router'],
            'utils': ['date-fns', 'lodash-es']
          }
        }
      }
    },
    optimizeDeps: {
      include: ['vue', 'vue-router', 'date-fns'],
      exclude: ['vue-demi']
    }
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
    UMAMI_USERNAME: process.env.UMAMI_USERNAME || 'admin',
    UMAMI_PASSWORD:
      process.env.UMAMI_PASSWORD ||
      'muzzle-binding-credits-suspense-nevada-defied-remedy-cups',

    public: {
      supabaseUrl: process.env.SUPABASE_URL,
      supabaseKey: process.env.SUPABASE_KEY,
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
    compressPublicAssets: {
      gzip: true,
      brotli: true
    },
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
        driver: 'redis'
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
      },
      // Add more aggressive caching for static routes
      '/': {
        headers: {
          'cache-control': 'public, max-age=1800, s-maxage=3600'
        }
      },
      '/stats': {
        headers: {
          'cache-control': 'public, max-age=1800, s-maxage=3600'
        }
      },
      '/gear': {
        headers: {
          'cache-control': 'public, max-age=3600, s-maxage=86400'
        }
      },
      '/gists': {
        headers: {
          'cache-control': 'public, max-age=3600, s-maxage=86400'
        }
      },
      // Cache RSS feeds aggressively
      '/rss.xml': {
        headers: {
          'cache-control': 'public, max-age=3600, s-maxage=86400'
        }
      },
      '/scraps-rss.xml': {
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
        },
        {
          name: 'theme-color',
          content: '#ffffff',
          media: '(prefers-color-scheme: light)'
        },
        {
          name: 'theme-color', 
          content: '#0a0a0a',
          media: '(prefers-color-scheme: dark)'
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

  // Page transitions with anime.js
  plugins: ['~/plugins/pageTransitions.client.ts'],

  // Performance optimizations
  experimental: {
    payloadExtraction: false, // Reduce hydration payload
    viewTransition: false // Disable native transitions, use anime.js instead
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
