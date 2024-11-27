import { defineEventHandler } from 'h3'

export default defineEventHandler(async (event) => {
  try {
    // Get list of photos with increased limit
    const response = await fetch('https://ejfox.photos/api/cloudinary', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        numPhotos: 1000, // Increased from 64
        filterOutScreenshots: true,
        onlyScreenshots: false,
        onlyPhotoblog: false
      })
    })

    const photos = await response.json()
    console.log(`Fetched ${photos.length} photos`)

    // Just return basic photo data without EXIF
    return photos.map(photo => ({
      id: photo.public_id,
      url: photo.secure_url,
      uploaded_at: photo.uploaded_at,
      width: photo.width,
      height: photo.height,
      format: photo.format
    }))

  } catch (error) {
    console.error('Error fetching photos:', error)
    throw createError({
      statusCode: 500,
      message: 'Failed to fetch photos'
    })
  }
}) 