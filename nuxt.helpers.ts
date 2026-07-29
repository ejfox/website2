import { execSync } from 'node:child_process'
import { promises as fs } from 'node:fs'
import path from 'node:path'

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

// Blog routes to prerender, read from the processed manifest at build time.
// Filters out anything that shouldn't be public (drafts, hidden, unlisted,
// password-protected, robots, SHOUTING system files like CLAUDE.md).
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
        if (post.draft === true || post.metadata?.draft === true) return false
        if (post.hidden === true || post.metadata?.hidden === true) return false
        if (post.unlisted === true || post.metadata?.unlisted === true)
          return false
        const hasPassword = !!(
          post.password ||
          post.passwordHash ||
          post.metadata?.password ||
          post.metadata?.passwordHash
        )
        if (hasPassword) return false
        // Skip SHOUTING system files (CLAUDE.md, WIKILINK-OPPORTUNITIES.md)
        if (post.slug === post.slug.toUpperCase()) return false
        if (post.slug.startsWith('robots/')) return false
        if (post.slug.includes('drafts/')) return false
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
