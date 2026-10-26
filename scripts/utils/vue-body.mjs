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
  const headings = [...html.matchAll(/<h([2-4])[^>]*\sid="([^"]+)"[^>]*>([\s\S]*?)<\/h\1>/gi)]
  const toc = []
  const stack = []
  for (const [, depth, slug, inner] of headings) {
    const item = {
      text: stripTags(inner).replace(/\s+/g, ' ').trim(),
      slug,
      level: `h${depth}`,
      children: [],
    }
    while (stack.length && stack[stack.length - 1].level >= item.level) stack.pop()
    if (stack.length) stack[stack.length - 1].children.push(item)
    else toc.push(item)
    stack.push(item)
  }
  const images = (html.match(/<img\b/gi) || []).length
  const cloudinary = (html.match(/<img\b[^>]*res\.cloudinary\.com/gi) || []).length
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
 * Make rendered HTML safe to paste into a Vue <template>: Vue would read
 * `{{ … }}` in prose or code as an expression. An entity renders the same.
 */
export function toVueTemplateHtml(html) {
  return html.replace(/\{\{/g, '&#123;&#123;').replace(/\}\}/g, '&#125;&#125;')
}
