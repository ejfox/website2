/**
 * @file plugins/rehypeOptimizeImages.mjs
 * @description Rehype plugin for raw HTML `<img>` tags written straight into
 *   markdown. Those skip remarkEnhanceImages / formatCloudinaryUrl, so old
 *   posts (the year-in-review series) served full-size Cloudinary originals:
 *   2018-in-review alone was 166 MB of JPEGs. This pass:
 *   - adds `f_auto,q_auto,w_1200,c_limit` to Cloudinary image URLs that carry
 *     no transformation (already-transformed URLs are left exactly as-is)
 *   - adds loading="lazy" decoding="async" to every image except the first
 *     in the post (the likely LCP), never overriding values already set
 * @usage .use(rehypeRaw).use(rehypeOptimizeImages) — must run after rehypeRaw
 */

import { visit } from 'unist-util-visit'

export const CLOUDINARY_DEFAULT_TRANSFORM = 'f_auto,q_auto,w_1200,c_limit'

// A transformation segment is a comma-separated list of `key_value` params
// (`q_auto`, `w_1200`, `fl_progressive:semi`, `c_scale`). A version (`v123`)
// or a folder (`projects`) is not. Ambiguous public IDs like `my_photo.jpg`
// read as a transform, which is the safe direction: we skip them.
const TRANSFORM_PARAM = /^[a-z]{1,4}_[^/]+$/

function isTransformSegment(segment) {
  return segment.split(',').every((part) => TRANSFORM_PARAM.test(part))
}

/**
 * Insert the default transform into an untransformed Cloudinary image URL.
 * Returns the input unchanged for anything else.
 */
export function optimizeCloudinaryUrl(
  src,
  transform = CLOUDINARY_DEFAULT_TRANSFORM
) {
  if (typeof src !== 'string') return src
  const match = src.match(
    /^(https?:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload\/)(.+)$/
  )
  if (!match) return src
  const [, base, rest] = match
  const firstSegment = rest.split('/')[0]
  if (isTransformSegment(firstSegment)) return src
  // Resizing an SVG rasterizes it; leave vectors alone.
  if (/\.svg(?:[?#]|$)/i.test(rest)) return src
  return `${base}${transform}/${rest}`
}

export function rehypeOptimizeImages() {
  return (tree) => {
    let seenFirst = false
    visit(tree, 'element', (node) => {
      if (node.tagName !== 'img') return
      node.properties = node.properties || {}
      const props = node.properties

      props.src = optimizeCloudinaryUrl(props.src)

      const isFirst = !seenFirst
      seenFirst = true
      if (isFirst) return
      if (props.loading == null) props.loading = 'lazy'
      if (props.decoding == null) props.decoding = 'async'
    })
  }
}
