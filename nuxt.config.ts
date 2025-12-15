/* eslint-disable no-console */

async function _getScrapTags() {
  try {
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_KEY) {
      console.warn('❌ Supabase not configured, skipping tag discovery')
      return []
    }

    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_KEY
    )

    console.log('🔍 Discovering unique tags for prerendering...')
    // Only select tags field for faster query, not all data
    const { data, error } = await supabase
      .from('scraps')
      .select('tags')
      .limit(5000) // Reasonable limit to avoid timeout

    if (error) {
      console.error('❌ Tag discovery error:', error)
      return []
    }

    const tagSet = new Set<string>()
    data?.forEach((scrap) => {
      if (scrap.tags && Array.isArray(scrap.tags)) {
        scrap.tags.forEach((tag) => tagSet.add(tag))
      }
    })

    const tags = Array.from(tagSet).sort()
    console.log(`✅ Discovered ${tags.length} unique tags for prerendering`)

    return tags
  } catch (error) {
    console.error('❌ Error discovering tags:', error)
    return []
  }
}

export default defineNuxtConfig({
  // Lock in current Nitro behavior (silences warning)
  compatibilityDate: '2025-12-14',

  // Enable Nuxt 4 compatibility mode
  future: {
    compatibilityVersion: 4,
  },

  // Force SSR mode for consistency
  ssr: true,

  // CRITICAL: Enable experimental features for Nuxt 4
  // Optimized for sub-1s FCP (First Contentful Paint)
  experimental: {
    payloadExtraction: false, // Prevents large payload chunks
    treeshakeClientOnly: true, // Remove client-only components from SSR
    sharedPrerenderData: false, // Can cause hydration issues in dev
    typedPages: true, // Enable typed routing
    renderJsonPayloads: false, // Reduce payload size
    viewTransition: true, // Enable instant view transitions (Nuxt 4)
  },

  // Aggressive router prefetching for instant navigation
  router: {
    options: {
      linkActiveClass: 'router-link-active',
      linkExactActiveClass: 'router-link-exact-active',
    },
  },

  // Removed Google Fonts for faster FCP
  app: {
    head: {
      htmlAttrs: {
        lang: 'en',
      },
      link: [
        // IndieAuth authorization endpoint
        { rel: 'authorization_endpoint', href: 'https://indieauth.com/auth' },
        // IndieAuth token endpoint
        { rel: 'token_endpoint', href: 'https://tokens.indieauth.com/token' },
        // Webmention endpoint
        {
          rel: 'webmention',
          href: 'https://webmention.io/ejfox.com/webmention',
        },
        // Pingback endpoint (legacy, but still used)
        { rel: 'pingback', href: 'https://webmention.io/ejfox.com/xmlrpc' },
        // WebSub hub for real-time feed notifications
        { rel: 'hub', href: 'https://pubsubhubbub.superfeedr.com' },
      ],
    },
  },

  modules: ['@nuxtjs/tailwindcss'],
  port: 3006,
  devServer: {
    port: 3006,
  },

  // Runtime config - CRITICAL for preventing process.env in client bundle
  runtimeConfig: {
    // Private server-only vars
    GITHUB_TOKEN: process.env.GITHUB_TOKEN || '',
    CHESS_USERNAME: process.env.CHESS_USERNAME || '',
    RESCUETIME_TOKEN: process.env.RESCUETIME_TOKEN || '',
    LASTFM_API_KEY: process.env.LASTFM_API_KEY || '',
    LASTFM_SHARED_SECRET: process.env.LASTFM_SHARED_SECRET || '',
    MONKEYTYPE_TOKEN: process.env.MONKEYTYPE_TOKEN || '',
    OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',
    YOUTUBE_API_KEY: process.env.YOUTUBE_API_KEY || '',
    YOUTUBE_CHANNEL_ID: process.env.YOUTUBE_CHANNEL_ID || '',
    UMAMI_USERNAME: process.env.UMAMI_USERNAME || 'admin',
    UMAMI_PASSWORD: process.env.UMAMI_PASSWORD || '',
    KALSHI_KEY_ID: process.env.KALSHI_KEY_ID || '',
    KALSHI_PRIVATE_KEY: process.env.KALSHI_PRIVATE_KEY || '',
    SUPABASE_URL: process.env.SUPABASE_URL || '',
    SUPABASE_KEY: process.env.SUPABASE_KEY || '',
    scrapEnlightenerAuth: process.env.SCRAP_ENLIGHTENER_AUTH || '',

    // Public client-accessible vars
    public: {
      baseUrl:
        process.env.NUXT_PUBLIC_BASE_URL ||
        (process.env.NODE_ENV === 'production'
          ? 'https://ejfox.com'
          : 'http://localhost:3006'),
      debug: process.env.DEBUG === 'true',
      debugContent: process.env.DEBUG_CONTENT === 'true',
      nodeEnv: process.env.NODE_ENV || 'development',
    },
  },

  // Performance-optimized Nitro config for Nuxt 4
  nitro: {
    preset: 'node-server',
    minify: true, // Re-enable for production
    legacyExternals: true, // Fix node-externals performance issue
    experimental: {
      wasm: false, // Disable WASM for faster startup
      asyncContext: true, // Enable async context support (Nuxt 4 feature)
    },
    compressPublicAssets: false, // Let reverse proxy handle compression
    prerender: {
      concurrency: 12, // Faster prerendering
      routes: [], // Will be populated dynamically
      crawlLinks: false, // Causes issues with broken links
    },
    // Copy content directory to .output for API routes to access
    hooks: {
      compiled: async (nitro) => {
        const { promises: fs } = await import('node:fs')
        const path = await import('node:path')

        const source = path.join(nitro.options.rootDir, 'content')
        const dest = path.join(nitro.options.output.dir, 'content')

        // Recursively copy content directory
        try {
          await fs.cp(source, dest, {
            recursive: true,
            errorOnExist: false,
            force: true,
          })
          console.log(`✓ Copied content directory to ${dest}`)
        } catch (err: any) {
          // Ignore ENOENT errors during hot reload race conditions
          if (err?.code !== 'ENOENT') {
            throw err
          }
        }
      },
    },
    routeRules: {
      // Only disable caching in dev mode
      ...(process.env.NODE_ENV === 'development' && {
        '/**': { headers: { 'Cache-Control': 'no-cache' } },
      }),
      // API routes - production only caching
      ...(process.env.NODE_ENV === 'production' && {
        '/api/**': {
          cors: true,
          headers: {
            'Cache-Control': 'public, max-age=300, s-maxage=3600',
            'Cloudflare-CDN-Cache-Control':
              'max-age=3600, stale-if-error=86400',
          },
        },
        // Pre-rendered tag pages - cache aggressively
        '/scraps/**': {
          headers: {
            'Cache-Control': 'public, max-age=86400, s-maxage=604800',
            'Cloudflare-CDN-Cache-Control':
              'max-age=604800, stale-if-error=2592000',
          },
        },
      }),
    },
  },

  // Ultra-optimized Vite config for sub-1s FCP
  vite: {
    build: {
      cssCodeSplit: true, // Split CSS for faster parallel loading
      cssMinify: 'esbuild',
      minify: 'esbuild',
      target: 'esnext', // Use modern JS features
      sourcemap: false, // Skip sourcemaps in production
      reportCompressedSize: false, // Skip gzip size reporting (saves ~2s)
      rollupOptions: {
        output: {
          manualChunks: {
            // Static chunks instead of function (faster)
            vue: ['vue', '@vue/reactivity', '@vueuse/core'],
            d3: [
              'd3',
              'd3-dsv',
              'd3-format',
              'd3-scale-chromatic',
              'd3-scale',
              'd3-array',
              'd3-shape',
            ],
          },
        },
      },
    },
    optimizeDeps: {
      include: ['vue', '@vue/reactivity', '@vueuse/core'],
      exclude: [
        'd3',
        'd3-dsv',
        'd3-format',
        'd3-scale-chromatic',
        'd3-scale',
        'd3-array',
        'd3-shape',
      ], // Lazy load heavy libs
      // force: true // DISABLED FOR DEV - was forcing aggressive dep caching
    },
    esbuild: {
      drop:
        process.env.NODE_ENV === 'production' ? ['console', 'debugger'] : [],
      legalComments: 'none', // Remove comments
      tsconfigRaw: {
        compilerOptions: {
          experimentalDecorators: false,
        },
      },
    },
  },

  css: ['~/assets/css/global.css'],
})
