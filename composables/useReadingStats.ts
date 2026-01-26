/**
 * @file useReadingStats.ts
 * @description Computes reading statistics from post HTML content
 */

import { type Ref, type ComputedRef, computed, unref } from 'vue'

interface ReadingStats {
  words: number
  images: number
  links: number
  readingTime: number
  characters: number
  linkDensity: string
  paragraphs: number
  headings: number
  fileSize: string
}

export function useReadingStats(post: Ref<any> | ComputedRef<any>) {
  const stats = computed<ReadingStats>(() => {
    const p = unref(post)
    if (!p) {
      return {
        words: 0,
        images: 0,
        links: 0,
        readingTime: 0,
        characters: 0,
        linkDensity: '0',
        paragraphs: 0,
        headings: 0,
        fileSize: '0KB',
      }
    }

    const words = p.metadata?.words || p.words || 0
    const images = p.metadata?.images || p.images || 0
    const links = p.metadata?.links || p.links || 0
    const characters = p.html?.length || p.content?.length || 0
    const html = p.html || ''

    return {
      words,
      images,
      links,
      readingTime: Math.ceil(words / 200),
      characters,
      linkDensity: words > 0 ? (links / (words / 100)).toFixed(1) : '0',
      paragraphs: (html.match(/<p[^>]*>/g) || []).length,
      headings: (html.match(/<h[1-6][^>]*>/g) || []).length,
      fileSize: (characters / 1024).toFixed(1) + 'KB',
    }
  })

  return { stats }
}
