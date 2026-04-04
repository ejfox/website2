/**
 * Extract content fragments from a processed post JSON for rendering
 * as floating cards in 3D space.
 */

import { promises as fs } from 'node:fs'
import path from 'node:path'

const ROOT = path.resolve(import.meta.dirname, '../..')
const PROCESSED_DIR = path.join(ROOT, 'content', 'processed')

/**
 * Load and extract content fragments from a post slug.
 * @param {string} slug - e.g. "2025/personal-apis"
 * @returns {object} Extracted fragments for the scene
 */
export async function extractContent(slug) {
  // Try to find the processed JSON
  const jsonPath = path.join(PROCESSED_DIR, `${slug}.json`)
  const raw = await fs.readFile(jsonPath, 'utf8')
  const post = JSON.parse(raw)

  const html = post.html || ''
  const meta = post.metadata || {}

  // Extract headings from TOC
  const headings = (meta.toc || [])
    .map(h => h.text)
    .filter(Boolean)
    .slice(0, 5)

  // Extract blockquotes from HTML
  const blockquotes = []
  const bqRe = /<blockquote[^>]*>([\s\S]*?)<\/blockquote>/gi
  for (const m of html.matchAll(bqRe)) {
    const text = m[1].replace(/<[^>]+>/g, '').trim()
    if (text.length > 10 && text.length < 200) {
      blockquotes.push(text)
    }
  }

  // Extract Cloudinary image URLs from HTML
  const imageUrls = []
  const imgRe = /src="(https:\/\/res\.cloudinary\.com\/ejf\/image\/upload\/[^"]+)"/gi
  for (const m of html.matchAll(imgRe)) {
    imageUrls.push(m[1])
    if (imageUrls.length >= 3) break
  }

  // Extract first paragraph
  const pRe = /<p[^>]*>([\s\S]*?)<\/p>/i
  const pMatch = html.match(pRe)
  const firstParagraph = pMatch
    ? pMatch[1].replace(/<[^>]+>/g, '').trim().slice(0, 120)
    : null

  return {
    title: post.title || slug.split('/').pop(),
    dek: meta.dek || null,
    headings,
    blockquotes: blockquotes.slice(0, 3),
    imageUrls,
    firstParagraph,
    tags: (meta.tags || []).slice(0, 5),
    stats: {
      words: meta.words || 0,
      images: meta.images || 0,
      links: meta.links || 0,
      codeBlocks: meta.codeBlocks || 0,
      date: meta.date || null,
    },
  }
}
