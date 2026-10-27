/**
 * @file healthcheck.get.ts
 * @description GET /api/healthcheck. Uptime/health for the deploy workflow and
 *   external monitors: { status, uptime, node, commit, env, memory, manifest }.
 *   The deploy polls this until `commit` matches the built SHA and `manifest`
 *   is "ok" (see .github/workflows/deploy.yml). No cache in this file.
 *   Responds 503 when degraded (manifest fetch failed), 500 on an internal error.
 */
import { setResponseStatus } from 'h3'

export default defineEventHandler(async (event) => {
  try {
    // Baked into the bundle at build time via runtimeConfig (nuxt.config.ts),
    // so this reflects the SHA that was actually built + deployed — not a
    // stale .build-info.json the deploy never shipped.
    const commit = useRuntimeConfig(event).buildInfo?.commit || 'unknown'

    // Basic health checks
    const health = {
      status: 'healthy' as 'healthy' | 'degraded' | 'error',
      timestamp: new Date().toISOString(),
      uptime: Math.floor(process.uptime()),
      version: '2.0.0', // Nuxt 4 + massive dependency deletion refactor
      node: process.version,
      commit,
      env: process.env.NODE_ENV,
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024), // MB
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024), // MB
      },
      manifest: 'pending' as 'ok' | 'error' | 'pending',
    }

    // Test critical API endpoint
    try {
      await $fetch('/api/manifest')
      health.manifest = 'ok'
    } catch {
      health.manifest = 'error'
      health.status = 'degraded'
    }

    // Set appropriate HTTP status
    if (health.status !== 'healthy') {
      setResponseStatus(event, 503)
    }

    return health
  } catch {
    setResponseStatus(event, 500)
    return {
      status: 'error',
      timestamp: new Date().toISOString(),
      error: 'Health check failed',
    }
  }
})
