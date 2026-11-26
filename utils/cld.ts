/**
 * @file cld.ts
 * @description Cloudinary URL transform helper. Inserts a transform after
 *   /image/upload/ and strips one already baked in, so an image isn't
 *   re-scaled from a downscale. Non-Cloudinary URLs pass through unchanged.
 *   cldTile: subject-aware 3:2 crop, sharpened after the resize (screenshots
 *   go soft otherwise), with Cloudinary picking format (AVIF/WebP) and quality.
 *   cldPlaceholder: the same crop as a blurred ~1KB image to show while
 *   the real one loads.
 */
const withTransform = (src: string, transform: string): string => {
  if (!src) return src
  const url = src.replace(/^http:/, 'https:')
  const marker = '/image/upload/'
  const at = url.indexOf(marker)
  if (at === -1) return url
  const head = url.slice(0, at + marker.length)
  const segs = url.slice(at + marker.length).split('/')
  const isTransform = (s: string) =>
    s.length > 0 && s.split(',').every((t) => /^[a-z]+_/.test(t))
  let i = 0
  while (i < segs.length && isTransform(segs[i])) i++
  return `${head}${transform}/${segs.slice(i).join('/')}`
}

export const cldTile = (src: string, width: number): string =>
  withTransform(
    src,
    `c_fill,ar_3:2,g_auto,w_${width}/e_sharpen:50/q_auto:good,f_auto`
  )

export const cldPlaceholder = (src: string): string =>
  withTransform(src, 'c_fill,ar_3:2,g_auto,w_32/e_blur:400/q_auto:low,f_auto')
