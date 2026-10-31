/**
 * @file nuxt.helpers.ts
 * @description Build-time helpers for nuxt.config.ts: getBlogRoutes() (the
 *   /blog/* routes to prerender, from content/processed/manifest-lite.json)
 *   and getBuildInfo() (the commit/branch baked into runtimeConfig.buildInfo
 *   for /api/healthcheck). Runs at config-eval time, so no `~` aliases and
 *   no Nuxt imports.
 *   Gotcha: a prerendered page ignores runtime gates and beats middleware,
 *   so anything that must stay dynamic (scheduled posts, redirected
 *   sections) has to be filtered out here.
 */
import { execSync } from 'node:child_process'
import { promises as fs } from 'node:fs'
import path from 'node:path'
// Relative, not `~/`: this runs at config-eval time, before aliases resolve.
import { isListed } from './utils/visibility.mjs'

interface ManifestPost {
  slug?: string
  [key: string]: unknown
}

// Blog routes to prerender, read from the processed manifest at build time.
// Public posts only, minus robots, sections that redirect and SHOUTING system
// files like CLAUDE.md.
export async function getBlogRoutes(): Promise<string[]> {
  try {
    const manifestPath = path.join(
      process.cwd(),
      'content/processed/manifest-lite.json'
    )
    const manifest: ManifestPost[] = JSON.parse(
      await fs.readFile(manifestPath, 'utf-8')
    )

    return manifest
      .filter((post) => {
        if (!post.slug) return false
        // Scheduled posts especially must not be baked into static HTML — a
        // prerendered page would ignore the runtime embargo. Left out here,
        // they render on demand once their publish time passes. Unlisted
        // posts render on demand too (noindex), they just aren't prerendered.
        if (!isListed(post)) return false
        // Skip SHOUTING system files (CLAUDE.md, WIKILINK-OPPORTUNITIES.md)
        if (post.slug === post.slug.toUpperCase()) return false
        if (post.slug.startsWith('robots/')) return false
        if (post.slug.includes('drafts/')) return false
        // /blog/projects/* and /blog/reading/* 301 to /projects/* and
        // /reading/* (server/middleware/blog-{projects,reading}-redirect.ts).
        // Prerendered HTML is served as a static asset BEFORE middleware runs,
        // so baking these would silently defeat both redirects (it did: the
        // /blog/projects twins served 200 in prod).
        if (post.slug.startsWith('projects/')) return false
        if (post.slug.startsWith('reading/')) return false
        return true
      })
      .map((post) => `/blog/${post.slug}`)
  } catch (error) {
    console.error('❌ Error reading blog manifest:', error)
    return []
  }
}

function gitOr(cmd: string, fallback: string): string {
  try {
    return execSync(cmd).toString().trim() || fallback
  } catch {
    return fallback
  }
}

// Captured at build time (config eval runs during `nuxt build`) and baked into
// the server bundle, so /api/healthcheck and /api/build-info report the commit
// that was actually built + deployed — no reliance on a .build-info.json file
// that the deploy never ships (it tars only .output/). Falls back to git, then
// CI env vars, then 'unknown'.
export function getBuildInfo() {
  const commitLong =
    process.env.GITHUB_SHA || gitOr('git rev-parse HEAD', 'unknown')
  const commit =
    process.env.BUILD_COMMIT ||
    (commitLong !== 'unknown'
      ? commitLong.slice(0, 8)
      : gitOr('git rev-parse --short HEAD', 'unknown'))
  const branch =
    process.env.GITHUB_REF_NAME ||
    gitOr('git rev-parse --abbrev-ref HEAD', 'unknown')
  return {
    commit,
    commitLong,
    branch,
    buildDate: new Date().toISOString(),
    buildTimestamp: Date.now(),
  }
}
