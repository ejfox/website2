import { getBlogRoutes, getBuildInfo } from './nuxt.helpers'

// Shared Cache-Control values (referenced in nitro.routeRules below)
const CACHE_PRERENDER = 'public, max-age=3600, s-maxage=86400'
const CACHE_DYNAMIC =
  'public, max-age=60, s-maxage=300, stale-while-revalidate=600'
const CACHE_IMMUTABLE = 'public, max-age=31536000, immutable'

// Routes prerendered at build time — all share the same long cache.
const PRERENDERED_ROUTES = [
  '/',
  '/blog',
  '/blog/**',
  '/projects',
  '/gear',
  '/now',
  '/sitemap',
  '/gists',
  '/changelog',
  '/on-this-day',
  '/predictions',
  '/predictions/**',
]
const prerenderRules = Object.fromEntries(
  PRERENDERED_ROUTES.map((route) => [
    route,
    { prerender: true, headers: { 'Cache-Control': CACHE_PRERENDER } },
  ])
)

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
        // Cloudflare beacon preconnect removed — let it load after LCP
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
        // Feed auto-discovery — lets feed readers find these from any page
        {
          rel: 'alternate',
          type: 'application/rss+xml',
          title: 'EJ Fox · Blog',
          href: 'https://ejfox.com/rss.xml',
        },
        {
          rel: 'alternate',
          type: 'application/rss+xml',
          title: 'EJ Fox · Week notes',
          href: 'https://ejfox.com/week-notes-rss.xml',
        },
        {
          rel: 'alternate',
          type: 'application/rss+xml',
          title: 'EJ Fox · Gists',
          href: 'https://ejfox.com/gists-rss.xml',
        },
        {
          rel: 'alternate',
          type: 'application/feed+json',
          title: 'EJ Fox · JSON Feed',
          href: 'https://ejfox.com/feed.json',
        },
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
    WEBMENTION_IO_TOKEN: process.env.WEBMENTION_IO_TOKEN || '',
    MONKEYTYPE_TOKEN: process.env.MONKEYTYPE_TOKEN || '',
    OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY || '',
    EDITOR_CONTEXT_TOKEN: process.env.EDITOR_CONTEXT_TOKEN || '',
    UMAMI_URL: process.env.UMAMI_URL || 'https://umami.tools.ejfox.com',
    UMAMI_USERNAME: process.env.UMAMI_USERNAME || 'admin',
    UMAMI_PASSWORD: process.env.UMAMI_PASSWORD || '',
    UMAMI_WEBSITE_ID:
      process.env.UMAMI_WEBSITE_ID || '165590cb-c361-4ad8-9459-6c6390744c64',
    SUPABASE_URL: process.env.SUPABASE_URL || '',
    SUPABASE_KEY: process.env.SUPABASE_KEY || '',
    HEALTH_WEBHOOK_SECRET: process.env.HEALTH_WEBHOOK_SECRET || '',
    scrapEnlightenerAuth: process.env.SCRAP_ENLIGHTENER_AUTH || '',
    calcomApiKey: process.env.CAL_COM_API_KEY || '',
    buildInfo: getBuildInfo(),

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

        // Recursively copy content directory (exclude private dirs)
        const excludeDirs = ['backup', 'drafts']
        try {
          await fs.cp(source, dest, {
            recursive: true,
            errorOnExist: false,
            force: true,
            filter: (src: string) =>
              !excludeDirs.some(
                (d) => src.includes(`/${d}/`) || src.endsWith(`/${d}`)
              ),
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
      // Friends & Family booking (/ff) — hidden link, never index/follow.
      // Header covers crawlers that ignore the in-page meta tag and the
      // case where JS doesn't run. Not in the sitemap, not linked anywhere.
      '/ff': { headers: { 'X-Robots-Tag': 'noindex, nofollow' } },
      // Kitchen Sink (/kitchen-sink) — private in-house component browser.
      // Hidden like /ff: noindex header + in-page meta, not in nav or sitemap.
      // ssr:false — it's a pure client-side dev tool that dynamically renders
      // arbitrary components; skipping SSR avoids hydration mismatches and keeps
      // its ?raw source bundles out of the server render path.
      '/kitchen-sink': {
        ssr: false,
        headers: { 'X-Robots-Tag': 'noindex, nofollow' },
      },
      // API Docs (/api-docs) — private OpenAPI-style route browser, like
      // /kitchen-sink. Driven by utils/apiCatalog.ts; also served as /openapi.json.
      '/api-docs': { headers: { 'X-Robots-Tag': 'noindex, nofollow' } },
      '/openapi.json': { headers: { 'X-Robots-Tag': 'noindex, nofollow' } },
      // public/README.md (asset provenance notes) serves at /README.md — noindex it.
      '/README.md': { headers: { 'X-Robots-Tag': 'noindex, nofollow' } },
      // Only disable caching in dev mode
      ...(process.env.NODE_ENV === 'development' && {
        '/**': { headers: { 'Cache-Control': 'no-cache' } },
      }),
      // Production caching for sub-1s LCP
      ...(process.env.NODE_ENV === 'production' && {
        // Prerendered pages (see PRERENDERED_ROUTES) — long cache
        ...prerenderRules,
        // Dynamic pages — SSR with edge caching
        '/calendar': { headers: { 'Cache-Control': CACHE_DYNAMIC } },
        '/stats': { headers: { 'Cache-Control': CACHE_DYNAMIC } },
        // Static assets — cache forever
        '/_nuxt/**': { headers: { 'Cache-Control': CACHE_IMMUTABLE } },
        // API routes
        '/api/**': {
          cors: true,
          headers: {
            'Cache-Control': 'public, max-age=300, s-maxage=3600',
            'CDN-Cache-Control': 'max-age=3600, stale-if-error=86400',
          },
        },
        // Pre-rendered tag pages — cache aggressively
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
  // Keep the dev watcher off data/content churn. Watching these burned 10k+
  // fds, and macOS posix_spawn EBADFs once pipe fds land above ~10240 — which
  // broke nitro's esbuild service mid-startup. None of these need HMR.
  ignore: [
    '.claude/**',
    'data/**',
    'content/processed/**',
    'content/backup/**',
    'content/rides/**',
    'public/images/**',
  ],

  vite: {
    server: {
      watch: {
        ignored: [
          '**/.claude/**',
          '**/data/**',
          '**/content/processed/**',
          '**/content/backup/**',
          '**/content/rides/**',
          '**/public/images/**',
        ],
      },
    },
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
