/**
 * Legacy redirects must never confirm a non-public post exists, and the
 * Cloudinary branch must never become an open redirect. Everything else is
 * convenience.
 */
import { describe, it, expect } from 'vitest'
import {
  buildSlugIndex,
  cloudinaryFragmentTarget,
  legacySlugTarget,
} from '~/server/utils/legacyRedirect'

const NOW = Date.parse('2026-10-13T12:00:00Z')
const index = buildSlugIndex(
  [
    { slug: '2019/step-zero', date: '2019-01-01' },
    { slug: '2022/how-i-use-gpt3', date: '2022-01-01' },
    { slug: 'projects/connectology', date: '2025-01-01' },
    { slug: 'reading/Roose-Futureproof', date: '2021-01-01' },
    { slug: '2022/the-studio', date: '2022-12-27', hidden: true },
    {
      slug: '2023/secret-ish',
      date: '2023-01-01',
      metadata: { unlisted: true },
    },
    { slug: '2026/not-yet', date: '2026-12-01' },
    { slug: '2020/food', date: '2020-01-01' },
    { slug: '2022/food', date: '2022-01-01' },
  ],
  NOW
)
const go = (p: string) => legacySlugTarget(p, index)

describe('legacySlugTarget', () => {
  it('adds a missing year, fixes a wrong year and a trailing slash', () => {
    expect(go('/blog/step-zero')).toBe('/blog/2019/step-zero')
    expect(go('/blog/step-zero/')).toBe('/blog/2019/step-zero')
    expect(go('/blog/2023/step-zero')).toBe('/blog/2019/step-zero')
  })

  it('fixes case and the wrong folder', () => {
    expect(go('/blog/2019/Step-Zero')).toBe('/blog/2019/step-zero')
    expect(go('/blog/project-notes/connectology')).toBe(
      '/projects/connectology'
    )
    expect(go('/blog/roose-futureproof')).toBe('/reading/Roose-Futureproof')
  })

  it('leaves real posts alone, including with a trailing slash', () => {
    expect(go('/blog/2019/step-zero')).toBeNull()
    expect(go('/blog/2019/step-zero/')).toBeNull()
    expect(go('/projects/connectology')).toBeNull()
  })

  it('never redirects to or reveals a non-public post', () => {
    expect(go('/blog/2022/the-studio')).toBeNull() // hidden, its own URL
    expect(go('/blog/2023/the-studio')).toBeNull() // hidden, wrong year
    expect(go('/blog/the-studio')).toBeNull()
    expect(go('/blog/secret-ish')).toBeNull() // unlisted lives under metadata
    expect(go('/blog/not-yet')).toBeNull() // scheduled
  })

  it('refuses ambiguous matches and does no fuzzy matching', () => {
    expect(go('/blog/food')).toBeNull()
    expect(go('/blog/2019/step-zer')).toBeNull()
  })

  it('ignores twins, asset-looking paths and junk segments', () => {
    expect(go('/blog/2019/step-zero.js')).toBeNull()
    expect(go('/blog/step-zero.md')).toBeNull()
    expect(go('/blog/step-zero.json')).toBeNull()
    expect(go('/blog/2019/null')).toBeNull()
    expect(go('/blog/2019')).toBeNull()
    expect(go('/blog/drafts/step-zero')).toBeNull()
    expect(go('/blog/tag/step-zero')).toBeNull()
    expect(go('/elsewhere/step-zero')).toBeNull()
    expect(go('/blog/%E0%A4%A')).toBeNull() // malformed escape
  })
})

describe('cloudinaryFragmentTarget', () => {
  it('sends a comma-split srcset fragment to the real image', () => {
    expect(
      cloudinaryFragmentTarget(
        '/blog/2024/w_1280/v1722610045/Screenshot_2024-08-02_at_10.47.11_AM.png'
      )
    ).toBe(
      'https://res.cloudinary.com/ejf/image/upload/c_scale,f_auto,q_auto:good,w_1280/v1722610045/Screenshot_2024-08-02_at_10.47.11_AM.png'
    )
    expect(
      cloudinaryFragmentTarget(
        '/blog/w_640/v1733093033/arena/arena-10075114.jpg'
      )
    ).toBe(
      'https://res.cloudinary.com/ejf/image/upload/c_scale,f_auto,q_auto:good,w_640/v1733093033/arena/arena-10075114.jpg'
    )
    expect(
      cloudinaryFragmentTarget('/projects/x/w_960/v1755098311/a.webp')
    ).toMatch(/^https:\/\/res\.cloudinary\.com\/ejf\//)
  })

  it('rejects anything that is not a plain image fragment', () => {
    for (const p of [
      '/blog/2024/w_1280/v1722610045/../../evil.png',
      '/blog/2024/w_1280/v1722610045/a%2F..%2Fb.png',
      '/blog/2024/w_1280/v1722610045/IMG_6795.mov', // video, different resource type
      '/blog/w_5120/ADD924AF.jpeg', // no version: a local Obsidian image
      '/blog/2024/w_1280/v1722610045/@evil.com.png',
      '/blog/2024/w_1280/v1722610045/a.png?x=//evil.com',
      '/other/w_1280/v1722610045/a.png',
      '/blog/2019/step-zero',
    ]) {
      expect(cloudinaryFragmentTarget(p), p).toBeNull()
    }
  })
})
