import { describe, expect, it } from 'vitest'
import {
  cleanTitle,
  isPublicScrap,
  isUsableScrap,
  isSentinel,
  publicTags,
} from '../scrap-schema'

const row = {
  scrap_id: 'pinboard-abc',
  shared: true,
  url: 'https://example.com/a',
  title: 'A real title',
  summary: null,
  tags: ['osint', '!tobuy'],
}

describe('scrap visibility as the public endpoints apply it', () => {
  it('serves a normal shared row and strips control tags', () => {
    expect(isPublicScrap(row)).toBe(true)
    expect(publicTags(row.tags)).toEqual(['osint'])
  })

  it('drops !hide rows, sentinels and unshared rows', () => {
    expect(isPublicScrap({ ...row, tags: ['!hide', 'osint'] })).toBe(false)
    expect(isPublicScrap({ ...row, scrap_id: '__run_lock__' })).toBe(false)
    expect(isSentinel({ scrap_id: 'init-test', source: 'lock' })).toBe(true)
    expect(isPublicScrap({ ...row, shared: false })).toBe(false)
  })

  it('keeps text-only shared scraps eligible for list, graph and detail alike', () => {
    expect(isUsableScrap({ ...row, url: null, title: 'A note' })).toBe(true)
    expect(isUsableScrap({ ...row, tags: ['!hide'] })).toBe(false)
  })

  it('cleans AI preambles and placeholders', () => {
    expect(cleanTitle('Summary: A good read')).toBe('A good read')
    expect(cleanTitle('[no title]')).toBe('')
    expect(cleanTitle('-5°C forecast')).toBe('-5°C forecast')
  })
})
