import { describe, expect, it } from 'vitest'
import { decodeEntities } from '../decodeEntities'

describe('decodeEntities', () => {
  it('decodes the WordPress numeric entities from the GeekWire preview', () => {
    expect(
      decodeEntities(
        'Microsoft&#8217;s &#8216;multibillion dollar&#8217; OpenAI investment'
      )
    ).toBe('Microsoft’s ‘multibillion dollar’ OpenAI investment')
  })

  it('decodes hex and named entities', () => {
    expect(decodeEntities('A&#x2014;B &mdash; C &hellip; &quot;x&quot;')).toBe(
      'A—B — C … "x"'
    )
  })

  it('decodes &amp; exactly once', () => {
    expect(decodeEntities('Q&amp;A')).toBe('Q&A')
    expect(decodeEntities('&amp;#8217;')).toBe('&#8217;')
  })

  it('leaves unknown or invalid entities alone', () => {
    expect(decodeEntities('&bogus; &#0; &#xFFFFFFF;')).toBe(
      '&bogus; &#0; &#xFFFFFFF;'
    )
  })
})
