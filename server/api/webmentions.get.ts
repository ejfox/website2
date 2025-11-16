/**
 * /api/webmentions
 *
 * Fetches webmentions from webmention.io for a given URL.
 * Allows others to see who's linking to your content.
 */

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const target = query.target as string
  const token = 'mXIX5Iq-nztH8z2S2xFZag'

  if (!target) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing target URL parameter'
    })
  }

  try {
    const url = `https://webmention.io/api/mentions.jf2?token=${token}&target=${encodeURIComponent(target)}&per-page=100`
    const response = (await $fetch(url)) as any

    // Return just the children array (the actual webmentions)
    return response.children || []
  } catch (error: any) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch webmentions',
      message: error.message
    })
  }
})
