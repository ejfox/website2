import { describe, it, expect } from 'vitest'
import { isHiddenFromListings, isValidPost } from '../postFilters'

/**
 * The bug these exist to prevent:
 *
 * `manifest-lite.json` hoists only `slug, title, date, type, hidden, tags,
 * toc, metadata`. Everything else — `unlisted`, `password`, `passwordHash`,
 * `sealed` — survives ONLY under `metadata`. A filter written as `!p.unlisted`
 * against a manifest entry therefore tests `undefined` forever and silently
 * passes every protected post through. `/api/agent/timeline` shipped that
 * exact filter and would have published title, URL and tags for any unlisted
 * post the moment one existed.
 *
 * So: every flag is asserted at BOTH levels, and a manifest-shaped fixture is
 * used rather than a flat object, because a flat fixture cannot catch this.
 */

const manifestEntry = (metadata: Record<string, unknown>) => ({
  slug: '2026/a-post',
  title: 'A post',
  date: '2020-01-01',
  metadata: { date: '2020-01-01', ...metadata },
})

describe('isHiddenFromListings', () => {
  const flags = [
    'draft',
    'hidden',
    'unlisted',
    'password',
    'passwordHash',
    'sealed',
  ]

  for (const flag of flags) {
    it(`excludes a post with metadata.${flag} (the manifest-lite shape)`, () => {
      expect(isHiddenFromListings(manifestEntry({ [flag]: true }))).toBe(true)
    })

    it(`excludes a post with top-level ${flag}`, () => {
      expect(isHiddenFromListings({ slug: 'x', [flag]: true })).toBe(true)
    })
  }

  it('lets an ordinary post through', () => {
    expect(isHiddenFromListings(manifestEntry({}))).toBe(false)
  })

  it('does not treat an explicit false as set', () => {
    expect(isHiddenFromListings(manifestEntry({ unlisted: false }))).toBe(false)
  })

  it('ignores an embargo — that is isScheduled’s job, and it expires', () => {
    const future = new Date(Date.now() + 864e5).toISOString()
    expect(isHiddenFromListings(manifestEntry({ publishAt: future }))).toBe(
      false
    )
  })
})

describe('isValidPost', () => {
  it('excludes a sealed post from listings', () => {
    expect(isValidPost(manifestEntry({ sealed: true }))).toBe(false)
  })

  it('excludes an unlisted post from listings even though it is reachable', () => {
    // The whole point of `unlisted`: 200 at its own URL, absent from listings.
    expect(isValidPost(manifestEntry({ unlisted: true }))).toBe(false)
  })

  it('includes an ordinary dated post', () => {
    expect(isValidPost(manifestEntry({}))).toBe(true)
  })

  it('still excludes an embargoed post', () => {
    const future = new Date(Date.now() + 864e5).toISOString()
    expect(isValidPost(manifestEntry({ publishAt: future }))).toBe(false)
  })
})
