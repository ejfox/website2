import type { H3Event as _H3Event } from 'h3'

export interface ApiRequestOptions extends RequestInit {
  timeout?: number
  maxRetries?: number
  retryDelay?: number
}

export async function makeApiRequest<T>(
  url: string,
  options: ApiRequestOptions = {}
): Promise<T> {
  const {
    timeout = 10000,
    maxRetries = 3,
    retryDelay = 1000,
    ...fetchOptions
  } = options

  let attempt = 0

  while (attempt < maxRetries) {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), timeout)

      const response = await fetch(url, {
        ...fetchOptions,
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw createError({
          statusCode: response.status,
          statusMessage: `API error: ${response.statusText}`,
          message: `Failed to fetch from ${url}`,
        })
      }

      return (await response.json()) as T
    } catch (error: any) {
      attempt++

      // Don't retry on authentication errors
      if (error.statusCode === 401 || error.statusCode === 403) {
        throw error
      }

      if (attempt === maxRetries) {
        throw createError({
          statusCode: 500,
          statusMessage: 'API Request Failed',
          message: `Failed to fetch from ${url} after ${maxRetries} attempts: ${error.message}`,
        })
      }

      // Exponential backoff with jitter
      const backoffTime = Math.min(
        retryDelay * Math.pow(2, attempt - 1) + Math.random() * 1000,
        10000
      )
      await new Promise((resolve) => setTimeout(resolve, backoffTime))
    }
  }

  throw createError({
    statusCode: 500,
    statusMessage: 'Unexpected Error',
    message: 'Unexpected error in API request',
  })
}

export function validateToken(
  token: string | undefined,
  serviceName: string
): string {
  if (!token) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Configuration Error',
      message: `${serviceName} API token not configured`,
    })
  }
  return token
}

export async function rateLimitDelay(ms: number = 250): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms))
}

export function createRetryWrapper<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3
): () => Promise<T> {
  return async (): Promise<T> => {
    let attempt = 0

    while (attempt < maxRetries) {
      try {
        return await fn()
      } catch (error) {
        attempt++
        if (attempt === maxRetries) throw error

        const backoffTime = Math.min(
          1000 * Math.pow(2, attempt) + Math.random() * 1000,
          10000
        )
        await new Promise((resolve) => setTimeout(resolve, backoffTime))
      }
    }

    throw new Error('Unexpected error in retry wrapper')
  }
}

export function createCacheKey(
  prefix: string,
  ...parts: (string | number)[]
): string {
  return `${prefix}:${parts.join(':')}`
}

export async function withErrorLogging<T>(
  operation: () => Promise<T>,
  context: string
): Promise<T> {
  try {
    return await operation()
  } catch (error: any) {
    console.error(`[${context}] Error:`, error.message || error)
    throw error
  }
}
