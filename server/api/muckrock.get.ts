export default defineEventHandler(async () => {
  const config = useRuntimeConfig()
  const token = config.muckrockToken

  if (!token) {
    return {
      error: 'MUCKROCK_TOKEN not configured',
      open: [],
      completed: []
    }
  }

  try {
    console.log('[Muckrock] Starting API call with token:', token.substring(0, 10) + '...')

    // Fetch requests - filtered to user 15824 (ejfox)
    const url = 'https://www.muckrock.com/api_v2/requests/?user=15824&limit=100'
    const headers = {
      'Authorization': `Token ${token}`
    }

    console.log('[Muckrock] Fetching from:', url)
    const response = await $fetch<any>(url, {
      headers,
      timeout: 15000
    })

    console.log('[Muckrock] Got response with', response.results?.length || 0, 'requests')
    const allRequests = response.results || []

    // Sort by status and date
    const open = allRequests
      .filter((req: any) => req.status !== 'done')
      .sort(
        (a: any, b: any) =>
          new Date(b.datetime_submitted).getTime() -
          new Date(a.datetime_submitted).getTime()
      )

    const completed = allRequests
      .filter((req: any) => req.status === 'done')
      .sort(
        (a: any, b: any) =>
          new Date(b.datetime_done).getTime() -
          new Date(a.datetime_done).getTime()
      )

    console.log('[Muckrock] Returning', open.length, 'open and', completed.length, 'completed')

    return {
      open: open.map((req: any) => ({
        id: req.id,
        slug: req.slug,
        title: req.title,
        agency: req.agency,
        status: req.status,
        filed: req.datetime_submitted,
        updated: req.datetime_updated,
        completed: req.datetime_done,
        url: `https://www.muckrock.com/requests/${req.id}/${req.slug}/`
      })),
      completed: completed.map((req: any) => ({
        id: req.id,
        slug: req.slug,
        title: req.title,
        agency: req.agency,
        status: req.status,
        filed: req.datetime_submitted,
        updated: req.datetime_updated,
        completed: req.datetime_done,
        url: `https://www.muckrock.com/requests/${req.id}/${req.slug}/`
      }))
    }
  } catch (error: any) {
    console.error('[Muckrock API Error]', error.message || error)
    return {
      error: error.message || 'Failed to fetch FOIA requests',
      open: [],
      completed: []
    }
  }
})
