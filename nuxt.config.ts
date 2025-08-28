export default defineNuxtConfig({
  // Enable Nuxt 4 compatibility mode
  future: {
    compatibilityVersion: 4
  },
  
  // CRITICAL: Enable experimental features for Nuxt 4 - optimized for sub-1s FCP
  experimental: {
    payloadExtraction: false, // Prevents large payload chunks
    inlineSSRStyles: true, // Inline CSS to prevent FOUC
    treeshakeClientOnly: true, // Remove client-only components from SSR
    sharedPrerenderData: true, // Share data between prerendered pages
    typedPages: true, // Enable typed routing
    renderJsonPayloads: false, // Reduce payload size
    viewTransition: false // Disable view transitions for faster navigation
  },

  // Removed Google Fonts for faster FCP
  app: {
    head: {
      link: []
    }
  },

  modules: ['@nuxtjs/tailwindcss'],
  port: 3006,
  devServer: {
    port: 3006
  },

  // Runtime config - CRITICAL for preventing process.env in client bundle
  runtimeConfig: {
    // Private server-only vars
    GITHUB_TOKEN: process.env.GITHUB_TOKEN || '',
    CHESS_USERNAME: process.env.CHESS_USERNAME || '',
    RESCUETIME_TOKEN: process.env.RESCUETIME_TOKEN || '',
    LASTFM_API_KEY: process.env.LASTFM_API_KEY || '',
    UMAMI_USERNAME: process.env.UMAMI_USERNAME || 'admin',
    UMAMI_PASSWORD: process.env.UMAMI_PASSWORD || '',

    // Public client-accessible vars
    public: {
      baseUrl:
        process.env.NUXT_PUBLIC_BASE_URL ||
        (process.env.NODE_ENV === 'production'
          ? 'https://ejfox.com'
          : 'http://localhost:3006'),
      debug: process.env.DEBUG === 'true',
      debugContent: process.env.DEBUG_CONTENT === 'true',
      nodeEnv: process.env.NODE_ENV || 'development'
    }
  },

  // Performance-optimized Nitro config for Nuxt 4
  nitro: {
    preset: 'node-server',
    minify: false, // Disabled for debugging bundle corruption
    experimental: {
      wasm: false, // Disable WASM for faster startup
      asyncContext: true // Enable async context support (Nuxt 4 feature)
    },
    compressPublicAssets: false, // Let reverse proxy handle compression
    prerender: {
      routes: ['/', '/blog', '/projects', '/gear'],
      crawlLinks: true // Automatically discover and prerender linked pages
    },
    routeRules: {
      '/': { prerender: true },
      '/blog/**': { prerender: true },
      '/projects': { prerender: true },
      '/gear': { prerender: true },
      '/api/**': { cors: true } // Enable CORS for API routes
    }
  },

  // Ultra-optimized Vite config for sub-1s FCP
  vite: {
    build: {
      cssCodeSplit: false, // Inline all CSS
      cssMinify: 'esbuild',
      minify: 'esbuild',
      target: 'esnext', // Use modern JS features
      rollupOptions: {
        output: {
          manualChunks: (id) => {
            // Extract heavy vendor libs to separate chunk
            if (id.includes('node_modules')) {
              if (id.includes('vue') || id.includes('@vue')) return 'vue'
              if (id.includes('d3')) return 'd3'
              return 'vendor'
            }
          }
        }
      }
    },
    optimizeDeps: {
      include: ['vue', '@vue/reactivity', '@vueuse/core'],
      exclude: ['d3', 'd3-dsv', 'd3-format'], // Lazy load heavy libs
      force: true
    },
    esbuild: {
      drop: process.env.NODE_ENV === 'production' ? ['console', 'debugger'] : [],
      legalComments: 'none', // Remove comments
      tsconfigRaw: {
        compilerOptions: {
          experimentalDecorators: false
        }
      }
    }
  },

  css: ['~/assets/css/global.css']
})
