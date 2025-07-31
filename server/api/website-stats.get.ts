export default defineEventHandler(async () => {
  const config = useRuntimeConfig()
  
  try {
    // Use the API user credentials from environment
    const username = config.UMAMI_USERNAME || process.env.UMAMI_USERNAME
    const password = config.UMAMI_PASSWORD || process.env.UMAMI_PASSWORD
    
    if (!username || !password) {
      return {
        error: 'UMAMI_USERNAME and UMAMI_PASSWORD environment variables required',
        stats: null
      }
    }
    
    // First, authenticate to get token
    const authResponse = await fetch('https://umami.tools.ejfox.com/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: username,
        password: password,
      }),
    })

    if (!authResponse.ok) {
      const errorText = await authResponse.text()
      console.error('Umami auth failed:', authResponse.status, errorText)
      return {
        error: `Authentication failed: ${authResponse.status}`,
        stats: null
      }
    }

    const authData = await authResponse.json()
    const token = authData.token

    // Website ID from your Umami setup
    const websiteId = '165590cb-c361-4ad8-9459-6c6390744c64'
    
    // Get overall website stats with required parameters
    const endAt = Date.now()
    const startAt = endAt - (30 * 24 * 60 * 60 * 1000) // Last 30 days
    
    const statsResponse = await fetch(
      `https://umami.tools.ejfox.com/api/websites/${websiteId}/stats?startAt=${startAt}&endAt=${endAt}&unit=day&timezone=America/New_York`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    )

    if (!statsResponse.ok) {
      const errorText = await statsResponse.text()
      console.error('Umami stats API failed:', statsResponse.status, errorText)
      return {
        error: `Failed to fetch stats: ${statsResponse.status}`,
        stats: null
      }
    }

    const statsData = await statsResponse.json()
    
    return {
      stats: statsData,
      websiteId,
      lastUpdated: new Date().toISOString(),
      shareUrl: 'https://umami.tools.ejfox.com/share/dWCg9vByZmweX6qa/ejfox.com'
    }
    
  } catch (error) {
    console.error('Website stats error:', error)
    return {
      error: error.message || 'Failed to fetch website stats',
      stats: null
    }
  }
})