import { describe, expect, it } from 'vitest'
import { absoluteUrl, feedExcerpt, feedHtml } from '../feedHtml'

const POST = 'https://ejfox.com/blog/2025/some-post'

describe('absoluteUrl', () => {
  it('resolves root-relative, protocol-relative and fragment URLs', () => {
    expect(absoluteUrl('/tag/cooking', POST)).toBe(
      'https://ejfox.com/tag/cooking'
    )
    expect(absoluteUrl('//ej-fox.s3.amazonaws.com/a.png', POST)).toBe(
      'https://ej-fox.s3.amazonaws.com/a.png'
    )
    expect(absoluteUrl('#user-content-fn-1', POST)).toBe(
      `${POST}#user-content-fn-1`
    )
  })

  it('leaves absolute URLs and other schemes alone', () => {
    expect(absoluteUrl('https://example.com/x', POST)).toBe(
      'https://example.com/x'
    )
    expect(absoluteUrl('mailto:ej@ejfox.com', POST)).toBe('mailto:ej@ejfox.com')
  })
})

describe('feedHtml', () => {
  it('absolutizes links and images', () => {
    const out = feedHtml(
      '<p><a href="/blog/2022/joy">x</a><img src="//cdn.test/i.png" alt="i"></p>',
      POST
    )
    expect(out).toContain('href="https://ejfox.com/blog/2022/joy"')
    expect(out).toContain('src="https://cdn.test/i.png"')
  })

  it('points footnote refs at the post, since ids are stripped', () => {
    const out = feedHtml(
      '<sup><a href="#user-content-fn-1" id="user-content-fnref-1">1</a></sup>',
      POST
    )
    expect(out).toContain(`href="${POST}#user-content-fn-1"`)
  })

  it('turns an iframe embed into a link instead of dropping it', () => {
    const out = feedHtml(
      '<iframe src="https://www.youtube.com/embed/trFeqgcHQ6A" title="YouTube video player"></iframe>',
      POST
    )
    expect(out).toBe(
      '<a href="https://www.youtube.com/watch?v=trFeqgcHQ6A">Embedded: https://www.youtube.com/watch?v=trFeqgcHQ6A</a>'
    )
  })

  it('keeps video with controls and no autoplay', () => {
    const out = feedHtml(
      '<video autoplay loop muted src="https://cdn.test/v.mov" poster="/p.jpg"></video>',
      POST
    )
    expect(out).toContain('<video')
    expect(out).toContain('controls')
    expect(out).toContain('poster="https://ejfox.com/p.jpg"')
    expect(out).not.toContain('autoplay')
  })

  it('emits <source> as a void element', () => {
    expect(
      feedHtml('<video><source src="/v.mp4" type="video/mp4"></video>', POST)
    ).toBe(
      '<video controls><source src="https://ejfox.com/v.mp4" type="video/mp4" /></video>'
    )
  })

  it('renders a GIF-in-a-video-tag as an image', () => {
    expect(
      feedHtml('<video autoplay src="https://cdn.test/rec.gif"></video>', POST)
    ).toBe('<img src="https://cdn.test/rec.gif" />')
  })

  it('drops scripts, styles, inline svg and javascript: links', () => {
    const out = feedHtml(
      '<style>p{}</style><script>alert(1)</script><svg><path d="M0"/></svg><a href="javascript:alert(1)">x</a>',
      POST
    )
    expect(out).not.toMatch(/<style|<script|<svg|javascript:|alert/)
  })

  it('drops the non-HTML5 rb tag but keeps its text', () => {
    expect(feedHtml('<ruby><rb>漢</rb><rt>kan</rt></ruby>', POST)).toBe(
      '<ruby>漢<rt>kan</rt></ruby>'
    )
  })
})

describe('feedExcerpt', () => {
  it('strips tags, collapses whitespace and truncates', () => {
    expect(feedExcerpt('<p>a\n\n  <b>b</b></p>')).toBe('a b')
    // never cuts an entity in half
    expect(feedExcerpt('<p>aaaa &amp; b</p>', 6)).toBe('aaaa &amp;…')
    expect(feedExcerpt('<p>1 &lt; 2</p>')).toBe('1 &lt; 2')
    expect(feedExcerpt(`<p>${'x'.repeat(300)}</p>`, 10)).toBe(
      `${'x'.repeat(10)}…`
    )
  })
})
