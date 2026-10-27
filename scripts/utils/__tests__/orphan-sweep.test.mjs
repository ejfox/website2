import { describe, expect, it } from 'vitest'
import {
  findOrphanCandidates,
  isExemptFromOrphanSweep,
  looksLikePostJson,
} from '../orphan-sweep.mjs'

describe('isExemptFromOrphanSweep', () => {
  it.each([
    'manifest-lite.json',
    'manifest.json',
    'goodreads-stats.json',
    'index.json',
    'private/some-sealed-post.json',
    'rides/index.json',
    'rides/atlas.json',
    'rides/2021-09-25-hudson-highlands.json',
  ])('exempts %s', (rel) => {
    expect(isExemptFromOrphanSweep(rel)).toBe(true)
  })

  it.each(['2019/old-post.json', 'projects/gone.json', 'reading/A-B.json'])(
    'does not exempt %s',
    (rel) => {
      expect(isExemptFromOrphanSweep(rel)).toBe(false)
    }
  )
})

describe('findOrphanCandidates', () => {
  it('returns only non-exempt JSON with no source slug', () => {
    const sources = new Set(['2019/kept', 'index', 'reading/A-B'])
    const outputs = [
      '2019/kept.json',
      '2019/gone.json',
      'index.json',
      'manifest-lite.json',
      'goodreads-stats.json',
      'private/sealed.json',
      'rides/atlas.json',
      'reading/A-B.json',
      'reading/C-D.json',
    ]
    expect(findOrphanCandidates(outputs, sources)).toEqual([
      '2019/gone.json',
      'reading/C-D.json',
    ])
  })
})

describe('looksLikePostJson', () => {
  it('accepts a rendered post', () => {
    expect(looksLikePostJson({ html: '<p/>', metadata: {} })).toBe(true)
  })
  it.each([
    null,
    [],
    { books: [] },
    { slug: 'x', sealed: true, envelope: { ct: 'a' }, html: '', metadata: {} },
    { html: '<p/>' },
  ])('rejects %j', (parsed) => {
    expect(looksLikePostJson(parsed)).toBe(false)
  })
})
