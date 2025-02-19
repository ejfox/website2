import type { Context } from '@netlify/edge-functions'

interface LokiLogEntry {
  stream: {
    app: string
    environment: string
    level: string
    source: string
  }
  values: [string, string][] // [timestamp, message]
}

interface LokiPayload {
  streams: {
    stream: Record<string, string>
    values: [string, string][]
  }[]
}

export default async function handler(request: Request, context: Context) {
  try {
    // Parse the log data from the request
    const logData = await request.json()

    // Get environment variables
    const LOKI_URL = Netlify.env.get('LOKI_URL')

    if (!LOKI_URL) {
      throw new Error('LOKI_URL environment variable is not set')
    }

    // Process and transform the log data
    const timestamp = Date.now().toString()
    const logEntries: LokiLogEntry[] = []

    // Handle different types of log events
    if (logData.type === 'build') {
      // Handle build events
      logEntries.push({
        stream: {
          app: 'website2',
          environment: context.site.name || 'unknown',
          level: logData.error ? 'error' : 'info',
          source: 'build'
        },
        values: [
          [
            timestamp,
            JSON.stringify({
              message: logData.message,
              error: logData.error,
              plugin: logData.plugin,
              location: logData.location
            })
          ]
        ]
      })
    } else if (logData.type === 'runtime') {
      // Handle runtime events
      logEntries.push({
        stream: {
          app: 'website2',
          environment: context.site.name || 'unknown',
          level: logData.level || 'info',
          source: 'runtime'
        },
        values: [
          [
            timestamp,
            JSON.stringify({
              message: logData.message,
              path: logData.path,
              requestId: logData.requestId,
              userAgent: logData.userAgent
            })
          ]
        ]
      })
    }

    // Format for Loki
    const lokiPayload: LokiPayload = {
      streams: logEntries.map((entry) => ({
        stream: entry.stream,
        values: entry.values
      }))
    }

    // Send to Loki
    const response = await fetch(LOKI_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(lokiPayload)
    })

    if (!response.ok) {
      throw new Error(`Failed to send logs to Loki: ${response.statusText}`)
    }

    return new Response('Logs processed successfully', { status: 200 })
  } catch (error: unknown) {
    console.error('Log drain error:', error)
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error'
    return new Response(`Log drain error: ${errorMessage}`, { status: 500 })
  }
}
