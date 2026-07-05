/**
 * @file utils/internal-links.mjs
 * @description Internal-link resolution + dead-link detection for the content
 *   pipeline. Owns the canonical wikilink → route logic (shared with
 *   remarkObsidianSupport) AND a build-time validity check against the set of
 *   real, published routes. Internal links cost nothing to verify (no network),
 *   so this runs on every `blog:process` and catches links to missing posts and
 *   excluded drafts — the kind the external CHECK_LINKS pass never sees.
 */

import { promises as fs } from 'node:fs'
import path from 'node:path'
import matter from 'gray-matter'

// ---------------------------------------------------------------------------
// Wikilink / href resolution (canonical — imported by remarkObsidianSupport)
// ---------------------------------------------------------------------------

export function generateSlug(str) {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function encodePath(pathValue) {
  return pathValue
    .split('/')
    .filter(Boolean)
    .map((segment) => encodeURIComponent(segment))
    .join('/')
}

export function normalizeTarget(rawTarget) {
  if (!rawTarget) return ''
  let target = rawTarget.trim().replace(/\\/g, '/')

  if (target.startsWith('/')) target = target.slice(1)
  if (target.endsWith('.md')) target = target.slice(0, -3)

  while (target.startsWith('../')) {
    target = target.slice(3)
  }
  if (target.startsWith('./')) target = target.slice(2)

  target = target.replace(/\/{2,}/g, '/')
  return target
}

export function buildInternalHref(target) {
  const normalized = normalizeTarget(target)
  const lower = normalized.toLowerCase()

  if (lower.startsWith('reading/')) {
    return `/reading/${encodePath(normalized.slice('reading/'.length))}`
  }
  if (lower.startsWith('projects/')) {
    return `/projects/${encodePath(normalized.slice('projects/'.length))}`
  }
  if (lower.startsWith('robots/')) {
    return `/blog/robots/${encodePath(normalized.slice('robots/'.length))}`
  }
  if (lower.startsWith('week-notes/')) {
    return `/blog/week-notes/${encodePath(normalized.slice('week-notes/'.length))}`
  }
  if (lower.startsWith('blog/')) {
    return `/blog/${encodePath(normalized.slice('blog/'.length))}`
  }

  // Bare wikilinks (no folder prefix, no slash) are topic/tag references,
  // not file paths. Route to the tag page instead of a non-existent /blog/Name.
  if (!normalized.includes('/')) {
    return `/tag/${generateSlug(normalized)}`
  }

  return `/blog/${encodePath(normalized)}`
}

// ---------------------------------------------------------------------------
// Validity: the set of routes that actually resolve to published content
// ---------------------------------------------------------------------------

const validRoutes = new Set()

/** Canonical key for a route: drop hash/query, decode, lowercase, no trailing slash. */
function routeKey(href) {
  let h = String(href).split('#')[0].split('?')[0]
  h = h
    .split('/')
    .map((s) => {
      try {
        return decodeURIComponent(s)
      } catch {
        return s
      }
    })
    .join('/')
  h = h.toLowerCase().replace(/\/+$/, '')
  return h === '' ? '/' : h
}

/** Public route a source file is served at (mirror of the routing in pages/). */
export function fileToRoute(relativePath) {
  const rel = relativePath.replace(/\\/g, '/').replace(/\.md$/, '')
  const lower = rel.toLowerCase()
  if (lower.startsWith('reading/'))
    return `/reading/${rel.slice('reading/'.length)}`
  if (lower.startsWith('projects/'))
    return `/projects/${rel.slice('projects/'.length)}`
  if (lower.startsWith('robots/'))
    return `/blog/robots/${rel.slice('robots/'.length)}`
  if (lower.startsWith('week-notes/')) {
    return `/blog/week-notes/${rel.slice('week-notes/'.length)}`
  }
  return `/blog/${rel}`
}

/**
 * Populate the valid-route set from the source markdown files. A file counts as
 * a real route only if it is published — not a draft/hidden/unlisted post, not
 * under the excluded drafts dir, not a `!`-prefixed system note.
 */
export async function buildValidRoutes(files, contentDir) {
  validRoutes.clear()

  // Listing / index pages that always resolve.
  for (const r of [
    '/',
    '/blog',
    '/reading',
    '/projects',
    '/blog/robots',
    '/blog/week-notes',
  ]) {
    validRoutes.add(routeKey(r))
  }

  for (const file of files) {
    const rel = path.relative(contentDir, file).replace(/\\/g, '/')
    // Files outside the content dir (e.g. the excluded drafts dir) never ship.
    if (rel.startsWith('..')) continue
    const relNoExt = rel.replace(/\.md$/, '')
    if (relNoExt.toLowerCase().startsWith('drafts/')) continue
    if (path.basename(relNoExt).startsWith('!')) continue

    let fm = {}
    try {
      fm = matter(await fs.readFile(file, 'utf8')).data || {}
    } catch {
      continue
    }
    // Mirror server/api/posts/[...slug].ts isProtectedContent: these never serve
    // in production by direct slug, so a link to one is dead for public readers.
    if (
      fm.draft === true ||
      fm.hidden === true ||
      fm.unlisted === true ||
      fm.password ||
      fm.passwordHash
    ) {
      continue
    }

    validRoutes.add(routeKey(fileToRoute(relNoExt)))
  }

  return validRoutes
}

/**
 * Classify an href as it appears in rendered content.
 * Returns { internal, valid }. We only judge the content namespaces we own and
 * fully enumerate (/blog, /reading, /projects). Tag pages and other site routes
 * are dynamic — assumed valid. External/relative links are not internal.
 */
export function classifyInternalHref(href) {
  if (!href || typeof href !== 'string') return { internal: false }
  if (!href.startsWith('/')) return { internal: false }

  const key = routeKey(href)
  const owned =
    key.startsWith('/blog/') ||
    key.startsWith('/reading/') ||
    key.startsWith('/projects/')
  if (!owned) return { internal: true, valid: true }

  // Tag pages are dynamic — any tag renders.
  if (key.startsWith('/blog/tag/')) return { internal: true, valid: true }

  return { internal: true, valid: validRoutes.has(key) }
}

// ---------------------------------------------------------------------------
// Audit pass: scan raw markdown for dead internal links (report-only)
// ---------------------------------------------------------------------------

const WIKILINK_RE = /\[\[([^\]]+)\]\]/g
// [text](target) — the (?<!!) skips images (![alt](src)); optional "title" tail.
const MD_LINK_RE = /(?<!!)\[[^\]]*\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g

