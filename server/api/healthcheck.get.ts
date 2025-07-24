import { setResponseStatus } from 'h3'

export default defineEventHandler(async (event) => {
  try {
    // Get version info
    let commit = 'unknown'
    try {
      const { execSync } = await import('child_process')
      commit = execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim().substring(0, 8)
    } catch (e) {
      // Git not available
    }

    // Basic health checks
    const health: unknown = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: Math.floor(process.uptime()),
      node: process.version,
      commit,
      env: process.env.NODE_ENV,
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024), // MB
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) // MB
      }
    }

    // Test critical API endpoint
    try {
      await $fetch('/api/manifest')
      health.manifest = 'ok'
    } catch (_error) {
      health.manifest = 'error'
      health.status = 'degraded'
    }

    // Set appropriate HTTP status
    if (health.status !== 'healthy') {
      setResponseStatus(event, 503)
    }

    return health
  } catch (_error) {
    setResponseStatus(event, 500)
    return {
      status: 'error',
      timestamp: new Date().toISOString(),
      error: 'Health check failed'
    }
  }
})