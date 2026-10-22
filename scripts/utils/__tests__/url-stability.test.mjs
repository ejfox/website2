import { describe, expect, it } from 'vitest'
import {
  buildSlugIndex,
  legacySlugTarget,
} from '../../../server/utils/legacyRedirect'
import { isScheduled } from '../../../utils/postFilters'
import {
  findBareWikilinksToPosts,
  findBrokenUrls,
  goneReason,
  parseEntries,
  publicRoutes,
} from '../url-stability.mjs'

const post = (rel, fm = {}, body = 'Hello') => ({
  rel,
  text: `---\n${Object.entries(fm)
    .map(([k, v]) => `${k}: ${JSON.stringify(v)}`)
    .join('\n')}\n---\n${body}\n`,
})

const opts = (gone = {}) => ({
  gone,
  legacy: { buildSlugIndex, legacySlugTarget },
  isScheduled,
})

const base = parseEntries([
  post('2023/how-i-built-coach-artie.md', { date: '2023-03-21' }),
  post('2022/how-i-use-gpt3.md', { date: '2022-01-01' }),
  post('projects/coach-artie.md', { date: '2023-03-21' }),
])
const wasPublic = (posts) =>
  new Map([...publicRoutes(posts, opts()).keys()].map((r) => [r, 'base']))

describe('URL stability', () => {
  it('passes when nothing changed', () => {
    expect(findBrokenUrls(wasPublic(base), base, opts())).toEqual([])
  })

  it('flags a live post that gets draft: true (the coach-artie bug)', () => {
    const head = parseEntries([
      post('2023/how-i-built-coach-artie.md', {
        date: '2023-03-21',
        draft: true,
      }),
      post('2022/how-i-use-gpt3.md', { date: '2022-01-01' }),
      post('projects/coach-artie.md', { date: '2023-03-21' }),
    ])
    const broken = findBrokenUrls(wasPublic(base), head, opts())
    expect(broken).toHaveLength(1)
    expect(broken[0]).toMatchObject({
      route: '/blog/2023/how-i-built-coach-artie',
      why: 'draft: true',
    })
  })

  it('flags a deleted post, and a hidden one', () => {
    const head = parseEntries([
      post('2022/how-i-use-gpt3.md', { date: '2022-01-01', hidden: true }),
      post('projects/coach-artie.md', { date: '2023-03-21' }),
    ])
    const broken = findBrokenUrls(wasPublic(base), head, opts())
    expect(broken.map((b) => b.why)).toEqual([
      'hidden: true',
      'its source file is gone',
    ])
  })

  it('accepts a move the legacy redirect resolves (same filename, new year)', () => {
    const head = parseEntries([
      post('2024/how-i-built-coach-artie.md', { date: '2023-03-21' }),
      post('2022/how-i-use-gpt3.md', { date: '2022-01-01' }),
      post('projects/coach-artie.md', { date: '2023-03-21' }),
    ])
    expect(findBrokenUrls(wasPublic(base), head, opts())).toEqual([])
  })

  it('accepts /blog/projects/x and /blog/reading/x via their middlewares', () => {
    const required = new Map([['/blog/projects/coach-artie', 'wayback']])
    expect(findBrokenUrls(required, base, opts())).toEqual([])
  })

  it('accepts a route recorded in gone-urls, exact or by prefix', () => {
    const head = parseEntries([post('projects/coach-artie.md')])
    const gone = {
      _doc: 'ignored',
      '/blog/2023/how-i-built-coach-artie': 'retired',
      '/blog/2022/*': 'whole year retired',
    }
    expect(findBrokenUrls(wasPublic(base), head, opts(gone))).toEqual([])
    expect(goneReason('/blog/2022', gone)).toBeNull()
  })

  it('treats a post rescheduled into the future as not public', () => {
    const head = parseEntries([
      post('2023/how-i-built-coach-artie.md', { publishAt: '2999-01-01' }),
      post('2022/how-i-use-gpt3.md', { date: '2022-01-01' }),
      post('projects/coach-artie.md', { date: '2023-03-21' }),
    ])
    expect(findBrokenUrls(wasPublic(base), head, opts())[0].why).toBe(
      'publishAt/date is in the future'
    )
  })
})

describe('bare wikilinks to posts', () => {
  const linking = (body) =>
    parseEntries([
      ...base.map((p) => ({ rel: p.rel, text: p.text })),
      post('2024/x.md', {}, body),
    ])

  it('flags [[slug]] that names a post, with the fix', () => {
    const found = findBareWikilinksToPosts(
      linking('See [[how-i-use-gpt3]] and [[coach-artie|the bot]].'),
      opts()
    )
    expect(found.map((f) => [f.found, f.fix])).toEqual([
      ['[[how-i-use-gpt3]]', '[[blog/2022/how-i-use-gpt3]]'],
      ['[[coach-artie|the bot]]', '[[projects/coach-artie|the bot]]'],
    ])
    expect(found[0].line).toBe(4) // ---, (empty), ---, body
  })

  it('leaves tags, prefixed links, embeds and code alone', () => {
    const found = findBareWikilinksToPosts(
      linking(
        [
          '[[dataviz]] [[blog/2022/how-i-use-gpt3]] ![[how-i-use-gpt3]]',
          '`[[how-i-use-gpt3]]`',
          '```',
          '[[how-i-use-gpt3]]',
          '```',
        ].join('\n')
      ),
      opts()
    )
    expect(found).toEqual([])
  })

  it('ignores a name that only matches a draft', () => {
    const posts = parseEntries([
      post('2023/secret.md', { draft: true }),
      post('2024/x.md', {}, '[[secret]]'),
    ])
    expect(findBareWikilinksToPosts(posts, opts())).toEqual([])
  })
})