/** Strip a wikilink/md target down to its bare path: drop alias (`|`) and heading (`#`). */
function bareTarget(raw) {
  return raw.split('|')[0].split('#')[0].trim()
}

/** Resolve a raw link target (wikilink body or md link href) to an internal href, or null. */
function resolveToInternalHref(rawTarget) {
  const target = bareTarget(rawTarget)
  if (!target) return null

  // Already an absolute internal route.
  if (target.startsWith('/')) return target
  // External / anchors / protocol-relative — not internal.
  if (
    /^[a-z][a-z0-9+.-]*:/i.test(target) ||
    target.startsWith('//') ||
    target.startsWith('#')
  ) {
    return null
  }
  // A relative .md reference behaves like a wikilink target.
  if (target.endsWith('.md')) return buildInternalHref(target)
  return null
}

/** Levenshtein edit distance (bounded by a cheap two-row DP). */
function editDistance(a, b) {
  if (a === b) return 0
  if (!a.length) return b.length
  if (!b.length) return a.length
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i)
  let curr = Array.from({ length: b.length + 1 })
  for (let i = 1; i <= a.length; i++) {
    curr[0] = i
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      curr[j] = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + cost)
    }
    ;[prev, curr] = [curr, prev]
  }
  return prev[b.length]
}

/**
 * Best "did you mean?" for a dead href — but only when the guess is trustworthy.
 * A wrong suggestion is worse than none, so we offer one in exactly two cases:
 *
 *   1. Wrong folder: a published route has the *identical* final slug somewhere
 *      else (e.g. `[[project-notes/electology]]` → `/projects/electology`).
 *   2. Same-folder typo: a sibling route differs by a tiny edit distance
 *      (e.g. `2022-prototyping-tookit` → `.../2022-prototyping-toolkit`).
 *
 * Never suggests the linking post itself. Returns null otherwise.
 */
