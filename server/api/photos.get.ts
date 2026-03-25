/**
 * @file photos.get.ts
 * @description Fetches photo-blog tagged photos from Cloudinary
 * @endpoint GET /api/photos
 */
import { v2 as cloudinary } from 'cloudinary'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'ejf',
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export default defineCachedEventHandler(
  async () => {
    try {
      const result = await cloudinary.search
        .expression('resource_type:image AND tags=photo-blog')
        .sort_by('created_at', 'desc')
        .max_results(500)
        .with_field('tags')
        .with_field('context')
        .execute()

      const photos = result.resources.map((r: Record<string, unknown>) => {
        const ctx = r.context as { custom?: Record<string, string> } | undefined
        const tags = (r.tags || []) as string[]
        return {
          id: r.public_id as string,
          url: r.secure_url as string,
          date: r.created_at as string,
          width: r.width as number,
          height: r.height as number,
          format: r.format as string,
          bytes: r.bytes as number,
          aspect: (r.width as number) / (r.height as number),
          tags: tags.filter((t) => t !== 'photo-blog'),
          description: ctx?.custom?.ai_description || ctx?.custom?.caption || null,
        }
      })

      return { photos, total: result.total_count }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      console.error('Cloudinary photos error:', message)
      throw createError({ statusCode: 500, message: 'Failed to fetch photos' })
    }
  },
  { maxAge: 600 }
)
