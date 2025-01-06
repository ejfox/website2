import { defineEventHandler, createError } from 'h3'
import { format } from 'date-fns'

interface PhotoResponse {
  public_id: string
  secure_url: string
  uploaded_at: string
  width: number
  height: number
  format: string
}

interface ProcessedPhoto {
  id: string
  url: string
  uploaded_at: string
  width: number
  height: number
  format: string
}

interface PhotoStats {
  stats: {
    totalPhotos: number
    photosThisYear: number
    photosThisMonth: number
    averagePerMonth: number
    mostActiveMonth: {
      month: string
      count: number
    }
  }
  photos: ProcessedPhoto[]
  contributions: number[]
  dates: string[]
  currentStreak: number
  longestStreak: number
}

export default defineEventHandler(async (event) => {
  try {
    const response = await fetch('https://ejfox.photos/api/cloudinary', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        numPhotos: 1000,
        filterOutScreenshots: true,
        onlyScreenshots: false,
        onlyPhotoblog: false
      })
    })

    const photos: PhotoResponse[] = await response.json()

    // Process photos into daily contributions
    const photosByDate = new Map<string, number>()
    const today = new Date()
    const yearAgo = new Date()
    yearAgo.setFullYear(today.getFullYear() - 1)

    // Initialize all dates in the last year with 0
    for (let d = new Date(yearAgo); d <= today; d.setDate(d.getDate() + 1)) {
      photosByDate.set(format(d, 'yyyy-MM-dd'), 0)
    }

    // Count photos per day
    photos.forEach((photo) => {
      const date = format(new Date(photo.uploaded_at), 'yyyy-MM-dd')
      if (photosByDate.has(date)) {
        photosByDate.set(date, (photosByDate.get(date) || 0) + 1)
      }
    })

    // Convert to sorted arrays
    const dates = Array.from(photosByDate.keys()).sort()
    const contributions = dates.map((date) => photosByDate.get(date) || 0)

    // Calculate streaks
    let currentStreak = 0
    let longestStreak = 0
    let tempStreak = 0

    // Calculate from most recent to oldest
    for (let i = contributions.length - 1; i >= 0; i--) {
      if (contributions[i] > 0) {
        tempStreak++
        if (i === contributions.length - 1) {
          currentStreak = tempStreak
        }
        longestStreak = Math.max(longestStreak, tempStreak)
      } else {
        tempStreak = 0
      }
    }

    // Calculate monthly stats
    const photosByMonth = new Map<string, number>()
    photos.forEach((photo) => {
      const month = format(new Date(photo.uploaded_at), 'yyyy-MM')
      photosByMonth.set(month, (photosByMonth.get(month) || 0) + 1)
    })

    const mostActiveMonth = Array.from(photosByMonth.entries()).reduce(
      (max, [month, count]) =>
        count > (max.count || 0) ? { month, count } : max,
      { month: '', count: 0 }
    )

    return {
      stats: {
        totalPhotos: photos.length,
        photosThisYear: contributions.reduce((sum, count) => sum + count, 0),
        photosThisMonth: photos.filter(
          (p) =>
            format(new Date(p.uploaded_at), 'yyyy-MM') ===
            format(new Date(), 'yyyy-MM')
        ).length,
        averagePerMonth: Math.round(photos.length / photosByMonth.size),
        mostActiveMonth: {
          month: format(new Date(mostActiveMonth.month), 'MMMM yyyy'),
          count: mostActiveMonth.count
        }
      },
      photos: photos.map((photo) => ({
        id: photo.public_id,
        url: photo.secure_url,
        uploaded_at: photo.uploaded_at,
        width: photo.width,
        height: photo.height,
        format: photo.format
      })),
      contributions,
      dates,
      currentStreak,
      longestStreak
    }
  } catch (error) {
    console.error('Error fetching photos:', error)
    throw createError({
      statusCode: 500,
      message: 'Failed to fetch photos'
    })
  }
})
