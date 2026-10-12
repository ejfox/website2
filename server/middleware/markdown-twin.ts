/**
 * @file markdown-twin.ts
 * @description /blog/<year>/<slug>.md — a plain Markdown copy of a published
 *   post, so AI tools can quote and cite it accurately. Pages advertise it with
 *   <link rel="alternate" type="text/markdown"> (pages/blog/[...slug].vue).
 *
 *   Reads through /api/posts (slug validation, post-shape check, draft/hidden/
 *   password/scheduled 404s), then gates AGAIN with isMarkdownServable, which
 *   also refuses unlisted and sealed posts and holds in dev too. Every refusal
 *   is the same bare 404, so a .md URL never reveals that a draft exists.
 *
 *   Only acts on /blog/**.md; everything else falls straight through.
 */
import {
  defineEventHandler,
  getRequestURL,
  setResponseHeader,
  setResponseStatus,
} from 'h3'
import {
  SITE_URL,
  isMarkdownServable,
  isMarkdownSlug,
  postToMarkdown,
} from '~/server/utils/markdownTwin'

function notFound(event: Parameters<typeof setResponseStatus>[0]) {
  setResponseStatus(event, 404)
  setResponseHeader(event, 'content-type', 'text/plain; charset=utf-8')
  setResponseHeader(event, 'cache-control', 'no-cache')
  return 'Not found\n'
}

export default defineEventHandler(async (event) => {
  const { pathname } = getRequestURL(event)
  const m = /^\/blog\/(.+)\.md$/.exec(pathname)
  if (!m) return

  let slug: string
  try {
    slug = decodeURIComponent(m[1])
  } catch {
    return notFound(event)
  }
  if (!isMarkdownSlug(slug)) return notFound(event)

  let data: unknown
  try {
    data = await $fetch(`/api/posts/${encodeURI(slug)}`)
  } catch {
    return notFound(event)
  }
  if (!isMarkdownServable(data)) return notFound(event)

  const isProd = process.env.NODE_ENV === 'production'
  setResponseHeader(event, 'content-type', 'text/markdown; charset=utf-8')
  setResponseHeader(
    event,
    'cache-control',
    isProd ? 'max-age=300, s-maxage=600' : 'max-age=0, s-maxage=0'
  )
  setResponseHeader(event, 'access-control-allow-origin', '*')
  setResponseHeader(
    event,
    'link',
    `<${SITE_URL}/blog/${slug}>; rel="canonical"; type="text/html"`
  )
  return postToMarkdown(data as Record<string, any>, slug)
})