export function suggestRoute(href, sourceRoute = null) {
  const key = routeKey(href)
  const selfKey = sourceRoute ? routeKey(sourceRoute) : null
  const lastSeg = key.split('/').pop()
  const parent = key.slice(0, key.length - lastSeg.length) // keeps trailing '/'

  // Case 1: exact slug published under a different path.
  const exact = []
  for (const candidate of validRoutes) {
    if (candidate === key || candidate === selfKey) continue
    if (candidate.split('/').pop() === lastSeg) exact.push(candidate)
  }
  if (exact.length === 1) return exact[0]
  if (exact.length > 1) {
    // Several matches — pick the closest whole-path, but only if unambiguous.
    exact.sort((a, b) => editDistance(key, a) - editDistance(key, b))
    if (editDistance(key, exact[0]) < editDistance(key, exact[1]))
      return exact[0]
    return null
  }

  // Case 2: a near-typo sibling in the same folder.
  let best = null
  let bestDist = Infinity
  for (const candidate of validRoutes) {
    if (candidate === key || candidate === selfKey) continue
    if (!candidate.startsWith(parent)) continue
    if (candidate.slice(parent.length).includes('/')) continue // direct sibling only
    const d = editDistance(lastSeg, candidate.split('/').pop())
    if (d < bestDist) {
      bestDist = d
      best = candidate
    }
  }
  // Tight budget: a real typo, not a different post entirely.
  const budget = Math.min(3, Math.floor(lastSeg.length / 4))
  return best !== null && bestDist <= budget && bestDist > 0 ? best : null
}

/** 1-based line number of a character offset within text. */
function lineAt(text, offset) {
  let line = 1
  for (let i = 0; i < offset && i < text.length; i++) {
    if (text[i] === '\n') line++
  }
  return line
}

/**
 * Scan every source file for internal links and check each against the valid
 * route set. Returns a structured report with line numbers and "did you mean?"
 * suggestions. Pure local IO — safe to run always.
 */
export async function auditInternalLinks(files, contentDir) {
  const dead = []
  let totalInternal = 0

  for (const file of files) {
    const rel = path.relative(contentDir, file).replace(/\\/g, '/')
    if (rel.startsWith('..')) continue // skip excluded drafts dir

    let raw
    try {
      raw = await fs.readFile(file, 'utf8')
    } catch {
      continue
    }
    // Offset of the body within the raw file, so line numbers map to the
    // on-disk file (frontmatter included), not the stripped body.
    const body = matter(raw).content
    const bodyOffset = raw.length - body.length
    const sourceRoute = fileToRoute(rel.replace(/\.md$/, ''))

    const candidates = []
    let m
    WIKILINK_RE.lastIndex = 0
    while ((m = WIKILINK_RE.exec(body)) !== null) {
      candidates.push({
        raw: m[1],
        href: buildInternalHref(bareTarget(m[1])),
        index: m.index,
      })
    }
    MD_LINK_RE.lastIndex = 0
    while ((m = MD_LINK_RE.exec(body)) !== null) {
      const href = resolveToInternalHref(m[1])
      if (href) candidates.push({ raw: m[1], href, index: m.index })
    }

    const seen = new Set()
    for (const c of candidates) {
      const { internal, valid } = classifyInternalHref(c.href)
      if (!internal) continue
      totalInternal++
      if (valid) continue
      if (seen.has(c.href)) continue
      seen.add(c.href)
      dead.push({
        source: rel,
        line: lineAt(raw, bodyOffset + c.index),
        target: bareTarget(c.raw),
        href: c.href,
        suggestion: suggestRoute(c.href, sourceRoute),
      })
    }
  }

  dead.sort((a, b) => a.source.localeCompare(b.source) || a.line - b.line)

  return {
    timestamp: new Date().toISOString(),
    summary: {
      filesScanned: files.length,
      internalLinks: totalInternal,
      dead: dead.length,
      affectedPosts: new Set(dead.map((d) => d.source)).size,
      withSuggestion: dead.filter((d) => d.suggestion).length,
    },
    dead,
  }
}
