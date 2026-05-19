/**
 * Extract content fragments from a processed post JSON for rendering
 * as floating cards in 3D space.
 */

import { promises as fs } from 'node:fs'
import path from 'node:path'
import matter from 'gray-matter'

const ROOT = path.resolve(import.meta.dirname, '../..')
const PROCESSED_DIR = path.join(ROOT, 'content', 'processed')
const BLOG_DIR = path.join(ROOT, 'content', 'blog')

/**
 * Best-effort fragment extraction from a raw markdown file. Used when the
 * processed JSON doesn't exist yet (drafts, in-progress posts).
 */
async function extractFromMarkdown(slug) {
  const mdPath = path.join(BLOG_DIR, `${slug}.md`)
  const raw = await fs.readFile(mdPath, 'utf8')
  const { data: fm, content } = matter(raw)

  // Title: first H1 (## or #), else filename
  const h1 = content.match(/^#{1,2}\s+(.+)$/m)
  const title = (fm.title || h1?.[1] || slug.split('/').pop()).trim()

  // Headings ## / ###, skipping the first H1/H2 used as title.
  const headings = []
  for (const m of content.matchAll(/^#{2,4}\s+(.+)$/gm)) {
    const text = m[1].trim()
    if (text !== title && !headings.includes(text)) headings.push(text)
    if (headings.length >= 5) break
  }

  // Blockquotes (lines starting with >, joined into paragraphs).
  const blockquotes = []
  for (const m of content.matchAll(/^(?:>\s?.*(?:\n|$))+/gm)) {
    const text = m[0].replace(/^>\s?/gm, '').replace(/\s+/g, ' ').trim()
    if (text.length > 10 && text.length < 200) blockquotes.push(text)
    if (blockquotes.length >= 3) break
  }

  // Cloudinary image URLs.
  const imageUrls = []
  for (const m of content.matchAll(/!\[[^\]]*]\((https:\/\/res\.cloudinary\.com\/ejf\/image\/upload\/[^)]+)\)/g)) {
    imageUrls.push(m[1])
    if (imageUrls.length >= 3) break
  }

  // First real paragraph (skip frontmatter, headings, blockquotes, images, lists).
  const lines = content.split('\n')
  let firstParagraph = null
  for (const line of lines) {
    const t = line.trim()
    if (!t) continue
    if (t.startsWith('#')) continue
    if (t.startsWith('>')) continue
    if (t.startsWith('![')) continue
    if (t.startsWith('- ') || t.startsWith('* ') || /^\d+\./.test(t)) continue
    firstParagraph = t.replace(/[*_`[\]]/g, '').slice(0, 120)
    break
  }

  return {
    title,
    dek: fm.dek || null,
    headings,
    blockquotes,
    imageUrls,
    firstParagraph,
    tags: (fm.tags || []).slice(0, 5),
    stats: {
      words: content.split(/\s+/).filter(Boolean).length,
      images: imageUrls.length,
      links: (content.match(/\]\(/g) || []).length,
      codeBlocks: (content.match(/^```/gm) || []).length / 2,
      date: fm.date || null,
    },
  }
}

/**
 * Load and extract content fragments from a post slug.
 * @param {string} slug - e.g. "2025/personal-apis"
 * @returns {object} Extracted fragments for the scene
 */
export async function extractContent(slug) {
  // Try to find the processed JSON
  const jsonPath = path.join(PROCESSED_DIR, `${slug}.json`)
  let raw
  try {
    raw = await fs.readFile(jsonPath, 'utf8')
  } catch (e) {
    if (e.code === 'ENOENT') {
      // No processed JSON yet (e.g. draft / in-progress post). Fall back to
      // extracting fragments straight from the source markdown.
      return extractFromMarkdown(slug)
    }
    throw e
  }
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
