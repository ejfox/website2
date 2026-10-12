import { describe, it, expect } from 'vitest'
import { absolutizeReadmeUrls } from '../readmeUrls'

const REPO = 'https://github.com/ejfox/vulpes-theme-lab'
const fix = (html: string) => absolutizeReadmeUrls(html, REPO)

describe('absolutizeReadmeUrls', () => {
  it('points relative links at the blob view', () => {
    expect(fix('<a href="./QUICKSTART.md">q</a>')).toBe(
      '<a href="https://github.com/ejfox/vulpes-theme-lab/blob/HEAD/QUICKSTART.md">q</a>'
    )
    expect(fix('<a href="samples/zsh-example.sh">z</a>')).toContain(
      '/blob/HEAD/samples/zsh-example.sh"'
    )
  })

  it('treats a leading slash as the repo root, as GitHub does', () => {
    expect(fix('<a href="/i18n/README.fr.md">fr</a>')).toContain(
      'github.com/ejfox/vulpes-theme-lab/blob/HEAD/i18n/README.fr.md"'
    )
  })

  it('sends images to raw.githubusercontent.com', () => {
    expect(fix('<img src="screenshots/1.png" alt="one">')).toBe(
      '<img src="https://raw.githubusercontent.com/ejfox/vulpes-theme-lab/HEAD/screenshots/1.png" alt="one">'
    )
  })

  it('resolves ../ inside the repo', () => {
    expect(fix('<a href="docs/../LICENSE">l</a>')).toContain(
      '/blob/HEAD/LICENSE"'
    )
  })

  it('leaves absolute, anchor and mailto URLs alone', () => {
    const html =
      '<a href="https://d3js.org">d3</a><a href="#install">i</a>' +
      '<a href="mailto:a@b.c">m</a><img src="https://img.shields.io/x.svg">'
    expect(fix(html)).toBe(html)
  })

  it('only touches a/img href and src', () => {
    const html = '<code class="./not-a-link">x</code>'
    expect(fix(html)).toBe(html)
  })

  it('is a no-op without a GitHub repo URL', () => {
    expect(absolutizeReadmeUrls('<a href="x.md">x</a>', '')).toBe(
      '<a href="x.md">x</a>'
    )
  })
})
