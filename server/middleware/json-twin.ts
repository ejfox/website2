/**
 * @file json-twin.ts
 * @description Give every page a `.json` twin. Append `.json` to ANY page URL
 *   (e.g. /blog/2025/foo.json, /gear.json, /reading/some-book.json) and get a
 *   structured, self-describing data representation of that same content.
 *
 *   It reuses the existing hardened API routes via internal `$fetch`, so
 *   draft/hidden/unlisted/password filtering is inherited for free. Response is
 *   wrapped in a consistent envelope: { kind, url, generator, data, _links }.
 *
 *   Runs as the first (and currently only) server middleware. It only ever acts
 *   on requests whose path ends in `.json` and is NOT already a real endpoint;
 *   everything else falls straight through untouched.
 */
import { defineEventHandler, getRequestURL, setResponseHeader } from 'h3'

// Literal `.json` URLs that already have their own handlers — never intercept.
const RESERVED = new Set([
  '/feed.json',
  '/tags.json',
  '/manifest.json',
  '/site.webmanifest',
])

// Path prefixes that are never page routes (assets, api, build output, etc).
const SKIP_PREFIXES = ['/api/', '/_', '/.well-known/', '/__']

interface Twin {
  kind: string
  data: unknown
  links?: Record<string, string>
}

export default defineEventHandler(async (event) => {
  const url = getRequestURL(event)
  const pathname = url.pathname

  // Fast bail: not a `.json` request, or a reserved/asset path.
  if (!pathname.endsWith('.json')) return
  if (RESERVED.has(pathname)) return
  if (SKIP_PREFIXES.some((p) => pathname.startsWith(p))) return
  if (pathname.includes('/_nuxt/')) return

  // The page path this `.json` mirrors: /blog/foo.json -> /blog/foo, /.json -> /
  const pagePath = pathname.replace(/\.json$/, '') || '/'

  const config = useRuntimeConfig()
  const siteUrl =
    (config.public?.siteUrl as string)?.replace(/\/$/, '') || 'https://ejfox.com'

  let twin: Twin | null = null
  try {
    twin = await resolveTwin(pagePath)
  } catch (err: any) {
    // A 404 from an internal endpoint means "no such page" — surface it as JSON
    // rather than letting it fall through to the SPA 404 HTML.
    const status = err?.statusCode || err?.status || 500
    setResponseHeader(event, 'content-type', 'application/json; charset=utf-8')
    setResponseHeader(event, 'x-json-twin', 'error')
    event.node.res.statusCode = status === 404 ? 404 : 502
    return {
      kind: 'error',
      url: `${siteUrl}${pagePath}`,
      json_url: `${siteUrl}${pathname}`,
      error: status === 404 ? 'not_found' : 'upstream_error',
      message:
        status === 404
          ? `No page found at ${pagePath}`
          : 'Failed to build JSON representation',
      generator: 'ejfox.com/json-twin@1',
    }
  }

  // We own EVERY `.json` path: if nothing matched, return a clean JSON 404
  // rather than falling through to the SPA's HTML/stack-trace 404.
  if (!twin) {
    setResponseHeader(event, 'content-type', 'application/json; charset=utf-8')
    setResponseHeader(event, 'x-json-twin', 'not_found')
    event.node.res.statusCode = 404
    return {
      kind: 'error',
      url: `${siteUrl}${pagePath}`,
      json_url: `${siteUrl}${pathname}`,
      error: 'not_found',
      message: `No JSON twin for ${pagePath}`,
      generator: 'ejfox.com/json-twin@1',
    }
  }

  const isProd = process.env.NODE_ENV === 'production'
  setResponseHeader(event, 'content-type', 'application/json; charset=utf-8')
  setResponseHeader(
    event,
    'cache-control',
    isProd ? 'max-age=300, s-maxage=600' : 'max-age=0, s-maxage=0'
  )
  setResponseHeader(event, 'x-json-twin', twin.kind)
  setResponseHeader(event, 'access-control-allow-origin', '*')
  // Advertise the canonical HTML page as the alternate.
  setResponseHeader(
    event,
    'link',
    `<${siteUrl}${pagePath}>; rel="canonical"; type="text/html"`
  )

  return {
    $schema: `${siteUrl}/schema/page-twin@1.json`,
    kind: twin.kind,
    url: `${siteUrl}${pagePath}`,
    json_url: `${siteUrl}${pathname}`,
    generator: 'ejfox.com/json-twin@1',
    data: twin.data,
    _links: {
      self: `${siteUrl}${pathname}`,
      html: `${siteUrl}${pagePath}`,
      ...(twin.links || {}),
    },
  }
})

