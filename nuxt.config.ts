export default defineNuxtConfig({
  // CRITICAL: Enable experimental features for Nuxt 4 performance
  experimental: {
    payloadExtraction: false, // Prevents large payload chunks
    inlineSSRStyles: true, // FIXED: Inline CSS to prevent FOUC on VPS
    treeshakeClientOnly: true // Remove client-only components from SSR
  },

  // Essential modules only - DELETE over-customization
  modules: ['@nuxtjs/tailwindcss'],

  // DELETE over-customization: Use Tailwind defaults
  tailwindcss: {
    viewer: false,
    exposeConfig: false
  },

  // Minimal dev server config
  devServer: {
    port: 3006
  },

  // Optimized imports
  imports: {
    dirs: ['composables', 'utils']
  },

  // DELETE oxc-parser by disabling TypeScript checking
  typescript: {
    typeCheck: false,
    strict: false
  },

  devtools: { enabled: false },

  // DELETE @nuxt/image config - using simple img tags now

  // Runtime config
  runtimeConfig: {
    GITHUB_TOKEN: process.env.GITHUB_TOKEN || '',
    CHESS_USERNAME: process.env.CHESS_USERNAME || '',
    RESCUETIME_TOKEN: process.env.RESCUETIME_TOKEN || '',
    LASTFM_API_KEY: process.env.LASTFM_API_KEY || '',
    UMAMI_USERNAME: process.env.UMAMI_USERNAME || 'admin',
    UMAMI_PASSWORD: process.env.UMAMI_PASSWORD || '',

    public: {
      // DELETE: Supabase config removed with dependency
      baseUrl: process.env.NUXT_PUBLIC_BASE_URL || (
        process.env.NODE_ENV === 'production'
          ? 'https://ejfox.com'
          : 'http://localhost:3006'
      ),
      debug: process.env.DEBUG === 'true'
    }
  },

  // CRITICAL: Vite optimizations for Nuxt 4
  vite: {
    build: {
      cssCodeSplit: true, // Split CSS to prevent large stylesheets
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['vue', '@vue/reactivity', '@vue/runtime-core']
          }
        }
      }
    },
    optimizeDeps: {
      include: ['vue', '@vue/reactivity'] // Pre-bundle critical deps
    }
  },

  // Performance-optimized Nitro config
  nitro: {
    preset: 'node-server',
    minify: false, // DISABLED: Debug file corruption issues first
    // CRITICAL: Enable build-time optimizations
    experimental: {
      wasm: false // Disable WASM for faster startup
    },
    // Disable compression - let reverse proxy handle it
    compressPublicAssets: false,
    prerender: {
      routes: ['/', '/blog', '/projects', '/gear']
    },
    // SIMPLIFIED: Remove complex caching that might interfere with VPS
    routeRules: {
      '/': { prerender: true },
      '/blog/**': { prerender: true },
      '/projects': { prerender: true },
      '/gear': { prerender: true }
    }
  },

  // Clean app config
  app: {
    head: {
      title: 'EJ Fox',
      htmlAttrs: { lang: 'en' },
      meta: [
        {
          name: 'description',
          content: 'EJ Fox: Hacker, Journalist, & Dataviz Specialist'
        },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
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
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        {
          rel: 'preconnect',
          href: 'https://fonts.gstatic.com',
          crossorigin: 'anonymous'
        },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Fjalla+One&family=Signika+Negative:wght@300;400;500;600;700&family=Red+Hat+Mono:wght@400;500;600&display=swap'
        }
      ]
    }
  },

  css: ['~/assets/css/global.css']
})
