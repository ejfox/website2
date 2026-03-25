/**
 * @file photo-exif.get.ts
 * @description Fetches EXIF metadata for a single photo from Cloudinary
 * @endpoint GET /api/photo-exif?id=<public_id>
 */
import { v2 as cloudinary } from 'cloudinary'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'ejf',
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export default defineCachedEventHandler(
  async (event) => {
    const query = getQuery(event)
    const id = query.id as string
    if (!id) {
      throw createError({ statusCode: 400, message: 'Missing photo id' })
    }

    try {
      const detail = await cloudinary.api.resource(id, {
        image_metadata: true,
        colors: true,
      })

      const meta = detail.image_metadata || {}
      return {
        camera: meta.Model || null,
        lens: meta.LensModel || null,
        aperture: meta.FNumber || null,
        iso: meta.ISO || null,
        shutter: meta.ExposureTime || null,
        focalLength: meta.FocalLength || null,
        dateTaken: meta.DateTimeOriginal || null,
        colors: detail.colors || [],
      }
    } catch {
      return { camera: null, lens: null, aperture: null, iso: null, shutter: null, focalLength: null, dateTaken: null, colors: [] }
    }
  },
  { maxAge: 86400 } // EXIF doesn't change — cache 24h
)
