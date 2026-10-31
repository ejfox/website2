import { describe, it, expect } from 'vitest'
import { execSync } from 'node:child_process'
import {
  buildSitemapPostEntries,
  isSitemapEligible,
  sitemapLoc,
} from '../sitemapEntries'
import { cloudinaryOgUrl, ogImageFor } from '../../../utils/ogImage'

const NOW = Date.parse('2026-10-12T12:00:00Z')

// Manifest-shaped fixtures: flags live under `metadata` (see
// utils/visibility.mjs for why a flat fixture isn't enough).
const post = (
  slug: string,
  metadata: Record<string, unknown> = {},
  extra = {}
) => ({
  slug,
  title: slug,
  date: '2024-01-01T00:00:00Z',
  tags: ['shared'],
  metadata: { date: '2024-01-01T00:00:00Z', ...metadata },
  ...extra,
})

const fixtures = [
  post('2024/public-one', {}, { tags: ['shared', 'public-only'] }),
  post('2024/public-two', {}, { tags: ['shared', 'public-only'] }),
  post('2024/a-draft', { draft: true }, { tags: ['draft-only'] }),
  post('2024/another-draft', { draft: true }, { tags: ['draft-only'] }),
  post('private/sealed-one'),
  post('2024/unlisted', { unlisted: true }),
  post('2024/unlisted-top', {}, { unlisted: true }),
  // Future date alone schedules a post.
  post('2027/future', {}, { date: '2027-01-01T00:00:00Z' }),
  // publishAt in the future embargoes even with a past date.
  post('2024/embargoed', { publishAt: '2026-12-01T09:00:00-04:00' }),
  post('index'),
  post('drafts/wip'),
  // Undated reading note with a space and curly quote in the slug.
  { slug: 'reading/Smith-Zen Mind, Beginner’s Mind', tags: [], metadata: {} },
  post('projects/a-project'),
]

describe('sitemap privacy', () => {
  const { entries, tags } = buildSitemapPostEntries(fixtures, { now: NOW })
  const slugs = entries.map((e) => e.slug)

  it('never lists drafts, sealed, unlisted or scheduled posts', () => {
    for (const s of [
      '2024/a-draft',
      '2024/another-draft',
      'private/sealed-one',
      '2024/unlisted',
      '2024/unlisted-top',
      '2027/future',
      '2024/embargoed',
      'index',
      'drafts/wip',
    ]) {
      expect(slugs).not.toContain(s)
    }
    expect(slugs).toContain('2024/public-one')
  })

  it('scheduled posts appear once their time passes', () => {
    const later = Date.parse('2027-02-01T00:00:00Z')
    expect(isSitemapEligible(fixtures[7], later)).toBe(true)
    expect(isSitemapEligible(fixtures[8], later)).toBe(true)
  })

  it('counts tags only from public posts, >= 2 uses', () => {
    expect(tags).toContain('public-only')
    expect(tags).toContain('shared')
    expect(tags).not.toContain('draft-only')
  })

  it('puts reading notes and projects at their canonical paths, encoded', () => {
    const reading = entries.find((e) => e.slug.startsWith('reading/'))!
    expect(reading.path).toBe('/reading/Smith-Zen Mind, Beginner’s Mind')
    const loc = sitemapLoc('https://ejfox.com', reading.path)
    expect(loc).not.toMatch(/\s|’/)
    expect(loc).toBe(
      'https://ejfox.com/reading/Smith-Zen%20Mind,%20Beginner%E2%80%99s%20Mind'
    )
    expect(slugs.some((s) => s.startsWith('blog/reading'))).toBe(false)
    expect(entries.find((e) => e.slug === 'projects/a-project')!.path).toBe(
      '/projects/a-project'
    )
  })
})

describe('og image dimensions', () => {
  it('crops Cloudinary images to a real 1200x630', () => {
    const src =
      'https://res.cloudinary.com/ejf/image/upload/c_scale,f_auto,q_auto:good,w_1280/v1666630395/project-images/cmu_covidcast.png'
    expect(cloudinaryOgUrl(src)).toBe(
      'https://res.cloudinary.com/ejf/image/upload/c_fill,g_auto,w_1200,h_630,f_jpg,q_auto/v1666630395/project-images/cmu_covidcast.png'
    )
    expect(ogImageFor(src, 'https://ejfox.com/og-image.png')).toMatchObject({
      width: '1200',
      height: '630',
    })
  })

  it('does not declare dimensions it cannot know', () => {
    const r = ogImageFor('https://m.media-amazon.com/x.jpg', '/og-image.png')
    expect(r.width).toBeUndefined()
  })
})

describe('JSON-LD guard', () => {
  it('no page renders JSON-LD via `children` (unhead emits it as an attribute)', () => {
    let out: string
    try {
      out = execSync(
        'grep -rn "children: JSON.stringify" pages components layouts app.vue composables',
        { encoding: 'utf8' }
      )
    } catch (e) {
      // grep exits 1 on no match (fine); exit 2 means a bad path — fail loudly.
      const err = e as { status?: number; stdout?: string }
      if (err.status !== 1) throw e
      out = err.stdout || ''
    }
    expect(out).toBe('')
  })
})
