import { describe, it, expect } from 'vitest'
import { suggestForPath, itemPath } from '../notFoundSuggestions'

const items = [
  { slug: '2025/using-radios', title: 'How To Use Radios' },
  {
    slug: '2025/owning-my-cloudinary-photos',
    title:
      'Panic-Driven Development: Building A Tool To Back Up My Photos From Cloudinary',
  },
  { slug: 'projects/flipper-zero-tools', title: 'Flipper Zero Tools' },
  { slug: 'projects/exif-printer', title: 'EXIF Printer' },
  { slug: 'projects/terminal-tools', title: 'Terminal Tools' },
  { slug: 'projects/subway-builder', title: 'Subway Builder' },
  { slug: '2022/motorcycle-trip', title: 'A Motorcycle Trip Up The Coast' },
  { slug: 'reading/some-book', title: 'Radios: A History' },
]

describe('suggestForPath', () => {
  it('finds the radio post from a typo', () => {
    const s = suggestForPath('/blog/2025/using-radioz', items)
    expect(s[0]?.path).toBe('/blog/2025/using-radios')
  })

  it('suggests the cloudinary post, not unrelated *-tools projects', () => {
    const s = suggestForPath('/projects/cloudinary-backup-tool', items)
    expect(s[0]?.path).toBe('/blog/2025/owning-my-cloudinary-photos')
    expect(s.map((x) => x.path)).not.toContain('/projects/exif-printer')
    expect(s.map((x) => x.path)).not.toContain('/projects/flipper-zero-tools')
  })

  it('sends a dead mods page to the project', () => {
    const s = suggestForPath('/blog/projects/subway-builder-mods', items)
    expect(s[0]?.path).toBe('/projects/subway-builder')
  })

  it('matches title words, not just slug words', () => {
    const s = suggestForPath('/blog/2022/motorcycle-camping', items)
    expect(s[0]?.path).toBe('/blog/2022/motorcycle-trip')
  })

  it('shows nothing without a real match', () => {
    expect(suggestForPath('/asdfqwer', items)).toEqual([])
    expect(suggestForPath('/blog/2024/projects', items)).toEqual([])
  })

  it('caps at 3 and keeps reading notes out of non-reading paths', () => {
    const s = suggestForPath('/radios-radios', items)
    expect(s.length).toBeLessThanOrEqual(3)
    expect(s.map((x) => x.path)).not.toContain('/reading/some-book')
  })
})

describe('itemPath', () => {
  it('routes projects and reading at the root, posts under /blog', () => {
    expect(itemPath('projects/x')).toBe('/projects/x')
    expect(itemPath('reading/x')).toBe('/reading/x')
    expect(itemPath('2025/x')).toBe('/blog/2025/x')
  })
})