/**
 * Map a page path to the structured data behind it, reusing the same API routes
 * the live page consumes. Returns null when we don't own the path.
 */
async function resolveTwin(pagePath: string): Promise<Twin | null> {
  // Normalise: strip trailing slash (except root), split into segments.
  const clean = pagePath !== '/' ? pagePath.replace(/\/$/, '') : '/'
  const segs = clean === '/' ? [] : clean.slice(1).split('/')
  const [head, ...rest] = segs
  const restPath = rest.join('/')

  switch (head) {
    // ── Home ────────────────────────────────────────────────────────────────
    case undefined: {
      const manifest = (await $fetch('/api/manifest')) as any[]
      return {
        kind: 'site_index',
        data: {
          title: 'EJ Fox',
          description:
            'Hacker-journalist using code and art to uncover hidden patterns.',
          counts: { published: manifest.length },
          sections: [
            'blog',
            'projects',
            'reading',
            'gear',
            'predictions',
            'scraps',
            'photos',
          ],
        },
        links: {
          blog: '/blog.json',
          projects: '/projects.json',
          reading: '/reading.json',
          gear: '/gear.json',
          feed: '/feed.json',
        },
      }
    }

    // ── Blog ──────────────────────────────────────────────────────────────────
    case 'blog': {
      if (rest.length === 0) {
        const manifest = (await $fetch('/api/manifest')) as any[]
        const posts = manifest.filter(
          (p) => (p.type || p.metadata?.type) !== 'project'
        )
        return {
          kind: 'blog_index',
          data: { count: posts.length, posts },
          links: { feed: '/feed.json', tags: '/tags.json' },
        }
      }
      if (rest[0] === 'tag') {
        const tag = rest.slice(1).join('/')
        const manifest = (await $fetch('/api/manifest')) as any[]
        const posts = manifest.filter((p) =>
          (p.tags || p.metadata?.tags || []).includes(tag)
        )
        return {
          kind: 'blog_tag',
          data: { tag, count: posts.length, posts },
          links: { tag_page: `/tag/${tag}.json` },
        }
      }
      // Single post — mirror pages/blog/[...slug].vue's $fetch('/api/posts/'+slug)
      const post = await $fetch(`/api/posts/${restPath}`)
      return {
        kind: 'blog_post',
        data: post,
        links: { index: '/blog.json' },
      }
    }

    // ── Projects ──────────────────────────────────────────────────────────────
    case 'projects': {
      if (rest.length === 0) {
        const projects = await $fetch('/api/projects')
        return { kind: 'project_index', data: projects }
      }
      const project = await $fetch(`/api/posts/projects/${restPath}`)
      return {
        kind: 'project',
        data: project,
        links: { index: '/projects.json' },
      }
    }

    // ── Reading ───────────────────────────────────────────────────────────────
    case 'reading': {
      if (rest.length === 0) {
        const reading = await $fetch('/api/reading')
        return { kind: 'reading_index', data: reading }
      }
      const book = await $fetch(`/api/reading/${restPath}`)
      return { kind: 'reading_item', data: book, links: { index: '/reading.json' } }
    }

    // ── Gear ──────────────────────────────────────────────────────────────────
    case 'gear': {
      if (rest.length === 0) {
        const gear = await $fetch('/api/gear-csv').catch(() => $fetch('/api/gear'))
        return { kind: 'gear_index', data: gear }
      }
      const item = await $fetch(`/api/gear/${restPath}`)
      return { kind: 'gear_item', data: item, links: { index: '/gear.json' } }
    }

    // ── Predictions ───────────────────────────────────────────────────────────
    case 'predictions': {
      if (rest.length === 0) {
        const predictions = await $fetch('/api/predictions')
        return { kind: 'prediction_index', data: predictions }
      }
      const prediction = await $fetch(`/api/predictions/${restPath}`)
      return {
        kind: 'prediction',
        data: prediction,
        links: { index: '/predictions.json' },
      }
    }

    // ── Scraps ────────────────────────────────────────────────────────────────
    case 'scraps': {
      const scraps = await $fetch('/api/scraps')
      return { kind: 'scrap_index', data: scraps }
    }

    // ── Photos ────────────────────────────────────────────────────────────────
    case 'photos': {
      if (rest.length === 0) {
        const photos = await $fetch('/api/photos')
        return { kind: 'photo_index', data: photos }
      }
      // Single photo: pair the photo-post record with its EXIF, mirroring
      // pages/photos/[...id].vue.
      const id = restPath
      const [posts, exif] = await Promise.all([
        $fetch('/api/photo-posts').catch(() => []),
        $fetch(`/api/photo-exif?id=${encodeURIComponent(id)}`).catch(() => null),
      ])
      const photo = Array.isArray(posts)
        ? posts.find((p: any) => String(p.id) === id || p.slug === id)
        : null
      return {
        kind: 'photo',
        data: { id, photo, exif },
        links: { index: '/photos.json' },
      }
    }

    // ── GitHub activity ───────────────────────────────────────────────────────
    case 'github': {
      const gh = await $fetch('/api/github')
      return { kind: 'github', data: gh, links: { gists: '/gists.json' } }
    }
    case 'gists': {
      const gists = await $fetch('/api/gists')
      return { kind: 'gist_index', data: gists, links: { github: '/github.json' } }
    }

    // ── Changelog (site commit history) ───────────────────────────────────────
    case 'changelog': {
      const changelog = await $fetch('/api/changelog')
      return { kind: 'changelog', data: changelog }
    }

    // ── Cross-content tag pages ───────────────────────────────────────────────
    case 'tag': {
      const tag = restPath
      const [manifest, scraps] = await Promise.all([
        $fetch('/api/manifest') as Promise<any[]>,
        $fetch(`/api/scraps/by-tags?tags=${encodeURIComponent(tag)}`).catch(
          () => []
        ),
      ])
      const posts = manifest.filter((p) =>
        (p.tags || p.metadata?.tags || []).includes(tag)
      )
      return {
        kind: 'tag',
        data: { tag, posts, scraps },
        links: { blog_tag: `/blog/tag/${tag}.json` },
      }
    }

    // ── Aggregate dashboard pages (compose several existing APIs) ─────────────
    case 'now': {
      const [stats, reading, predictions] = await Promise.all([
        $fetch('/api/stats').catch(() => null),
        $fetch('/api/reading').catch(() => null),
        $fetch('/api/predictions').catch(() => null),
      ])
      return {
        kind: 'now',
        data: { stats, reading, predictions },
        links: {
          stats: '/stats.json',
          reading: '/reading.json',
          predictions: '/predictions.json',
        },
      }
    }
    case 'stats': {
      const stats = await $fetch('/api/stats')
      return { kind: 'stats', data: stats, links: { lite: '/api/stats-lite' } }
    }

    // ── Fallback: many top-level pages are just posts (e.g. /consulting) ──────
    default: {
      try {
        const post = await $fetch(`/api/posts/${clean.slice(1)}`)
        return { kind: 'page', data: post }
      } catch {
        // Not a post either — we don't own this path; let normal routing 404.
        return null
      }
    }
  }
}
