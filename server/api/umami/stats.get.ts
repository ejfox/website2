/**
 * @file umami/stats.get.ts
 * @description Fetches page-specific analytics from Umami with authentication and overall website stats
 * @endpoint GET /api/umami/stats
 * @params url: string - URL to fetch page view statistics for
 * @returns Page views for specific URL and overall website statistics from Umami
 */
/* eslint-disable no-console */
export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const { url } = query

  if (!url) {
    throw createError({
      statusCode: 400,
      statusMessage: 'URL parameter is required',
    })
  }

  const config = useRuntimeConfig()

  try {
    // Use the API user credentials from environment
    const username = config.UMAMI_USERNAME || process.env.UMAMI_USERNAME
    const password = config.UMAMI_PASSWORD || process.env.UMAMI_PASSWORD

    if (!username || !password) {
      throw createError({
        statusCode: 500,
        statusMessage:
          'UMAMI_USERNAME and UMAMI_PASSWORD environment variables required',
      })
    }

    // Debug logging
    console.log('Umami auth attempt:', {
      username: username,
      hasPassword: !!password,
      passwordLength: password?.length,
    })

    // First, authenticate to get token
    const authResponse = await fetch(
      'https://umami.tools.ejfox.com/api/auth/login',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: username,
          password: password,
        }),
      }
    )

    if (!authResponse.ok) {
      const errorText = await authResponse.text()
      console.error('Auth failed:', authResponse.status, errorText)
      throw new Error(
        `Authentication failed: ${authResponse.status} - ${errorText}`
      )
    }

    const authData = await authResponse.json()
    const token = authData.token

    // Website ID from your Umami setup
    const websiteId = '165590cb-c361-4ad8-9459-6c6390744c64'

    // Get page views for the specific URL
    const statsResponse = await fetch(
      `https://umami.tools.ejfox.com/api/websites/${websiteId}/pageviews?url=${encodeURIComponent(url as string)}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    )

    if (!statsResponse.ok) {
      const errorText = await statsResponse.text()
      console.error('Stats API failed:', statsResponse.status, errorText)
      throw new Error(
        `Failed to fetch stats: ${statsResponse.status} - ${errorText}`
      )
    }

    const statsData = await statsResponse.json()

    // Also get overall website stats
    const overallResponse = await fetch(
      `https://umami.tools.ejfox.com/api/websites/${websiteId}/stats`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    )

    let overallStats = null
    if (overallResponse.ok) {
      overallStats = await overallResponse.json()
    }

    return {
      url,
      pageViews: statsData,
      overallStats,
      lastUpdated: new Date().toISOString(),
    }
  } catch (error) {
    console.error('Umami stats error:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch Umami stats',
    })
  }
})
