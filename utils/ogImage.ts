/**
 * @file ogImage.ts
 * @description og:image URL + the dimensions we can honestly declare for it.
 * Used by composables/usePageSeo.ts.
 *
 * Scrapers trust og:image:width/height. Project pages used to declare
 * 1200x630 for Cloudinary `c_scale,w_1280` originals that were really
 * 1280x1201 or 1280x1280 (and served as WebP via f_auto). Cloudinary images
 * now get a real 1200x630 `c_fill,g_auto` JPEG crop; the site default
 * (/og-image.png) is 1200x630 already; anything else gets no declared size.
 */

export const OG_TRANSFORM = 'c_fill,g_auto,w_1200,h_630,f_jpg,q_auto'

const CLOUDINARY_UPLOAD =
  /^(https?:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload\/)(.+)$/

// A transformation segment is one or more comma-separated `xx_value` params,
// e.g. `c_scale,f_auto,q_auto:good,w_1280`. Version (`v123`) and public-id
// segments (folders, filenames with dots, hyphenated names) don't match.
function isTransformSegment(seg: string): boolean {
  return seg
    .split(',')
    .every((part) => /^[a-z]{1,3}_[^/]+$/.test(part) && !part.includes('.'))
}

/** Rewrite a Cloudinary delivery URL to a 1200x630 og crop; null if not Cloudinary. */
export function cloudinaryOgUrl(url: string): string | null {
  const m = url.match(CLOUDINARY_UPLOAD)
  if (!m) return null
  const segments = m[2].split('/')
  while (segments.length > 1 && isTransformSegment(segments[0])) {
    segments.shift()
  }
  return `${m[1].replace(/^http:/, 'https:')}${OG_TRANSFORM}/${segments.join('/')}`
}

export function ogImageFor(
  image: string | undefined | null,
  fallback: string
): { url: string; width?: string; height?: string } {
  if (!image || image === fallback || image.endsWith('/og-image.png')) {
    return { url: image || fallback, width: '1200', height: '630' }
  }
  const crop = cloudinaryOgUrl(image)
  if (crop) return { url: crop, width: '1200', height: '630' }
  return { url: image }
}
