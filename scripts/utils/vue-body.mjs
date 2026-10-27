/**
 * @file vue-body.mjs
 * @description Big posts: `content/blog/<slug>.vue` sits next to `<slug>.md`
 * and IS the post's body. The .md keeps only frontmatter. The normal post
 * page renders the .vue instead of the markdown HTML (pages/blog/[...slug].vue).
 *
 * The content pipeline reads the .vue's <template> back out so feeds, search,
 * word counts and the link audit still see the prose. `yarn crown` makes one.
 * Imported by scripts/build/processMarkdown.mjs, scripts/utils/internal-links.mjs
 * and scripts/author/crown.mjs.
 *
 * Gotchas: the .vue ships in the site's JS bundle, so a non-public post with
 * one fails the build (assertVueBodiesArePublic). Its bytes are part of the
 * post's sourceHash, so editing only the .vue still invalidates the cache.
 */

import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import matter from 'gray-matter'

/** content/blog/<slug>.vue */
export function vueBodyPath(slug, root = process.cwd()) {
  return path.join(root, 'content', 'blog', ...slug.split('/')) + '.vue'
}

/**
 * The .vue's <template> contents, or null when there's no .vue.
 * `offset` is where they start in the file (for line numbers).
 */
export function readVueBody(slug, root = process.cwd()) {
  const file = vueBodyPath(slug, root)
  if (!existsSync(file)) return null
  const raw = readFileSync(file, 'utf8')
  const open = raw.match(/<template[^>]*>/)
  const end = raw.lastIndexOf('</template>')
  if (!open || end < open.index) return null
  const offset = open.index + open[0].length
  return { file, raw, html: raw.slice(offset, end), offset }
}

/**
 * The prose ships in the site's JS bundle, so only a public post may have a
 * .vue body. Returns why not, or null when it's fine.
 */
export function vueBodyProblem(slug, frontmatter = {}) {
  if (slug.startsWith('private/')) return 'sealed posts cannot have a .vue body'
  for (const key of [
    'draft',
    'hidden',
    'unlisted',
    'password',
    'passwordHash',
  ]) {
    if (frontmatter[key]) return `${key} posts cannot have a .vue body`
  }
  const live = frontmatter.publishAt || frontmatter.date
  if (live && new Date(live) > new Date()) {
    return `scheduled posts cannot have a .vue body until they're live`
  }
  return null
}

/** Throw if any content/blog/**.vue belongs to a missing or non-public post */
export function assertVueBodiesArePublic(vueFiles, contentDir) {
  for (const file of vueFiles) {
    const slug = path.relative(contentDir, file).replace(/\.vue$/, '')
    const md = file.replace(/\.vue$/, '.md')
    const problem = existsSync(md)
      ? vueBodyProblem(slug, matter(readFileSync(md, 'utf8')).data)
      : `no ${slug}.md next to it`
    if (problem) throw new Error(`content/blog/${slug}.vue: ${problem}`)
  }
}

const stripTags = (html) =>
  html
    .replace(/<(script|style)[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&[a-z#0-9]+;/gi, ' ')

/** Word count and TOC from HTML (processMarkdown gets these from markdown) */
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
    while (stack.length && stack.at(-1).level >= item.level) stack.pop()
    if (stack.length) stack.at(-1).children.push(item)
    else toc.push(item)
    stack.push(item)
  }
  return {
    toc,
    words: stripTags(html).trim().split(/\s+/).filter(Boolean).length,
    images: (html.match(/<img\s/gi) || []).length,
  }
}

/**
 * Rendered HTML → safe in a Vue <template> (used by `yarn crown`):
 * - `{{ }}` would be read as an expression; entities render the same.
 * - Nuxt compiles templates with includeAbsolute, so a static srcset is split
 *   on commas and each piece imported. Cloudinary URLs are full of commas
 *   (`failed to resolve import "f_auto"`). A bound string isn't touched.
 * - Vue drops <style> in templates; <component is="style"> renders one.
 */
export function toVueTemplateHtml(html) {
  return html
    .replace(/\{\{/g, '&#123;&#123;')
    .replace(/\}\}/g, '&#125;&#125;')
    .replace(/\ssrcset="([^"']*)"/g, ` :srcset="'$1'"`)
    .replace(/<style\b/gi, '<component is="style"')
    .replace(/<\/style>/gi, '</component>')
    .replace(
      /[\u00A0\u2000-\u200B\u202F\u205F\u3000\uFEFF]/g,
      (c) => `&#${c.codePointAt(0)};`
    )
}

/** The reverse, for feeds: drop components, unbind srcset, restore <style> */
export function fromVueTemplateHtml(html) {
  return html
    .replace(/<\/?[A-Z][\w.]*(?:\s[^>]*)?>/g, '')
    .replace(/\s:srcset="'([^']*)'"/g, ' srcset="$1"')
    .replace(/<component\s+is="style"/g, '<style')
    .replace(/<\/component\s*>/g, '</style>')
}
