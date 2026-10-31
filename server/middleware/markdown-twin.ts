/**
 * @file markdown-twin.ts
 * @description /blog/<year>/<slug>.md — a plain Markdown copy of a published
 *   post, so AI tools can quote and cite it accurately. Pages advertise it with
 *   <link rel="alternate" type="text/markdown"> (pages/blog/[...slug].vue).
 *
 *   Reads through /api/posts (slug validation, post-shape check, draft and
 *   scheduled 404s), then gates AGAIN with isMarkdownServable, which also
 *   refuses sealed posts and holds in dev too. Unlisted posts get a copy, like
 *   their HTML page. Every refusal is the same bare 404, so a .md URL never
 *   reveals that a draft exists.
 *
 *   Only acts on /blog/**.md; everything else falls straight through.
 *   Order: fifth in filename order (after legacy-redirect, before
 *   week-notes-gone). Rules + tests: server/utils/markdownTwin.ts,
 *   server/utils/__tests__/markdownTwin.test.ts.
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
import { visibility } from '~/utils/visibility.mjs'

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

  // Through /api/posts, never a direct file read: that route owns slug
  // validation and the visibility 404s, and this file must not re-implement them.
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
  // Same as the HTML page: reachable, never indexed.
  if (visibility(data) === 'unlisted')
    setResponseHeader(event, 'x-robots-tag', 'noindex')
  setResponseHeader(
    event,
    'link',
    `<${SITE_URL}/blog/${slug}>; rel="canonical"; type="text/html"`
  )
  return postToMarkdown(data as Record<string, any>, slug)
})
