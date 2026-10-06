import { describe, it, expect } from 'vitest'
import { splitChunks, parseCloudinary, isMeaningful } from '../sync-ocr-to-cloudinary.mjs'

describe('splitChunks', () => {
  it('reassembles exactly, with no piece starting or ending on whitespace', () => {
    const words = Array.from({ length: 1500 }, (_, i) => `word${i}${i % 7 ? ' ' : '\n'}`).join('')
    const text = words.trim()
    const chunks = splitChunks(text, 1000)
    expect(chunks.join('')).toBe(text)
    for (const c of chunks) {
      expect(c.length).toBeLessThanOrEqual(1000)
      expect(c).toBe(c.trim()) // Cloudinary trims values; a trimmed piece loses nothing
    }
  })

  it('leaves short text as one piece', () => {
    expect(splitChunks('hello world', 1000)).toEqual(['hello world'])
  })
})

describe('parseCloudinary', () => {
  it('drops transforms and version, keeps folders', () => {
    expect(parseCloudinary('https://res.cloudinary.com/ejf/image/upload/c_limit,w_800/v12/blog/2024/foo%20bar.jpg')).toEqual({
      cloud: 'ejf',
      publicId: 'blog/2024/foo bar',
    })
    expect(parseCloudinary('https://example.com/x.png')).toBeNull()
  })
})

describe('isMeaningful', () => {
  it('rejects OCR noise from photos', () => {
    expect(isMeaningful('Bs -_ ff ae ~~')).toBe(false)
    expect(isMeaningful('the quick brown foxes jumped over')).toBe(true)
  })
})
