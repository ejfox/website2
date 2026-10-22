/**
 * @file utils/url-stability.mjs
 * @description "Once public, a URL keeps resolving." The pure half of
 *   scripts/meta/check-urls.mjs (the CLI does git/fs IO and loads the TS
 *   server helpers; this file only takes entries in and returns findings).
 *
 *   Why it exists: 2023/how-i-built-coach-artie was live for over a year, then
 *   a 2025 restructure set `draft: true` and nothing noticed — CI was green,
 *   inbound links 404'd, and the only trace was pm2 logs. The internal dead-link
 *   audit can't see it (the inbound links were on other sites), so this checks
 *   the URLs themselves:
 *
 *   1. URL stability. Every route that was public before a change (the base
 *      ref's source tree) or ever seen live by the Wayback Machine
 *      (data/published-urls.json) must still resolve after it: a public post, a
 *      redirect that lands on one, or an entry in data/gone-urls.json saying
 *      why it's gone on purpose. Unpublishing is fine — silently is not.
 *
 *   2. Bare wikilinks to posts. `[[how-i-built-coach-artie]]` has no folder,
 *      so it routes to /tag/how-i-built-coach-artie, not the post. The dead-link
 *      audit treats tag links as always valid, so this is flagged here instead.
 */

import path from 'node:path'
import matter from 'gray-matter'
import {
  fileToRoute,
  generateSlug,
  isPublicSource,
  routeKey,
} from './internal-links.mjs'

/**
 * Parse raw source entries ({ rel, text }; rel relative to content/blog, with
 * .md) into posts. Unparseable frontmatter is kept with fm = null: such a file
 * fails processing, so it is never public.
 */
export function parseEntries(entries) {
  return entries
    .filter((e) => e.rel.endsWith('.md'))
    .map(({ rel, text }) => {
      const relNoExt = rel.replace(/\.md$/, '')
      let fm = null
      let body = ''
      try {
        const parsed = matter(text)
        fm = parsed.data || {}
        body = parsed.content
      } catch {
        // fall through with fm = null
      }
      return {
        rel,
        relNoExt,
        text,
        fm,
        body,
        route: routeKey(fileToRoute(relNoExt)),
      }
    })
}

/** Why a post isn't public, for error messages. null when it is. */
export function whyNotPublic(post, { isScheduled, now = Date.now() } = {}) {
  if (!post.fm) return 'frontmatter does not parse'
  if (!isPublicSource(post.relNoExt)) return 'it is under drafts/ or a !note'
  for (const key of ['draft', 'hidden', 'unlisted']) {
    if (post.fm[key] === true) return `${key}: true`
  }
  if (post.fm.password || post.fm.passwordHash)
    return 'it is password-protected'
  if (isScheduled && isScheduled(post.fm, now))
    return 'publishAt/date is in the future'
  return null
}

/** route key → post, for every post that serves publicly. */
export function publicRoutes(posts, opts = {}) {
  const out = new Map()
  for (const p of posts) if (!whyNotPublic(p, opts)) out.set(p.route, p)
  return out
}

/** Does `route` match a data/gone-urls.json key (exact, or a `prefix/*`)? */
export function goneReason(route, gone) {
  for (const [pattern, reason] of Object.entries(gone)) {
    if (pattern.startsWith('_')) continue // _doc etc.
    const key = pattern.endsWith('/*')
      ? routeKey(pattern.slice(0, -2))
      : routeKey(pattern)
    if (pattern.endsWith('/*') ? route.startsWith(key + '/') : route === key)
      return reason
  }
  return null
}

/**
 * Build a resolver over the HEAD tree: route → { ok, via, target? }.
 * `legacy` is { buildSlugIndex, legacySlugTarget } from
 * server/utils/legacyRedirect.ts, so redirects are judged by the same code
 * production runs, not a copy of it.
 */
