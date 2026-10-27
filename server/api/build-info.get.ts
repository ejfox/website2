/**
 * @file build-info.get.ts
 * @description GET /api/build-info. Commit, branch and build date baked into the
 *   bundle at build time via runtimeConfig.buildInfo (getBuildInfo() in
 *   nuxt.config.ts), plus meta.timestamp. Used by Footer.vue. Never throws.
 *   Doesn't read a .build-info.json file: the deploy never shipped it, so that
 *   path returned a stale commit.
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
