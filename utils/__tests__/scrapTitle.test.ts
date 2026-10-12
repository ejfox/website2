import { describe, expect, it } from 'vitest'
import { scrapDisplayTitle, scrapHostname } from '../scrapTitle'

describe('scrapDisplayTitle', () => {
  it('keeps a real title', () => {
    expect(scrapDisplayTitle('A post', 'https://x.com/a')).toBe('A post')
  })
  it('treats Pinboard "[no title]" and blanks as missing → hostname', () => {
    expect(scrapDisplayTitle('[no title]', 'https://www.example.com/p')).toBe(
      'example.com'
    )
    expect(scrapDisplayTitle('  ', 'https://example.org')).toBe('example.org')
    expect(scrapDisplayTitle(null, 'https://example.org')).toBe('example.org')
  })
  it('falls back when there is no usable URL', () => {
    expect(scrapDisplayTitle('[no title]', null)).toBe('Untitled scrap')
    expect(scrapDisplayTitle(null, 'not a url', '(untitled)')).toBe(
      '(untitled)'
    )
    expect(scrapHostname(undefined)).toBe('')
  })
})
