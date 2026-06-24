/**
 * @file build-info.get.ts
 * @description Returns build metadata (commit, branch, build date) baked into
 *   the bundle at build time via runtimeConfig — see getBuildInfo() in
 *   nuxt.config.ts. No longer reads a .build-info.json file (the deploy never
 *   shipped it, so that path returned a stale commit).
 * @endpoint GET /api/build-info
 * @returns Build information with commit hash, branch name, and build date
 */

export default defineEventHandler((event) => {
  const buildInfo = useRuntimeConfig(event).buildInfo

  return {
    ...buildInfo,
    meta: {
      endpoint: '/api/build-info',
      timestamp: new Date().toISOString(),
    },
  }
})
