/**
 * Fetch with timeout and better error handling
 * Prevents ECONNRESET and other network errors from becoming uncaught exceptions
 */
export async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeoutMs: number = 10000
): Promise<Response> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    })
    clearTimeout(timeoutId)
    return response
  } catch (error) {
    clearTimeout(timeoutId)

    // Handle abort/timeout
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`Request timeout after ${timeoutMs}ms: ${url}`)
    }

    // Handle connection errors
    if (error instanceof Error) {
      // Convert ECONNRESET and similar errors to friendly messages
      if (
        error.message.includes('ECONNRESET') ||
        error.message.includes('ECONNREFUSED') ||
        error.message.includes('ETIMEDOUT')
      ) {
        throw new Error(`Network error connecting to ${url}: ${error.message}`)
      }
    }

    throw error
  }
}

/**
 * Safely fetch JSON with timeout and error handling
 */
export async function fetchJSON<T = any>(
  url: string,
  options: RequestInit = {},
  timeoutMs: number = 10000
): Promise<T | null> {
  try {
    const response = await fetchWithTimeout(url, options, timeoutMs)

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
