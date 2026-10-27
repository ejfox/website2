/**
 * @file fetch.ts
 * @description Native fetch with an AbortController timeout (default 10s), and
 *   a fetchJSON wrapper (timeout covers the body too) that returns null
 *   instead of throwing. Used by
 *   server/utils/smallweb.ts and server/api/atlas/{live,remediation}.get.ts.
 *
 * Errors carry the URL in their message, so don't pass URLs with secrets in
 *   the query string (they would land in pm2 logs).
 */

/**
 * Fetch with timeout and better error handling
 * Prevents network errors from becoming uncaught exceptions
 */
export async function fetchWithTimeout(
  url: string,
  options: Record<string, any> = {},
  timeoutMs: number = 10000
): Promise<Response> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    })
    // Cleared once headers arrive: this bounds the connection and headers
    // only. Callers that read the body should bound it themselves (fetchJSON).
    clearTimeout(timeoutId)
    return response
  } catch (error) {
    clearTimeout(timeoutId)

    // Handle abort/timeout
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`Request timeout after ${timeoutMs}ms: ${url}`, {
        cause: error,
      })
    }

    // Handle connection errors
    if (error instanceof Error) {
      // Convert ECONNRESET and similar errors to friendly messages
      if (
        error.message.includes('ECONNRESET') ||
        error.message.includes('ECONNREFUSED') ||
        error.message.includes('ETIMEDOUT')
      ) {
        const msg = `Network error connecting to ${url}: ${error.message}`
        throw new Error(msg, { cause: error })
      }
    }

    throw error
  }
}

/**
 * Safely fetch JSON with timeout and error handling. The timeout covers the
 * whole request, body read included: the signal stays live through json().
 */
export async function fetchJSON<T = any>(
  url: string,
  options: Record<string, any> = {},
  timeoutMs: number = 10000
): Promise<T | null> {
  try {
    const response = await fetch(url, {
      ...options,
      signal: AbortSignal.timeout(timeoutMs),
    })

    if (!response.ok) {
      console.warn(`API request failed: ${url} - ${response.status}`)
      return null
    }

    return await response.json()
  } catch (error) {
    console.error(
      `Failed to fetch ${url}:`,
      error instanceof Error ? error.message : error
    )
    return null
  }
}
