import { describe, it, expect } from 'vitest'
import {
  isFunnelPath,
  deviceAllowsReplay,
  scrollFraction,
} from '../replayPolicy'

describe('isFunnelPath', () => {
  it('matches funnel pages and their subpaths', () => {
    for (const p of [
      '/consulting',
      '/consulting/',
      '/process',
      '/calendar',
      '/ff',
      '/case-study/nbc-big-board',
    ])
      expect(isFunnelPath(p)).toBe(true)
  })
  it('does not match lookalikes or other pages', () => {
    for (const p of [
      '/',
      '/blog',
      '/stats',
      '/processing',
      '/ffmpeg',
      '/case-studyx',
    ])
      expect(isFunnelPath(p)).toBe(false)
  })
})

describe('deviceAllowsReplay', () => {
  it('allows normal connections and unknown devices', () => {
    expect(deviceAllowsReplay({})).toBe(true)
    expect(deviceAllowsReplay({ connection: { effectiveType: '4g' } })).toBe(
      true
    )
    expect(deviceAllowsReplay({ connection: { effectiveType: '3g' } })).toBe(
      true
    )
  })
  it('skips data-saver and 2G-class links', () => {
    expect(deviceAllowsReplay({ connection: { saveData: true } })).toBe(false)
    expect(deviceAllowsReplay({ connection: { effectiveType: '2g' } })).toBe(
      false
    )
    expect(
      deviceAllowsReplay({ connection: { effectiveType: 'slow-2g' } })
    ).toBe(false)
  })
})

describe('scrollFraction', () => {
  it('measures the scrolled share of the page', () => {
    expect(scrollFraction(0, 800, 4000)).toBe(0)
    expect(scrollFraction(800, 800, 4000)).toBe(0.25)
    expect(scrollFraction(3200, 800, 4000)).toBe(1)
  })
  it('treats a page shorter than the viewport as fully read', () => {
    expect(scrollFraction(0, 900, 600)).toBe(1)
  })
})
