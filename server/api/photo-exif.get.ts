/**
 * @file photo-exif.get.ts
 * @description GET /api/photo-exif?id=<cloudinary public_id>. EXIF for one photo:
 *   { camera, lens, aperture, iso, shutter, focalLength, dateTaken, colors }.
 *   Cloudinary Admin API (env CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY,
 *   CLOUDINARY_API_SECRET). Cached 24h. Throws 400 without id; any Cloudinary
 *   error returns the same shape, all null.
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
        // EXIF FocalLength often arrives as "23.0 mm" — strip the unit so the
        // templates (which append "mm") don't render "23.0 mmmm".
        focalLength: meta.FocalLength
          ? String(meta.FocalLength)
              .replace(/\s*mm$/i, '')
              .trim()
          : null,
        dateTaken: meta.DateTimeOriginal || null,
        colors: detail.colors || [],
      }
    } catch {
      return {
        camera: null,
        lens: null,
        aperture: null,
        iso: null,
        shutter: null,
        focalLength: null,
        dateTaken: null,
        colors: [],
      }
    }
  },
  { maxAge: 86400 } // EXIF doesn't change — cache 24h
)
