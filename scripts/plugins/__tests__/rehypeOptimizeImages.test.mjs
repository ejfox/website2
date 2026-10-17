import { describe, it, expect } from 'vitest'
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkRehype from 'remark-rehype'
import rehypeRaw from 'rehype-raw'
import rehypeStringify from 'rehype-stringify'
import {
  optimizeCloudinaryUrl,
  rehypeOptimizeImages,
} from '../rehypeOptimizeImages.mjs'

const BASE = 'https://res.cloudinary.com/ejf/image/upload/'

describe('optimizeCloudinaryUrl', () => {
  it('adds the default transform to a versioned original', () => {
    expect(optimizeCloudinaryUrl(`${BASE}v1526532474/DSCF9338.jpg`)).toBe(
      `${BASE}f_auto,q_auto,w_1200,c_limit/v1526532474/DSCF9338.jpg`
    )
  })

  it('adds the transform before a folder path with no version', () => {
    expect(optimizeCloudinaryUrl(`${BASE}projects/foo.jpg`)).toBe(
      `${BASE}f_auto,q_auto,w_1200,c_limit/projects/foo.jpg`
    )
  })

  it('never double-transforms', () => {
    const already = [
      `${BASE}q_auto/v1/a.jpg`,
      `${BASE}f_auto,q_auto,fl_lossy,w_900/v1/a.jpg`,
      `${BASE}fl_progressive:semi,c_scale,dpr_auto,w_1280/v1/a.jpg`,
      `${BASE}f_auto,q_auto,w_1200,c_limit/v1/a.jpg`,
    ]
    for (const url of already) expect(optimizeCloudinaryUrl(url)).toBe(url)
    const once = optimizeCloudinaryUrl(`${BASE}v1/a.jpg`)
    expect(optimizeCloudinaryUrl(once)).toBe(once)
  })

  it('leaves SVGs, videos, other hosts and non-strings alone', () => {
    for (const url of [
      `${BASE}v1/diagram.svg`,
      'https://res.cloudinary.com/ejf/video/upload/v1/clip.mp4',
      'https://example.com/upload/v1/a.jpg',
      '/local/a.jpg',
      undefined,
    ])
      expect(optimizeCloudinaryUrl(url)).toBe(url)
  })
})

describe('rehypeOptimizeImages', () => {
  const run = (html) =>
    String(
      unified()
        // Same order as processMarkdown: raw HTML only becomes hast after rehypeRaw
        .use(remarkParse)
        .use(remarkRehype, { allowDangerousHtml: true })
        .use(rehypeRaw)
        .use(rehypeOptimizeImages)
        .use(rehypeStringify)
        .processSync(html)
    )

  it('rewrites src, keeps alt/class, lazy-loads all but the first image', () => {
    const out = run(
      `<img src="${BASE}v1/one.jpg" alt="First one">` +
        `<p><img src="${BASE}v2/two.png" class="dark:invert" alt="Two"></p>`
    )
    expect(out).toContain(
      `<img src="${BASE}f_auto,q_auto,w_1200,c_limit/v1/one.jpg" alt="First one">`
    )
    expect(out).toContain(
      `src="${BASE}f_auto,q_auto,w_1200,c_limit/v2/two.png" class="dark:invert" alt="Two" loading="lazy" decoding="async"`
    )
  })

  it('does not override loading/decoding already set', () => {
    const out = run(
      `<img src="/a.jpg"><img src="/b.jpg" loading="eager" decoding="sync">`
    )
    expect(out).toContain('<img src="/b.jpg" loading="eager" decoding="sync">')
  })
})
