import { describe, expect, it } from 'vitest'
import {
  isListed,
  isListedBlogPost,
  isScheduled,
  isServed,
  publishTime,
  removedVisibilityKeyProblem,
  visibility,
} from '../visibility.mjs'

const NOW = Date.parse('2026-10-31T12:00:00Z')
const PAST = '2026-01-01T00:00:00Z'
const FUTURE = '2027-01-01T00:00:00Z'

// The three shapes callers pass: raw frontmatter, a manifest-lite entry (some
// keys hoisted, the rest in metadata), and processed JSON (all in metadata).
const shapes = {
  frontmatter: (flags) => ({ slug: '2026/x', date: PAST, ...flags }),
  manifest: (flags) => ({
    slug: '2026/x',
    date: PAST,
    draft: flags.draft,
    metadata: { date: PAST, ...flags },
  }),
  processed: (flags) => ({
    html: '<p>x</p>',
    metadata: { date: PAST, ...flags },
  }),
}

describe('visibility(): the five states', () => {
  for (const [shape, make] of Object.entries(shapes)) {
    describe(shape, () => {
      it('public by default', () => {
        expect(visibility(make({}), NOW)).toBe('public')
      })
      it('draft: true → draft', () => {
        expect(visibility(make({ draft: true }), NOW)).toBe('draft')
      })
      it('future publishAt → scheduled', () => {
        expect(visibility(make({ publishAt: FUTURE }), NOW)).toBe('scheduled')
      })
      it('unlisted: true → unlisted', () => {
        expect(visibility(make({ unlisted: true }), NOW)).toBe('unlisted')
      })
    })
  }

  it('sealed by folder or by envelope', () => {
    expect(visibility({ slug: 'private/x', date: PAST }, NOW)).toBe('sealed')
    expect(visibility({ slug: '2026/private/x' }, NOW)).toBe('sealed')
    expect(
      visibility(
        { slug: 'private/x', sealed: true, envelope: { ct: 'c' } },
        NOW
      )
    ).toBe('sealed')
    expect(visibility({ sealed: true }, NOW)).toBe('sealed')
  })

  it('a future date alone schedules a post', () => {
    expect(visibility({ date: FUTURE }, NOW)).toBe('scheduled')
  })

  it('a top-level false never masks a metadata true', () => {
    expect(visibility({ draft: false, metadata: { draft: true } }, NOW)).toBe(
      'draft'
    )
    expect(
      visibility({ unlisted: false, metadata: { unlisted: true } }, NOW)
    ).toBe('unlisted')
  })
})

describe('visibility(): precedence sealed > draft > scheduled > unlisted > public', () => {
  const all = { draft: true, publishAt: FUTURE, unlisted: true }
  const cases = [
    [{ slug: 'private/x', ...all }, 'sealed'],
    [{ slug: '2026/x', ...all }, 'draft'],
    [{ slug: '2026/x', publishAt: FUTURE, unlisted: true }, 'scheduled'],
    [{ slug: '2026/x', unlisted: true }, 'unlisted'],
    [{ slug: '2026/x' }, 'public'],
  ]
  for (const [post, want] of cases) {
    it(`${JSON.stringify(post)} → ${want}`, () => {
      expect(visibility(post, NOW)).toBe(want)
    })
  }

  it('a scheduled unlisted post becomes unlisted (not public) when it lands', () => {
    const post = { publishAt: FUTURE, unlisted: true }
    expect(visibility(post, NOW)).toBe('scheduled')
    expect(visibility(post, Date.parse(FUTURE) + 1)).toBe('unlisted')
  })
})

describe('removed keys are ignored by visibility() and rejected by the build', () => {
  it('visibility() does not read hidden/password/inprogress/type/private', () => {
    for (const legacy of [
      { inprogress: true },
      { type: 'draft' },
      { type: 'private' },
      { metadata: { private: true } },
    ]) {
      expect(visibility(legacy, NOW)).toBe('public')
    }
  })

  it('hidden: is rejected with the migration hint, whatever its value', () => {
    for (const value of [true, false, 'yes']) {
      expect(removedVisibilityKeyProblem({ hidden: value })).toBe(
        'hidden was removed 2026-10-31; use draft: true or unlisted: true'
      )
    }
    expect(removedVisibilityKeyProblem({ draft: true })).toBeNull()
    expect(removedVisibilityKeyProblem(undefined)).toBeNull()
  })
})

describe('helpers', () => {
  it('isListed: public only', () => {
    expect(isListed({}, NOW)).toBe(true)
    for (const flags of [
      { draft: true },
      { unlisted: true },
      { publishAt: FUTURE },
      { slug: 'private/x' },
    ]) {
      expect(isListed(flags, NOW)).toBe(false)
    }
  })

  it('isServed: public + unlisted in prod; dev adds draft + scheduled; never sealed', () => {
    const prod = (p) => isServed(p, { now: NOW })
    const dev = (p) => isServed(p, { now: NOW, dev: true })
    expect(prod({})).toBe(true)
    expect(prod({ unlisted: true })).toBe(true)
    expect(prod({ draft: true })).toBe(false)
    expect(prod({ publishAt: FUTURE })).toBe(false)
    expect(dev({ draft: true })).toBe(true)
    expect(dev({ publishAt: FUTURE })).toBe(true)
    expect(dev({ slug: 'private/x' })).toBe(false)
  })

  it('isListedBlogPost: public and shaped <year>/<slug>', () => {
    expect(isListedBlogPost({ slug: '2026/x' }, NOW)).toBe(true)
    expect(isListedBlogPost({ slug: 'blog/2026/x' }, NOW)).toBe(true)
    expect(isListedBlogPost({ slug: 'projects/x' }, NOW)).toBe(false)
    expect(isListedBlogPost({ slug: '2026/x', unlisted: true }, NOW)).toBe(
      false
    )
  })

  it('publishTime: publishAt wins; an empty one falls through to date', () => {
    expect(publishTime({ date: PAST, publishAt: FUTURE })).toBe(
      Date.parse(FUTURE)
    )
    expect(publishTime({ date: PAST, publishAt: '' })).toBe(Date.parse(PAST))
    expect(publishTime({ metadata: { date: PAST } })).toBe(Date.parse(PAST))
    expect(publishTime({})).toBeNull()
    expect(publishTime({ date: 'not a date' })).toBeNull()
  })

  it('isScheduled: strictly in the future, gray-matter Dates too', () => {
    expect(isScheduled({ date: new Date(FUTURE) }, NOW)).toBe(true)
    expect(isScheduled({ date: new Date(PAST) }, NOW)).toBe(false)
    expect(isScheduled({}, NOW)).toBe(false)
  })
})
