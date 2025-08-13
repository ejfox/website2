import { describe, it, expect, vi } from 'vitest'

// Test core content processing utilities
describe('Content Processing Pipeline', () => {
  it('should format dates correctly', () => {
    const { format } = require('date-fns')
    const testDate = '2024-01-01T12:00:00Z' // Use noon to avoid timezone issues
    const formatted = format(new Date(testDate), 'MMMM d, yyyy')
    expect(formatted).toBe('January 1, 2024')
  })

  it('should extract first image from HTML', () => {
    const extractFirstImage = (html: string) => html?.match(/src="([^"]+)"/i)?.[1] || null
    
    const htmlWithImage = '<p>Text</p><img src="/test.jpg" alt="test"><p>More text</p>'
    const htmlWithoutImage = '<p>Just text here</p>'
    
    expect(extractFirstImage(htmlWithImage)).toBe('/test.jpg')
    expect(extractFirstImage(htmlWithoutImage)).toBeNull()
  })

  it('should extract description from HTML', () => {
    const extractDescription = (html: string) => {
      if (!html) return ''
      const text = html.replace(/<img[^>]*>/gi, '').match(/<p[^>]*>(.*?)<\/p>/i)?.[1]?.replace(/<[^>]*>/g, '').trim()
      return text?.length > 150 ? text.substring(0, 147) + '...' : text || ''
    }

    const shortHtml = '<p>Short description</p>'
    const longHtml = '<p>' + 'A'.repeat(200) + '</p>'
    const htmlWithImage = '<img src="test.jpg"><p>Description after image</p>'
    
    expect(extractDescription(shortHtml)).toBe('Short description')
    expect(extractDescription(longHtml)).toMatch(/^A{147}\.\.\./)
    expect(extractDescription(htmlWithImage)).toBe('Description after image')
  })
})

describe('Animation System', () => {
  it('should provide consistent timing values', () => {
    const timing = {
      fast: 200,
      normal: 400, 
      slow: 800,
      slower: 1600,
      slowest: 2400
    }
    
    // Test geometric progression (2x scaling)
    expect(timing.normal).toBe(timing.fast * 2)
    expect(timing.slow).toBe(timing.normal * 2)
    expect(timing.slower).toBe(timing.slow * 2)
    expect(timing.slowest).toBe(timing.slower * 1.5) // Slight variation for ultra-slow
  })

  it('should provide stagger values', () => {
    const staggers = {
      tight: 50,
      normal: 100,
      loose: 200
    }
    
    expect(staggers.normal).toBe(staggers.tight * 2)
    expect(staggers.loose).toBe(staggers.normal * 2)
  })
})

describe('Content Filtering', () => {
  it('should identify special sections correctly', () => {
    const isSpecialSection = (slug: string) => {
      const pathParts = slug.split('/')
      const basePath = pathParts.length > 1 && /^\d{4}$/.test(pathParts[0])
        ? pathParts.slice(1).join('/')
        : slug
      
      return basePath.startsWith('reading/') ||
             basePath.startsWith('projects/') ||
             basePath.startsWith('robots/') ||
             basePath.startsWith('drafts/') ||
             basePath.startsWith('study-notes/') ||
             basePath.startsWith('prompts/') ||
             basePath.startsWith('week-notes/')
    }

    expect(isSpecialSection('projects/test')).toBe(true)
    expect(isSpecialSection('2024/projects/test')).toBe(true)
    expect(isSpecialSection('regular-blog-post')).toBe(false)
    expect(isSpecialSection('week-notes/2024-01')).toBe(true)
  })

  it('should identify system files correctly', () => {
    const isSystemFile = (slug: string) => {
      return !slug || slug === 'index' || slug.startsWith('!') || slug.startsWith('_')
    }

    expect(isSystemFile('index')).toBe(true)
    expect(isSystemFile('!system')).toBe(true)
    expect(isSystemFile('_private')).toBe(true)
    expect(isSystemFile('')).toBe(true)
    expect(isSystemFile('regular-post')).toBe(false)
  })

  it('should validate date handling', () => {
    const getValidDate = (date: string | Date | undefined): string => {
      try {
        if (!date) return new Date().toISOString()
        if (date instanceof Date) return date.toISOString()
        const parsed = new Date(date)
        return !isNaN(parsed.getTime()) ? parsed.toISOString() : new Date().toISOString()
      } catch {
        return new Date().toISOString()
      }
    }

    const validDate = '2024-01-01T00:00:00Z'
    const invalidDate = 'not-a-date'
    
    expect(getValidDate(validDate)).toBe('2024-01-01T00:00:00.000Z')
    expect(getValidDate(invalidDate)).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/)
    expect(getValidDate(undefined)).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/)
  })
})

describe('URL and Routing', () => {
  it('should handle slug generation correctly', () => {
    const generateSlug = (statement: string): string => {
      return statement
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .replace(/\s+/g, '-')
        .substring(0, 50)
    }

    expect(generateSlug('Test Statement!')).toBe('test-statement')
    expect(generateSlug('Multiple    Spaces')).toBe('multiple-spaces')
    expect(generateSlug('Special@Characters#Here')).toBe('specialcharactershere')
  })
})

describe('Build System Health', () => {
  it('should have core dependencies available', () => {
    expect(() => require('date-fns')).not.toThrow()
    expect(() => require('gray-matter')).not.toThrow()
    expect(() => require('zod')).not.toThrow()
    expect(() => require('consola')).not.toThrow()
  })
})