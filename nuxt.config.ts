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

    // console.log('🔍 Discovering unique tags for prerendering...')
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
    // console.log(`✅ Discovered ${tags.length} unique tags for prerendering`)

    return tags
  } catch (error) {
    console.error('❌ Error discovering tags:', error)
    return []
  }
}

// Generate blog routes from manifest for prerendering
async function getBlogRoutes(): Promise<string[]> {
  try {
    const { promises: fs } = await import('node:fs')
    const path = await import('node:path')

    const manifestPath = path.join(
      process.cwd(),
      'content/processed/manifest-lite.json'
    )
    const manifestData = await fs.readFile(manifestPath, 'utf-8')
    const manifest = JSON.parse(manifestData)

    // Filter out draft, unlisted, and password-protected posts from prerendering
    interface ManifestPost {
      slug?: string
      draft?: boolean
      hidden?: boolean
      unlisted?: boolean
      password?: string
      passwordHash?: string
      metadata?: {
        draft?: boolean
        hidden?: boolean
        unlisted?: boolean
        password?: string
        passwordHash?: string
      }
    }
    const routes = manifest
      .filter((post: ManifestPost) => {
        // Skip posts without slugs or that are drafts
        if (!post.slug) return false
        if (post.draft === true || post.metadata?.draft === true) return false
        // Skip hidden posts
        if (post.hidden === true || post.metadata?.hidden === true) return false
        // Skip unlisted posts - they shouldn't be in pre-rendered routes
        if (post.unlisted === true || post.metadata?.unlisted === true)
          return false
        // Skip password-protected posts - they need dynamic handling
        const hasPassword = !!(
          post.password ||
          post.passwordHash ||
          post.metadata?.password ||
          post.metadata?.passwordHash
        )
        if (hasPassword) return false
        // Skip system files like CLAUDE.md, WIKILINK-OPPORTUNITIES.md
        if (post.slug === post.slug.toUpperCase()) return false
        // Week-notes are fine now that DOMPurify is fixed
        // Skip robots (have separate page structure)
        if (post.slug.startsWith('robots/')) return false
        // Skip drafts - shouldn't be public
        if (post.slug.includes('drafts/')) return false
        return true
      })
      .map((post: ManifestPost) => `/blog/${post.slug}`)

    // console.log(`📝 Found ${routes.length} blog posts to prerender`)
    return routes
  } catch (error) {
    console.error('❌ Error reading blog manifest:', error)
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
    sharedPrerenderData: false, // Can cause hydration issues in dev
    typedPages: true, // Enable typed routing
    renderJsonPayloads: false, // Reduce payload size
    viewTransition: true, // Enable instant view transitions (Nuxt 4)
    componentIslands: true, // Enable Nuxt Islands for partial hydration
  },

  // Inline critical CSS to eliminate render-blocking
  features: {
    inlineStyles: true,
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
        // DNS prefetch and preconnect for external resources (LCP optimization)
        {
          rel: 'preconnect',
          href: 'https://res.cloudinary.com',
          crossorigin: '',
        },
        { rel: 'dns-prefetch', href: 'https://res.cloudinary.com' },
        {
          rel: 'preconnect',
          href: 'https://static.cloudflareinsights.com',
          crossorigin: '',
        },
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
  devServer: {
    port: 3006,
  },

  // Add blog routes to prerender at build time
  hooks: {
    async 'prerender:routes'(ctx) {
      const blogRoutes = await getBlogRoutes()
      blogRoutes.forEach((route) => ctx.routes.add(route))
    },
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
    OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY || '',
    UMAMI_USERNAME: process.env.UMAMI_USERNAME || 'admin',
    UMAMI_PASSWORD: process.env.UMAMI_PASSWORD || '',
    KALSHI_KEY_ID: process.env.KALSHI_KEY_ID || '',
    KALSHI_PRIVATE_KEY: process.env.KALSHI_PRIVATE_KEY || '',
    SUPABASE_URL: process.env.SUPABASE_URL || '',
    SUPABASE_KEY: process.env.SUPABASE_KEY || '',
    scrapEnlightenerAuth: process.env.SCRAP_ENLIGHTENER_AUTH || '',
    calcomApiKey: process.env.CAL_COM_API_KEY || '',

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
      clarityId: process.env.NUXT_PUBLIC_CLARITY_ID || '',
    },
  },

  // Performance-optimized Nitro config for Nuxt 4
  nitro: {
    preset: 'node-server',
    minify: true, // Re-enable for production
    experimental: {
      wasm: false, // Disable WASM for faster startup
      asyncContext: true, // Enable async context support (Nuxt 4 feature)
    },
    compressPublicAssets: false, // Let reverse proxy handle compression
    prerender: {
      concurrency: 12, // Faster prerendering
      crawlLinks: false, // Causes issues with broken links
      failOnError: false, // Don't fail build on prerender errors
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
          // console.log(`✓ Copied content directory to ${dest}`)
        } catch (err) {
          // Ignore ENOENT errors during hot reload race conditions
          const e = err as { code?: string }
          if (e?.code !== 'ENOENT') {
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
      // Production caching rules for sub-1s LCP
      ...(process.env.NODE_ENV === 'production' && {
        // STATIC PRERENDERED PAGES - fastest possible LCP
        '/': {
          prerender: true,
          headers: {
            'Cache-Control': 'public, max-age=3600, s-maxage=86400',
          },
        },
        '/blog': {
          prerender: true,
          headers: {
            'Cache-Control': 'public, max-age=3600, s-maxage=86400',
          },
        },
        '/projects': {
          prerender: true,
          headers: {
            'Cache-Control': 'public, max-age=3600, s-maxage=86400',
          },
        },
        '/gear': {
          prerender: true,
          headers: {
            'Cache-Control': 'public, max-age=3600, s-maxage=86400',
          },
        },
        '/now': {
          prerender: true,
          headers: {
            'Cache-Control': 'public, max-age=3600, s-maxage=86400',
          },
        },
        '/sitemap': {
          prerender: true,
          headers: {
            'Cache-Control': 'public, max-age=3600, s-maxage=86400',
          },
        },
        '/gists': {
          prerender: true,
          headers: {
            'Cache-Control': 'public, max-age=3600, s-maxage=86400',
          },
        },
        '/changelog': {
          prerender: true,
          headers: {
            'Cache-Control': 'public, max-age=3600, s-maxage=86400',
          },
        },
        '/on-this-day': {
          prerender: true,
          headers: {
            'Cache-Control': 'public, max-age=3600, s-maxage=86400',
          },
        },
        // Blog posts - prerender all
        '/blog/**': {
          prerender: true,
          headers: {
            'Cache-Control': 'public, max-age=3600, s-maxage=86400',
          },
        },
        // Predictions - prerender
        '/predictions': {
          prerender: true,
          headers: {
            'Cache-Control': 'public, max-age=3600, s-maxage=86400',
          },
        },
        '/predictions/**': {
          prerender: true,
          headers: {
            'Cache-Control': 'public, max-age=3600, s-maxage=86400',
          },
        },
        // DYNAMIC PAGES - SSR with edge caching
        '/calendar': {
          headers: {
            'Cache-Control':
              'public, max-age=60, s-maxage=300, stale-while-revalidate=600',
          },
        },
        '/stats': {
          headers: {
            'Cache-Control':
              'public, max-age=60, s-maxage=300, stale-while-revalidate=600',
          },
        },
        '/kalshi': {
          headers: {
            'Cache-Control':
              'public, max-age=60, s-maxage=300, stale-while-revalidate=600',
          },
        },
        // Static assets - aggressive caching
        '/_nuxt/**': {
          headers: {
            'Cache-Control': 'public, max-age=31536000, immutable',
          },
        },
        // API routes
        '/api/**': {
          cors: true,
          headers: {
            'Cache-Control': 'public, max-age=300, s-maxage=3600',
            'CDN-Cache-Control': 'max-age=3600, stale-if-error=86400',
          },
        },
        // Pre-rendered tag pages - cache aggressively
        '/scraps/**': {
          headers: {
            'Cache-Control': 'public, max-age=86400, s-maxage=604800',
            'CDN-Cache-Control': 'max-age=604800, stale-if-error=2592000',
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
