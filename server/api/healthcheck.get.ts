export default defineEventHandler(async (event) => {
  try {
    // Basic health checks
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      node: process.version,
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024), // MB
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) // MB
      }
    }

    // Test critical API endpoint
    try {
      await $fetch('/api/manifest')
      health.manifest = 'ok'
    } catch (error) {
      health.manifest = 'error'
      health.status = 'degraded'
    }

    // Set appropriate HTTP status
    if (health.status !== 'healthy') {
      setResponseStatus(event, 503)
    }

    return health
  } catch (error) {
    setResponseStatus(event, 500)
    return {
      status: 'error',
      timestamp: new Date().toISOString(),
      error: 'Health check failed'
    }
  }
})