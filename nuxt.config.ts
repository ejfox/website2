export default defineNuxtConfig({
  // CRITICAL: Enable experimental features for Nuxt 4
  experimental: {
    payloadExtraction: false, // Prevents large payload chunks
    inlineSSRStyles: true, // Inline CSS to prevent FOUC on VPS
    treeshakeClientOnly: true // Remove client-only components from SSR
  },

  // Load Google Fonts
  app: {
    head: {
      link: [
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: 'anonymous' },
        { 
          rel: 'stylesheet', 
          href: 'https://fonts.googleapis.com/css2?family=Fjalla+One&family=Red+Hat+Mono:wght@300;400;500;600;700&family=Signika+Negative:wght@300;400;500;600;700&display=swap'
        }
      ]
    }
  },

  modules: ['@nuxtjs/tailwindcss'],
  
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
      baseUrl: process.env.NUXT_PUBLIC_BASE_URL || (
        process.env.NODE_ENV === 'production'
          ? 'https://ejfox.com'
          : 'http://localhost:3006'
      ),
      debug: process.env.DEBUG === 'true',
      debugContent: process.env.DEBUG_CONTENT === 'true',
      nodeEnv: process.env.NODE_ENV || 'development'
    }
  },

  // Performance-optimized Nitro config
  nitro: {
    preset: 'node-server',
    minify: false, // Disabled for debugging bundle corruption
    experimental: {
      wasm: false // Disable WASM for faster startup
    },
    compressPublicAssets: false, // Let reverse proxy handle compression
    prerender: {
      routes: ['/', '/blog', '/projects', '/gear']
    },
    routeRules: {
      '/': { prerender: true },
      '/blog/**': { prerender: true },
      '/projects': { prerender: true },
      '/gear': { prerender: true }
    }
  },

  // Optimized Vite config for Nuxt 4
  vite: {
    build: {
      cssCodeSplit: true,
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['vue', '@vue/reactivity', '@vue/runtime-core']
          }
        }
      }
    },
    optimizeDeps: {
      include: ['vue', '@vue/reactivity']
    }
  },

  css: ['~/assets/css/global.css']
})
