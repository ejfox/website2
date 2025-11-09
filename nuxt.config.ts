export default defineNuxtConfig({
  // Enable Nuxt 4 compatibility mode
  future: {
    compatibilityVersion: 4
  },

  // Force SSR mode for consistency
  ssr: true,

  // CRITICAL: Enable experimental features for Nuxt 4 - optimized for sub-1s FCP
  experimental: {
    payloadExtraction: false, // Prevents large payload chunks
    inlineSSRStyles: true, // Inline CSS to prevent FOUC - CRITICAL FOR NO FLICKERING
    treeshakeClientOnly: true, // Remove client-only components from SSR
    sharedPrerenderData: false, // Can cause hydration issues in dev
    typedPages: true, // Enable typed routing
    renderJsonPayloads: false, // Reduce payload size
    viewTransition: false // Disable view transitions for faster navigation
  },

  // Removed Google Fonts for faster FCP
  app: {
    head: {
      htmlAttrs: {
        lang: 'en'
      },
      link: [
        // IndieAuth authorization endpoint
        { rel: 'authorization_endpoint', href: 'https://indieauth.com/auth' },
        // IndieAuth token endpoint
        { rel: 'token_endpoint', href: 'https://tokens.indieauth.com/token' },
        // Webmention endpoint
        { rel: 'webmention', href: 'https://webmention.io/ejfox.com/webmention' }
      ]
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
    MONKEYTYPE_TOKEN: process.env.MONKEYTYPE_TOKEN || '',
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
      asyncContext: true, // Enable async context support (Nuxt 4 feature)
      buildCache: true // CACHE LORD: Keep build artifacts between deploys
    },
    compressPublicAssets: false, // Let reverse proxy handle compression
    // Copy content directory to .output for API routes to access
    hooks: {
      'compiled': async (nitro) => {
        const { promises: fs } = await import('fs')
        const path = await import('path')

        const source = path.join(nitro.options.rootDir, 'content')
        const dest = path.join(nitro.options.output.dir, 'content')

        // Recursively copy content directory
        await fs.cp(source, dest, { recursive: true })
        console.log(`✓ Copied content directory to ${dest}`)
      }
    },
    routeRules: {
      // Only disable caching in dev mode
      ...(process.env.NODE_ENV === 'development' && {
        '/**': { headers: { 'Cache-Control': 'no-cache' } }
      }),
      // API routes - production only caching
      ...(process.env.NODE_ENV === 'production' && {
        '/api/**': {
          cors: true,
          headers: {
            'Cache-Control': 'public, max-age=300, s-maxage=3600',
            'Cloudflare-CDN-Cache-Control': 'max-age=3600, stale-if-error=86400'
          }
        }
      })
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
      exclude: ['d3', 'd3-dsv', 'd3-format'] // Lazy load heavy libs
      // force: true // DISABLED FOR DEV - was forcing aggressive dep caching
    },
    esbuild: {
      drop:
        process.env.NODE_ENV === 'production' ? ['console', 'debugger'] : [],
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
