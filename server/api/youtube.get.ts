import { defineEventHandler, createError } from 'h3'

interface YouTubeStats {
  stats: {
    totalVideos: number
    videosThisMonth: number
    totalViews: number
    subscriberCount: number
    monthlyStats: {
      views: number
      comments: number
      likes: number
    }
  }
  latestVideos: Array<{
    id: string
    title: string
    description: string
    publishedAt: string
    thumbnails: {
      default: string
      medium: string
      high: string
    }
    url: string
    stats: {
      views: number
      likes: number
      comments: number
    }
  }>
  lastUpdated: string
}

interface YouTubeError extends Error {
  statusCode?: number
  response?: {
    error?: {
      message: string
      code: number
    }
  }
}

async function fetchChannelStats(token: string, channelId: string) {
  const response = await $fetch<any>(
    'https://www.googleapis.com/youtube/v3/channels',
    {
      params: {
        part: 'statistics',
        id: channelId,
        key: token
      }
    }
  )

  if (!response.items?.length) {
    throw createError({
      statusCode: 404,
      message: 'YouTube channel not found'
    })
  }

  return response.items[0].statistics
}

async function fetchVideoComments(token: string, videoId: string) {
  const response = await $fetch<any>(
    'https://www.googleapis.com/youtube/v3/commentThreads',
    {
      params: {
        part: 'snippet',
        videoId: videoId,
        key: token,
        maxResults: 1 // We only need the total
      }
    }
  )

  return response.pageInfo?.totalResults || 0
}

async function fetchChannelVideos(
  token: string,
  channelId: string,
  maxResults = 50
) {
  const now = new Date()
  const firstDayOfMonth = new Date(
    now.getFullYear(),
    now.getMonth(),
    1
  ).toISOString()

  // First get the channel's uploads playlist ID
  const channelResponse = await $fetch<any>(
    'https://www.googleapis.com/youtube/v3/channels',
    {
      params: {
        part: 'contentDetails',
        id: channelId,
        key: token
      }
    }
  )

  const uploadsPlaylistId =
    channelResponse.items[0]?.contentDetails?.relatedPlaylists?.uploads
  if (!uploadsPlaylistId) {
    throw createError({
      statusCode: 404,
      message: 'YouTube uploads playlist not found'
    })
  }

  // Then get the videos from that playlist
  const videosResponse = await $fetch<any>(
    'https://www.googleapis.com/youtube/v3/playlistItems',
    {
      params: {
        part: 'snippet,contentDetails',
        playlistId: uploadsPlaylistId,
        maxResults,
        key: token
      }
    }
  )

  // Get detailed stats for each video
  const videoIds = videosResponse.items
    .map((item: any) => item.contentDetails.videoId)
    .join(',')
  const videoStatsResponse = await $fetch<any>(
    'https://www.googleapis.com/youtube/v3/videos',
    {
      params: {
        part: 'statistics',
        id: videoIds,
        key: token
      }
    }
  )

  // Get comments for each video (in parallel to avoid blocking)
  const commentPromises = videosResponse.items.map((item: any) =>
    fetchVideoComments(token, item.contentDetails.videoId)
  )
  const results = await Promise.allSettled(commentPromises)
  const commentCounts = results.map((r) =>
    r.status === 'fulfilled' ? r.value : 0
  )

  // Combine video details with their stats
  const videos = videosResponse.items.map((item: any, index: number) => {
    // Check if stats exist for this index
    const stats =
      index < videoStatsResponse.items.length
        ? videoStatsResponse.items[index]?.statistics || {}
        : {}
    const snippet = item.snippet

    return {
      id: item.contentDetails.videoId,
      title: snippet.title,
      description: snippet.description,
      publishedAt: snippet.publishedAt,
      thumbnails: {
        default: snippet.thumbnails.default?.url,
        medium: snippet.thumbnails.medium?.url,
        high: snippet.thumbnails.high?.url
      },
      url: `https://www.youtube.com/watch?v=${item.contentDetails.videoId}`,
      stats: {
        views: Number.parseInt(stats.viewCount || '0', 10),
        likes: Number.parseInt(stats.likeCount || '0', 10),
        comments: commentCounts[index] || 0
      }
    }
  })

  // Calculate monthly stats
  const monthlyVideos = videos.filter(
    (video: any) => video.publishedAt >= firstDayOfMonth
  )

  const monthlyStats = monthlyVideos.reduce(
    (acc: any, video: any) => ({
      views: acc.views + video.stats.views,
      comments: acc.comments + video.stats.comments,
      likes: acc.likes + video.stats.likes
    }),
    { views: 0, comments: 0, likes: 0 }
  )

  return {
    videos,
    videosThisMonth: monthlyVideos.length,
    monthlyStats
  }
}

export default defineEventHandler(async (): Promise<YouTubeStats> => {
  // console.log('🎥 YouTube handler called')
  const config = useRuntimeConfig()
  const token = config.YOUTUBE_API_KEY as string
  const channelId = config.YOUTUBE_CHANNEL_ID as string

  if (!token || !channelId) {
    throw createError({
      statusCode: 500,
      message: 'YouTube API key or channel ID not configured'
    })
  }

  try {
    const results = await Promise.allSettled([
      fetchChannelStats(token, channelId),
      fetchChannelVideos(token, channelId)
    ])

    const channelStats =
      results[0].status === 'fulfilled'
        ? results[0].value
        : { subscribers: 0, views: 0, videoCount: 0 }
    const videoData =
      results[1].status === 'fulfilled'
        ? results[1].value
        : {
            videos: [],
            videosThisMonth: 0,
            monthlyStats: { views: 0, comments: 0, likes: 0 }
          }

    const response: YouTubeStats = {
      stats: {
        totalVideos: Number.parseInt(channelStats.videoCount || '0', 10),
        videosThisMonth: videoData.videosThisMonth,
        totalViews: Number.parseInt(channelStats.viewCount || '0', 10),
        subscriberCount: Number.parseInt(
          channelStats.subscriberCount || '0',
          10
        ),
        monthlyStats: videoData.monthlyStats
      },
      latestVideos: videoData.videos,
      lastUpdated: new Date().toISOString()
    }

    return response
  } catch (error) {
    const youtubeError = error as YouTubeError
    console.error('YouTube API Error:', youtubeError)

    if (youtubeError.response?.error?.code === 403) {
      console.error(`
        ⚠️ YouTube Authentication Failed ⚠️
        
        Your YouTube API key appears to be invalid or has insufficient permissions.
        To generate a new API key:
        
        1. Go to https://console.cloud.google.com
        2. Create a new project or select an existing one
        3. Enable the YouTube Data API v3
        4. Go to Credentials
        5. Create an API key
        6. Update it in your environment variables:
           - Your .env file
           - Your deployment environment
      `)
    }

    throw createError({
      statusCode: youtubeError.statusCode || 500,
      message:
        youtubeError.response?.error?.message ||
        youtubeError.message ||
        'Failed to fetch YouTube data'
    })
  }
})