export function makeResolver(posts, { gone = {}, legacy, ...opts } = {}) {
  const live = publicRoutes(posts, opts)
  // Production builds its slug index from manifest-lite.json, which only holds
  // processed (non-draft) posts. Mirror that: drafts are absent, the rest carry
  // the visibility flags buildSlugIndex filters on.
  const manifest = posts
    .filter((p) => p.fm && isPublicSource(p.relNoExt, { draft: p.fm.draft }))
    .map((p) => ({ ...p.fm, slug: p.relNoExt }))
  const index = legacy?.buildSlugIndex(manifest)

  const landsLive = (target) => live.has(routeKey(target))

  return function resolve(route) {
    if (live.has(route)) return { ok: true, via: 'live' }
    const reason = goneReason(route, gone)
    if (reason) return { ok: true, via: 'gone', reason }

    // server/middleware/blog-projects-redirect.ts and blog-reading-redirect.ts
    const m = /^\/blog\/(projects|reading)\/([^/]+)$/.exec(route)
    if (m && landsLive(`/${m[1]}/${m[2]}`))
      return { ok: true, via: 'redirect', target: `/${m[1]}/${m[2]}` }

    // server/middleware/legacy-redirect.ts
    const target = index && legacy.legacySlugTarget(route, index)
    if (target && landsLive(target))
      return { ok: true, via: 'redirect', target: decodeURIComponent(target) }

    return { ok: false }
  }
}

/**
 * Every required route that no longer resolves.
 * required: Map route → origin label ("public at <ref>" / "wayback <date>").
 */
export function findBrokenUrls(required, headPosts, opts = {}) {
  const resolve = makeResolver(headPosts, opts)
  const byRoute = new Map(headPosts.map((p) => [p.route, p]))
  const broken = []
  for (const [route, origin] of required) {
    if (resolve(route).ok) continue
    const post = byRoute.get(route)
    broken.push({
      route,
      origin,
      source: post ? `content/blog/${post.rel}` : null,
      why: post ? whyNotPublic(post, opts) : 'its source file is gone',
    })
  }
  return broken.sort((a, b) => a.route.localeCompare(b.route))
}

const WIKILINK_RE = /(?<!!)\[\[([^\]]+)\]\]/g

/** Strip fenced and inline code so [[…]] inside examples isn't linted. */
function stripCode(body) {
  return body
    .replace(/^(```|~~~)[^\n]*\n[\s\S]*?^\1[^\n]*$/gm, (b) =>
      b.replace(/[^\n]/g, ' ')
    )
    .replace(/`[^`\n]*`/g, (b) => ' '.repeat(b.length))
}

/** The wikilink target that reaches a post, matching buildInternalHref. */
function wikiTargetFor(post) {
  return /^\d{4}\//.test(post.relNoExt)
    ? `blog/${post.relNoExt}`
    : post.relNoExt
}

/**
 * `[[name]]` (no folder) whose name is a public post's filename. Those render
 * as a /tag/ link, which is never what was meant. Returns findings with the
 * fixed wikilink to use.
 */
export function findBareWikilinksToPosts(posts, opts = {}) {
  const byName = new Map()
  for (const p of publicRoutes(posts, opts).values()) {
    const name = generateSlug(path.basename(p.relNoExt))
    byName.set(name, [...(byName.get(name) ?? []), p])
  }

  const findings = []
  for (const p of posts) {
    if (!p.fm) continue
    const body = stripCode(p.body)
    const offset = p.text ? p.text.length - p.body.length : 0
    let m
    WIKILINK_RE.lastIndex = 0
    while ((m = WIKILINK_RE.exec(body)) !== null) {
      const [target, ...rest] = m[1].split('|')
      const name = target.split('#')[0].trim()
      if (!name || name.includes('/')) continue
      const hits = byName.get(generateSlug(name))
      if (!hits || hits.length !== 1) continue
      const heading = target.includes('#') ? '#' + target.split('#')[1] : ''
      const alias = rest.length ? '|' + rest.join('|') : ''
      findings.push({
        source: `content/blog/${p.rel}`,
        line: p.text
          ? p.text.slice(0, offset + m.index).split('\n').length
          : undefined,
        found: m[0],
        fix: `[[${wikiTargetFor(hits[0])}${heading}${alias}]]`,
      })
    }
  }
  return findings
}
