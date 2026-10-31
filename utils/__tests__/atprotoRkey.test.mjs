import { describe, it, expect } from 'vitest'
import {
  ATPROTO_DID,
  PUBLICATION_URI,
  atprotoDocUri,
  atprotoDocUrl,
  publishedAtFor,
  rkeyFor,
} from '../atprotoRkey.mjs'

const post = { slug: '2024/some-post', date: '2024-03-01T12:00:00Z' }

describe('atprotoDocUri', () => {
  it('returns the at:// URI of an eligible post’s document record', () => {
    const rkey = rkeyFor(post.slug, publishedAtFor(post))
    expect(atprotoDocUri(post)).toBe(
      `at://${ATPROTO_DID}/site.standard.document/${rkey}`
    )
  })

  it('returns null for drafts', () => {
    expect(atprotoDocUri({ ...post, metadata: { draft: true } })).toBeNull()
  })

  it('returns null for scheduled posts', () => {
    expect(atprotoDocUri({ ...post, date: '2099-01-01T00:00:00Z' })).toBeNull()
    expect(
      atprotoDocUri({
        ...post,
        metadata: { publishAt: '2099-01-01T00:00:00Z' },
      })
    ).toBeNull()
  })

  it('backs the pdsls.dev link', () => {
    expect(atprotoDocUrl(post)).toBe(`https://pdsls.dev/${atprotoDocUri(post)}`)
    expect(atprotoDocUrl({ ...post, unlisted: true })).toBeNull()
  })
})

describe('PUBLICATION_URI', () => {
  // frozen: the live publication record and every document's `site` point here
  it('is the publication the mirror writes', () => {
    expect(PUBLICATION_URI).toBe(
      'at://did:plc:5qysguz3v267ggtfitebl5nc/site.standard.publication/3mw2wa5qk2222'
    )
  })
})
