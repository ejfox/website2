export default defineEventHandler(async () => {
  const config = useRuntimeConfig()
  
  try {
    const response = await fetch('https://umami.tools.ejfox.com/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: config.UMAMI_USERNAME,
        password: config.UMAMI_PASSWORD,
      }),
    })

    if (!response.ok) {
      throw new Error(`Authentication failed: ${response.status}`)
    }

    const data = await response.json()
    
    return {
      success: true,
      token: data.token,
    }
  } catch (error) {
    console.error('Umami auth error:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to authenticate with Umami',
    })
  }
})