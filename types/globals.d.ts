// Global type definitions for the website
// Most DOM/Web API types come from TypeScript's lib.dom.d.ts

import type { Router, RouteLocationNormalizedLoaded } from 'vue-router'

declare global {
  // D3 UMD global (when loaded via CDN/script tag)
  // For typed usage, import from 'd3' package instead
  var d3: typeof import('d3') | undefined

  // Process env for Node.js
  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV?: 'development' | 'production' | 'test'
      ANALYZE?: string
      DEBUG?: string
      GITHUB_TOKEN?: string
      MONKEYTYPE_TOKEN?: string
      CHESS_USERNAME?: string
      RESCUETIME_TOKEN?: string
      LASTFM_API_KEY?: string
      LASTFM_SHARED_SECRET?: string
      UMAMI_USERNAME?: string
      UMAMI_PASSWORD?: string
      REDIS_HOST?: string
    }
  }
}

// Module augmentations for Nuxt/Vue
declare module '#app' {
  interface NuxtApp {
    $router: Router
    $route: RouteLocationNormalizedLoaded
  }
}

declare module 'vue' {
  interface ComponentCustomProperties {
    $router: Router
    $route: RouteLocationNormalizedLoaded
  }
}

// Nuxt auto-imports are handled by .nuxt/imports.d.ts
// No need to redeclare useRouter, useRoute, etc.

export {}
