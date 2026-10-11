import { readdirSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import kindleBooks from '~/data/reading-kindle.json'
import { withKindleSync } from '../readingKindle'

const readingDir = join(__dirname, '../../../content/blog/reading')
const slugs = readdirSync(readingDir)
  .filter((f) => f.endsWith('.md'))
  .map((f) => f.replace(/\.md$/, ''))

describe('reading Kindle metadata', () => {
  // A renamed reading note silently loses its cover; catch the orphan here.
  // (A brand-new note with no entry is fine: it renders "No Cover".)
  it('has no entries for reading notes that no longer exist', () => {
    const orphans = Object.keys(kindleBooks).filter((s) => !slugs.includes(s))
    expect(orphans).toEqual([])
  })

  it('merges under metadata["kindle-sync"], letting frontmatter win', () => {
    const slug = slugs[0]
    const book = withKindleSync(
      { metadata: { tags: ['book'], 'kindle-sync': { title: 'Override' } } },
      slug
    )
    const kindle = book.metadata['kindle-sync'] as Record<string, unknown>
    expect(book.metadata.tags).toEqual(['book'])
    expect(kindle.title).toBe('Override')
    expect(kindle.bookImageUrl).toMatch(/^https:\/\/m\.media-amazon\.com\//)
  })

  it('leaves unknown slugs untouched', () => {
    const book = { metadata: { tags: [] } }
    expect(withKindleSync(book, '__proto__')).toEqual({
      metadata: { tags: [] },
    })
  })
})
