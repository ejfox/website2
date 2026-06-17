/**
 * @file healthcheck.get.ts
 * @description System health check endpoint with uptime, memory usage, and manifest validation
 * @endpoint GET /api/healthcheck
 * @returns Health status object with system metrics, version info, and service status (returns 503 if degraded, 500 if error)
 */
import { setResponseStatus } from 'h3'
import { readFileSync } from 'node:fs'

let buildCommit = 'unknown'
try {
  const buildInfo = JSON.parse(readFileSync('.build-info.json', 'utf8'))
  buildCommit = buildInfo.commit || 'unknown'
} catch {
  // .build-info.json may not exist in dev
}

export default defineEventHandler(async (event) => {
  try {
    const commit = buildCommit

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
