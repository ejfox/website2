import { describe, it, expect } from 'vitest'
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkGfm from 'remark-gfm'
import { remarkExtractToc } from '../remarkExtractToc.mjs'

describe('remarkExtractToc', () => {
  function processMarkdown(markdown, options = {}) {
    const processor = unified()
      .use(remarkParse)
      .use(remarkGfm)
      .use(remarkExtractToc, options)

    const ast = processor.parse(markdown)
    const vfile = { data: {} }
    processor.runSync(ast, vfile)

    return vfile.data
  }

  it('extracts single h2 heading', () => {
    const markdown = `## Hello World\n\nSome content`
    const { toc } = processMarkdown(markdown)

    expect(toc).toHaveLength(1)
    expect(toc[0].text).toBe('Hello World')
    expect(toc[0].level).toBe('h2')
    expect(toc[0].slug).toBe('hello-world')
  })

  it('extracts multiple headings with hierarchy', () => {
    const markdown = `
## Section One
Content here
### Subsection
More content
## Section Two
`
    const { toc } = processMarkdown(markdown)

    expect(toc).toHaveLength(2)
    expect(toc[0].text).toBe('Section One')
    expect(toc[0].children).toHaveLength(1)
    expect(toc[0].children[0].text).toBe('Subsection')
    expect(toc[1].text).toBe('Section Two')
    expect(toc[1].children).toHaveLength(0)
  })

  it('skips headings deeper than maxDepth', () => {
    const markdown = `
## H2
### H3
#### H4 (should be skipped)
##### H5 (should be skipped)
`
    const { toc } = processMarkdown(markdown, { maxDepth: 3 })

    expect(toc).toHaveLength(1)
    expect(toc[0].children).toHaveLength(1)
    expect(toc[0].children[0].text).toBe('H3')
  })

  it('extracts text from complex heading content', () => {
    const markdown = `
## Heading with **bold** and _italic_ text
`
    const { toc } = processMarkdown(markdown)

    expect(toc[0].text).toBe('Heading with bold and italic text')
  })

  it('extracts alt text from images in headings', () => {
    const markdown = `
## ![alt text here](image.png) Heading with Image
`
    const { toc } = processMarkdown(markdown)

    // Should include alt text and heading text
    expect(toc[0].text).toContain('alt text here')
  })

  it('handles links in headings', () => {
    const markdown = `
## [Link Text](https://example.com) Heading
`
    const { toc } = processMarkdown(markdown)

    expect(toc[0].text).toContain('Link Text')
    expect(toc[0].text).toContain('Heading')
  })

  it('creates unique slugs for duplicate heading texts', () => {
    const markdown = `
## Same Name
Content
## Same Name
More content
`
    const { toc } = processMarkdown(markdown)

    expect(toc).toHaveLength(2)
    expect(toc[0].slug).toBe('same-name')
    expect(toc[1].slug).toBe('same-name-1')
  })

  it('returns empty toc for markdown with no headings', () => {
    const markdown = `
Just some paragraph content with no headings.
`
    const { toc } = processMarkdown(markdown)

    expect(toc).toHaveLength(0)
  })

  it('identifies first heading', () => {
    const markdown = `
## First Heading
Content
## Second Heading
`
    const { firstHeading } = processMarkdown(markdown)

    expect(firstHeading).toBe('First Heading')
  })

  it('includes h1 in TOC when depth <= maxDepth', () => {
    const markdown = `
# H1 Heading
## H2 Heading
`
    const { toc, firstHeading } = processMarkdown(markdown, { maxDepth: 3 })

    // H1 is the top-level item with H2 as child
    expect(firstHeading).toBe('H1 Heading')
    expect(toc).toHaveLength(1)
    expect(toc[0].text).toBe('H1 Heading')
    expect(toc[0].children).toHaveLength(1)
    expect(toc[0].children[0].text).toBe('H2 Heading')
  })

  it('handles nested structure correctly', () => {
    const markdown = `
## Section A
### Subsection A1
### Subsection A2
## Section B
### Subsection B1
### Subsection B2
`
    const { toc } = processMarkdown(markdown)

    expect(toc).toHaveLength(2)
    expect(toc[0].text).toBe('Section A')
    expect(toc[0].children).toHaveLength(2)
    expect(toc[0].children[0].text).toBe('Subsection A1')
    expect(toc[1].text).toBe('Section B')
    expect(toc[1].children).toHaveLength(2)
    expect(toc[1].children[0].text).toBe('Subsection B1')
  })

  it('handles empty headings gracefully', () => {
    const markdown = `
##
Some content
## Real Heading
`
    const { toc } = processMarkdown(markdown)

    // Empty heading should be skipped
    expect(toc).toHaveLength(1)
    expect(toc[0].text).toBe('Real Heading')
  })
})
