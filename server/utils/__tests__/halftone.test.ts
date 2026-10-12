import { describe, it, expect } from 'vitest'
import { loadImage, createCanvas } from '@napi-rs/canvas'
import {
  encodePng1,
  halftone,
  lineScreen,
  rank01,
  autoLevel,
  cloudinaryTransform,
} from '../halftone'

describe('encodePng1', () => {
  it('writes a true 1-bit greyscale PNG that decodes back pixel-for-pixel', async () => {
    // Odd width exercises the partial last byte of each row.
    const w = 37
    const h = 11
    const bits = new Uint8Array(w * h)
    for (let i = 0; i < bits.length; i++) bits[i] = (i * 7919) % 3 === 0 ? 1 : 0
    const png = encodePng1(bits, w, h)

    // IHDR: bit depth 1, colour type 0.
    expect(png.subarray(12, 16).toString('ascii')).toBe('IHDR')
    expect(png.readUInt32BE(16)).toBe(w)
    expect(png.readUInt32BE(20)).toBe(h)
    expect(png[24]).toBe(1)
    expect(png[25]).toBe(0)

    const img = await loadImage(png)
    expect(img.width).toBe(w)
    expect(img.height).toBe(h)
    const ctx = createCanvas(w, h).getContext('2d')
    ctx.drawImage(img, 0, 0)
    const px = ctx.getImageData(0, 0, w, h).data
    for (let i = 0; i < bits.length; i++) {
      expect(px[i * 4]).toBe(bits[i] ? 255 : 0)
    }
  })
})

describe('rank01', () => {
  it('is a stable argsort, ties broken by index, (r + 0.5) / n', () => {
    const a = new Float32Array([0.5, -1, 0.5, 2, -0])
    // order: -1(1), -0(4), 0.5(0), 0.5(2), 2(3)
    const r = Array.from(rank01(a))
    const n = 5
    expect(r).toEqual([2, 0, 3, 4, 1].map((k) => Math.fround((k + 0.5) / n)))
  })
})

describe('line screen', () => {
  it('coverage equals tone for flat greys (within 1%)', () => {
    const w = 120
    const h = 90
    for (const tone of [0.05, 0.25, 0.5, 0.73, 0.95]) {
      const g = new Float32Array(w * h).fill(tone)
      const out = halftone(g, w, h)
      const mean = out.reduce((s, v) => s + v, 0) / out.length
      expect(Math.abs(mean - tone)).toBeLessThan(0.01)
    }
  })

  it('draws lines at 15deg with a 5px period', () => {
    const w = 100
    const h = 100
    const g = new Float32Array(w * h).fill(0.5)
    const out = halftone(g, w, h)
    // Along a row, the pattern repeats every period / cos(15deg) ~ 5.18 px:
    // ~19 white runs across 100 px.
    let runs = 0
    for (let x = 1; x < w; x++)
      if (out[50 * w + x] && !out[50 * w + x - 1]) runs++
    expect(runs).toBeGreaterThanOrEqual(18)
    expect(runs).toBeLessThanOrEqual(20)
  })

  it('caches the threshold map per size', () => {
    expect(lineScreen(64, 48)).toBe(lineScreen(64, 48))
    expect(lineScreen(64, 48)).not.toBe(lineScreen(48, 64))
  })
})

describe('autoLevel', () => {
  it('leaves full-range images alone', () => {
    const g = new Float32Array(1000).map((_, i) => i / 999)
    expect(autoLevel(g)).toEqual([0, 1])
  })
  it('clips at most 10% at either end', () => {
    const g = new Float32Array(1000).map((_, i) => 0.3 + (0.4 * i) / 999)
    const [lo, hi] = autoLevel(g)
    expect(lo).toBeCloseTo(0.1)
    expect(hi).toBeCloseTo(0.9)
  })
})

describe('cloudinaryTransform', () => {
  it('replaces existing transforms and keeps the version + id', () => {
    expect(
      cloudinaryTransform(
        'https://res.cloudinary.com/ejf/image/upload/c_scale,f_auto,w_1280/v1731960044/gear-viz.r1.png',
        'w_800'
      )
    ).toBe(
      'https://res.cloudinary.com/ejf/image/upload/w_800/v1731960044/gear-viz.r1.png'
    )
    expect(cloudinaryTransform('https://example.com/a.jpg', 'w_800')).toBe(
      'https://example.com/a.jpg'
    )
  })
})
