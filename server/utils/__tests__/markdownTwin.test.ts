/**
 * The .md copy of a post is for machines to ingest, so the gate is the whole
 * feature: every non-public post must 404, and a public one must carry only
 * the whitelisted frontmatter. Drives the real middleware through h3 with
 * $fetch stubbed to serve fixture JSON.
 */
import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest'
import { createApp, eventHandler, toWebHandler } from 'h3'
import matter from 'gray-matter'
import markdownTwin from '~/server/middleware/markdown-twin'
import {
  MARKDOWN_FRONTMATTER_KEYS,
  isMarkdownServable,
  isMarkdownSlug,
} from '~/server/utils/markdownTwin'

const FUTURE = '2999-01-01T00:00:00Z'
const html = '<p>Body with a <a href="/blog/2024/other" class="x">link</a>.</p>'

const published = {
  title: 'A: published post',
  html: `${html}<pre data-language="js"><code data-language="js"><span>const a = 1</span></code></pre>`,
  metadata: {
    date: '2024-05-01T12:00:00Z',
    tags: ['dataviz', '!featured'],
    dek: 'a dek',
    sourcePath: '/Users/someone/vault/post.md',
    words: 42,
    publishAt: '2024-05-01T12:00:00Z',
  },
  sourceHash: 'abc',
  cacheVersion: 3,
}

const FIXTURES: Record<string, unknown> = {
  '2024/published': published,
  // Public JSON, but not a dated blog post — no markdown copy.
  'robots/some-bot': published,
  '2024/draft': {
    ...published,
    metadata: { ...published.metadata, draft: true },
  },
  '2024/draft-top': { ...published, draft: true },
  '2024/hidden': {
    ...published,
    metadata: { ...published.metadata, hidden: true },
  },
  '2024/unlisted': {
    ...published,
    metadata: { ...published.metadata, unlisted: true },
  },
  '2024/password': {
    ...published,
    metadata: { ...published.metadata, password: 'x' },
  },
  '2024/password-hash': {
    ...published,
    metadata: { ...published.metadata, passwordHash: 'h' },
  },
  '2024/scheduled': {
    ...published,
    metadata: { ...published.metadata, publishAt: FUTURE },
  },
  '2024/future-date': {
    ...published,
    metadata: { ...published.metadata, publishAt: undefined, date: FUTURE },
  },
  'private/sealed': {
    slug: 'private/sealed',
    sealed: true,
    envelope: { v: 1, iv: 'i', ct: 'c' },
  },
  // A sealed envelope that somehow sat outside private/ must still 404.
  '2024/sealed-elsewhere': {
    slug: '2024/sealed-elsewhere',
    sealed: true,
    envelope: { v: 1, iv: 'i', ct: 'c' },
  },
}

const fetchStub = vi.fn(async (url: string) => {
  const slug = decodeURI(url.replace(/^\/api\/posts\//, ''))
  if (slug in FIXTURES) return FIXTURES[slug]
  throw Object.assign(new Error('Post not found'), { statusCode: 404 })
})

let handle: (req: Request) => Promise<Response>
beforeAll(() => {
  vi.stubGlobal('$fetch', fetchStub)
  const app = createApp()
  app.use(markdownTwin)
  app.use(eventHandler(() => 'fell through'))
  handle = toWebHandler(app)
})
afterAll(() => vi.unstubAllGlobals())

const get = (path: string) => handle(new Request(`http://localhost${path}`))

describe('/blog/**.md — gate', () => {
  const blocked = [
    ['draft (metadata)', '/blog/2024/draft.md'],
    ['draft (top level)', '/blog/2024/draft-top.md'],
    ['hidden', '/blog/2024/hidden.md'],
    ['unlisted', '/blog/2024/unlisted.md'],
    ['password', '/blog/2024/password.md'],
    ['passwordHash', '/blog/2024/password-hash.md'],
    ['scheduled (future publishAt)', '/blog/2024/scheduled.md'],
    ['scheduled (future date)', '/blog/2024/future-date.md'],
    ['sealed slug', '/blog/private/sealed.md'],
    ['sealed envelope outside private/', '/blog/2024/sealed-elsewhere.md'],
    ['missing post', '/blog/2024/nope.md'],
    ['path traversal', '/blog/2024/..%2F..%2Fmanifest-lite.md'],
    ['non-dated path (robots)', '/blog/robots/some-bot.md'],
  ]
  for (const [name, path] of blocked) {
    it(`404s a ${name}`, async () => {
      const res = await get(path)
      expect(res.status).toBe(404)
      const body = await res.text()
      expect(body).not.toContain('published post')
      expect(body).not.toContain('Body with')
    })
  }

  it('never even fetches a private/ slug', async () => {
    fetchStub.mockClear()
    await get('/blog/private/sealed.md')
    expect(fetchStub).not.toHaveBeenCalled()
  })

  it('leaves non-.md requests alone', async () => {
    expect(await (await get('/blog/2024/published')).text()).toBe(
      'fell through'
    )
    expect(await (await get('/notes/2024/published.md')).text()).toBe(
      'fell through'
    )
  })
})

describe('/blog/**.md — published post', () => {
  it('serves 200 text/markdown with only whitelisted frontmatter', async () => {
    const res = await get('/blog/2024/published.md')
    expect(res.status).toBe(200)
    expect(res.headers.get('content-type')).toBe('text/markdown; charset=utf-8')
    const body = await res.text()
    const { data: fm, content } = matter(body)
    expect(Object.keys(fm).sort()).toEqual(
      [...MARKDOWN_FRONTMATTER_KEYS].sort()
    )
    expect(fm.title).toBe('A: published post')
    expect(fm.tags).toEqual(['dataviz'])
    expect(fm.canonical).toBe('https://ejfox.com/blog/2024/published')
    expect(new Date(fm.date).toISOString()).toBe('2024-05-01T12:00:00.000Z')
    // Nothing from the processed JSON beyond the whitelist and the body.
    for (const leak of [
      'sourcePath',
      '/Users/',
      'a dek',
      'sourceHash',
      'abc',
      'publishAt',
    ]) {
      expect(body).not.toContain(leak)
    }
    // Clean markdown, absolute links, fenced code keeps its language.
    expect(content).not.toMatch(/<[a-z]/i)
    expect(content).toContain('[link](https://ejfox.com/blog/2024/other)')
    expect(content).toContain('```js\nconst a = 1\n```')
  })
})

describe('helpers', () => {
  it('isMarkdownServable requires rendered html', () => {
    expect(isMarkdownServable(published)).toBe(true)
    expect(isMarkdownServable({ ...published, html: '' })).toBe(false)
    expect(isMarkdownServable([published])).toBe(false)
    expect(isMarkdownServable(null)).toBe(false)
  })

  it('isMarkdownSlug rejects private/ and traversal', () => {
    expect(isMarkdownSlug('2024/post')).toBe(true)
    expect(isMarkdownSlug('private')).toBe(false)
    expect(isMarkdownSlug('private/x')).toBe(false)
    expect(isMarkdownSlug('2024/private/x')).toBe(false)
    expect(isMarkdownSlug('../x')).toBe(false)
    expect(isMarkdownSlug('week-notes/2024-01')).toBe(false)
    expect(isMarkdownSlug('robots/some-bot')).toBe(false)
    expect(isMarkdownSlug('projects/x')).toBe(false)
    expect(isMarkdownSlug('2024/nested/x')).toBe(false)
  })
})
