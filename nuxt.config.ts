// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  // SSR configuration
  ssr: true,

  // Add compatibility date
  compatibilityDate: '2024-02-23',
  
  // Use optimized head configuration
  app: {
    head: {
      htmlAttrs: { lang: 'en' },
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'format-detection', content: 'telephone=no' },
        { name: 'description', content: 'EJ Fox - Hacker, Journalist, Data Visualization Specialist' }
      ],
      link: [
        // Preconnect to critical domains
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: 'anonymous' },
        { rel: 'preconnect', href: 'https://res.cloudinary.com' },
        { rel: 'dns-prefetch', href: 'https://fonts.googleapis.com' },
        { rel: 'dns-prefetch', href: 'https://fonts.gstatic.com' },
        { rel: 'dns-prefetch', href: 'https://res.cloudinary.com' }
      ],
      // Removed inline styles - let Nuxt handle it with experimental.inlineStyles
    }
  },
  
  // Nuxt 3.15+ optimizations for FCP
  experimental: {
    payloadExtraction: false, // Reduce payload size
    treeshakeClientOnly: true, // Remove server-only code from client
    componentIslands: true, // Enable component islands
    asyncContext: true, // Better async handling
    inlineStyles: true, // Inline critical CSS for FCP
    renderJsonPayloads: false, // Don't render JSON payloads inline
    asyncRenderScript: true // Load render script asynchronously
  },

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
    '@nuxtjs/web-vitals',
    '@nuxt/scripts'
    // 'nuxt-delay-hydration' // Disabled - causes content flashing
    // Removing nuxt-security as it's causing conflicts
    // 'nuxt-security'
    // Temporarily removing Sentry
    // '@sentry/nuxt/module'
  ],
  
  // Delay hydration disabled - causes content flashing
  // delayHydration: {
  //   mode: 'init', // Hydrate when page is idle
  //   debug: process.env.NODE_ENV === 'development'
  // },

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


  // Additional build configuration for Docker
  build: {
    transpile: ['vue-toastification'],
    analyze: process.env.ANALYZE === 'true'
  },


  // Google Fonts configuration - FIXED FOR FOUC
  googleFonts: {
    families: {
      'Signika Negative': [400, 600],
      'Red Hat Mono': [400],
      'Fjalla One': [400]
    },
    display: 'swap',
    preload: true, // PRELOAD CRITICAL FONTS
    prefetch: true, // PREFETCH FOR FASTER LOADING
    preconnect: true,
    download: true,
    base64: false,
    subsets: ['latin'],
    stylePath: 'css/fonts.css',
    inject: true,
    overwriting: false
  },


  // Vite optimizations - aggressive code splitting for FCP
  vite: {
    server: {
      hmr: false // Disable HMR completely for production-like dev
    },
    css: {
      // Extract CSS to separate file for async loading
      extract: true
    },
    build: {
      // Increase chunk size warning limit
      chunkSizeWarningLimit: 500, // Lower limit to encourage splitting
      // Enable CSS code splitting
      cssCodeSplit: true,
      rollupOptions: {
        output: {
          // Aggressive code splitting for faster FCP
          manualChunks(id) {
            // Keep server-only deps out of client bundle
            if (id.includes('stripe') || id.includes('supabase') || id.includes('cheerio')) {
              return null; // Don't bundle server-only deps
            }
            
            // CRITICAL: Don't let shiki into ANY initial bundle
            if (id.includes('shiki') || id.includes('@shikijs')) {
              return; // Let Vite handle it as dynamic import
            }
            
            // Split node_modules into smaller chunks
            if (id.includes('node_modules')) {
              // Heavy libraries - separate chunks
              if (id.includes('d3')) return 'charts';
              
              // Medium-sized libraries
              if (id.includes('date-fns')) return 'date-utils';
              if (id.includes('@iconify') || id.includes('heroicons')) return 'icons';
              if (id.includes('anime')) return 'animations';
              
              // Everything else in vendor
              return 'vendor';
            }
            
            // Split app code by feature
            if (id.includes('/components/stats/')) return 'stats-components';
            if (id.includes('/components/gear/')) return 'gear-components';
            if (id.includes('/components/blog/')) return 'blog-components';
            if (id.includes('/composables/')) return 'composables';
            if (id.includes('/utils/')) return 'utils';
            
            // Default app chunk for remaining
            return 'app';
          },
          // Use content hash for better caching
          chunkFileNames: '_nuxt/[name]-[hash].js',
          entryFileNames: '_nuxt/[name]-[hash].js',
          assetFileNames: '_nuxt/[name]-[hash][extname]'
        },
        // Mark server-only deps as external for client build
        external: ['stripe', '@supabase/supabase-js', 'chance', 'cheerio', 'canvas', 'jsdom']
      }
    },
    optimizeDeps: {
      include: ['vue', 'vue-router', '@vue/runtime-core', '@vue/runtime-dom', '@vue/shared', 'chance'],
      exclude: [
        'vue-demi', 
        'stripe', 
        '@supabase/supabase-js', 
        'canvas', 
        'jsdom'
      ]
    },
    ssr: {
      noExternal: ['@supabase/supabase-js', 'stripe'] // These are server-only
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
    minify: true,
    sourceMap: false,
    compressPublicAssets: {
      gzip: true,
      brotli: true
    },
    experimental: {
      asyncContext: true,
      wasm: true
    },
    prerender: {
      failOnError: false,
      crawlLinks: true,
      routes: ['/', '/blog', '/projects', '/stats', '/gear'], // Prerender main pages
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
      // Home page - aggressive prerendering and caching
      '/': {
        prerender: true,
        headers: {
          'cache-control': 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800'
        }
      },
      '/api/**': {
        cors: true,
        headers: {
          'Access-Control-Allow-Methods': 'GET,HEAD,PUT,PATCH,POST,DELETE',
          'Access-Control-Allow-Origin': '*'
        }
      },
      // Static assets - immutable cache
      '/assets/**': {
        headers: {
          'cache-control': 'public, max-age=31536000, immutable'
        }
      },
      '/_nuxt/**': {
        headers: {
          'cache-control': 'public, max-age=31536000, immutable'
        }
      },
      // Blog pages - prerender with cache
      '/blog': {
        prerender: true,
        headers: {
          'cache-control': 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800'
        }
      },
      '/blog/**': {
        headers: {
          'cache-control': 'public, max-age=3600, s-maxage=86400'
        },
        prerender: true
      },
      // Projects page - prerender
      '/projects': {
        prerender: true,
        headers: {
          'cache-control': 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800'
        }
      },
      // Gear page - prerender
      '/gear': {
        prerender: true,
        headers: {
          'cache-control': 'public, max-age=3600, s-maxage=86400'
        }
      },
      // Stats page - shorter cache due to dynamic data
      '/stats': {
        headers: {
          'cache-control': 'public, max-age=300, s-maxage=600'
        }
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
      // Cloudinary images - immutable cache
      '/_ipx/**': {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'cache-control': 'public, max-age=31536000, immutable'
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
        // Critical preconnects first
        {
          rel: 'preconnect',
          href: 'https://fonts.googleapis.com'
        },
        {
          rel: 'preconnect',
          href: 'https://fonts.gstatic.com',
          crossorigin: 'anonymous'
        },
        // Non-critical dns-prefetch
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

  // Page transitions with anime.js
  plugins: ['~/plugins/pageTransitions.client.ts'],


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
