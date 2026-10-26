/**
 * @file vue-body.mjs
 * @description Posts whose prose lives in a Vue page (`body: vue`).
 *
 * `yarn crown` graduates a post: its HTML moves into
 * `pages/blog/<slug>.vue` between two markers, and the `.md` keeps only its
 * frontmatter plus `body: vue`. From then on the Vue file IS the post — EJ
 * writes prose and interactions there directly.
 *
 * The markdown stub keeps the post in the manifest (listings, tags, feeds,
 * scheduling). processMarkdown reads the marked region back out so word
 * counts, the TOC, search and feeds still see the real text, and the
 * internal-link audit scans it like any other post.
 */

import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'

export const BODY_START = '<!-- post-body -->'
export const BODY_END = '<!-- /post-body -->'

/** Repo-relative path of a post's Vue page, e.g. pages/blog/2025/x.vue */
export function vuePagePath(slug, root = process.cwd()) {
  return path.join(root, 'pages', 'blog', ...slug.split('/')) + '.vue'
}

/**
 * The prose between the markers, or null when the page or markers are
 * missing. `offset` is where the region starts in the file (for line numbers).
 */
export function readVueBody(slug, root = process.cwd()) {
  const file = vuePagePath(slug, root)
  if (!existsSync(file)) return null
  const raw = readFileSync(file, 'utf8')
  const start = raw.indexOf(BODY_START)
  const end = raw.indexOf(BODY_END)
  if (start === -1 || end === -1 || end < start) return null
  const offset = start + BODY_START.length
  return { file, raw, html: raw.slice(offset, end), offset }
}

const stripTags = (html) =>
  html
    .replace(/<(script|style)[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&[a-z#0-9]+;/gi, ' ')

/** The same stats processMarkdown computes from markdown, from HTML instead */
export function statsFromHtml(html) {
  const headings = [
    ...html.matchAll(/<h([2-4])[^>]*\sid="([^"]+)"[^>]*>([\s\S]*?)<\/h\1>/gi),
  ]
  const toc = []
  const stack = []
  for (const [, depth, slug, inner] of headings) {
    const item = {
      text: stripTags(inner).replace(/\s+/g, ' ').trim(),
      slug,
      level: `h${depth}`,
      children: [],
    }
    while (stack.length && stack[stack.length - 1].level >= item.level)
      stack.pop()
    if (stack.length) stack[stack.length - 1].children.push(item)
    else toc.push(item)
    stack.push(item)
  }
  const images = (html.match(/<img\b/gi) || []).length
  const cloudinary = (html.match(/<img\s[^>]*res\.cloudinary\.com/gi) || [])
    .length
  return {
    toc,
    stats: {
      words: stripTags(html).trim().split(/\s+/).filter(Boolean).length,
      images,
      imageDetails: { total: images, cloudinary, withDimensions: 0 },
      links: (html.match(/<a\b[^>]*\shref=/gi) || []).length,
      codeBlocks: (html.match(/<pre\b/gi) || []).length,
      headers: headings.reduce((acc, [, depth]) => {
        acc[`h${depth}`] = (acc[`h${depth}`] || 0) + 1
        return acc
      }, {}),
    },
  }
}

/**
 * Make rendered HTML safe to paste into a Vue <template>:
 * - `{{ … }}` in prose or code would be read as an expression; an entity
 *   renders the same.
 * - Nuxt compiles templates with `includeAbsolute`, so a static `srcset` is
 *   split on commas and each piece becomes an import. Cloudinary URLs are full
 *   of commas (`c_scale,f_auto,…`), which broke the build with
 *   `failed to resolve import "f_auto"`. A bound string isn't transformed.
 * - Non-breaking/odd spaces trip eslint's no-irregular-whitespace; an entity
 *   renders the same.
 */
export function toVueTemplateHtml(html) {
  return html
    .replace(/\{\{/g, '&#123;&#123;')
    .replace(/\}\}/g, '&#125;&#125;')
    .replace(
      /\ssrcset="([^"]*)"/g,
      (_, v) => ` :srcset="'${v.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'"`
    )
    .replace(
      /[\u00A0\u2000-\u200B\u202F\u205F\u3000\uFEFF]/g,
      (c) => `&#${c.codePointAt(0)};`
    )
}

/** Undo the template-only bits so feeds and search get plain HTML */
export function fromVueTemplateHtml(html) {
  return html.replace(
    /\s:srcset="'((?:[^'\\]|\\.)*)'"/g,
    (_, v) => ` srcset="${v.replace(/\\(.)/g, '$1')}"`
  )
}
