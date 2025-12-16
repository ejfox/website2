/**
 * @file photos.get.ts
 * @description Proxies photo statistics from external ejfox.photos API
 * @endpoint GET /api/photos
 * @returns Photo statistics from https://ejfox.photos/api/stats
 */
import { defineEventHandler, createError } from 'h3'

export default defineEventHandler(async () => {
  try {
    const response = await fetch('https://ejfox.photos/api/stats')
    if (!response.ok) {
      throw new Error(
        `Failed to fetch stats: ${response.status} ${response.statusText}`
      )
    }
    const data = await response.json()
    return data
  } catch (error) {
    console.error('Error proxying stats endpoint:', error)
    throw createError({
      statusCode: 500,
      message: 'Failed to fetch photo stats',
    })
  }
})
