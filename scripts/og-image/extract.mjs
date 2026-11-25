/**
 * @file extract.mjs
 * @description Pull title, headings (flat `outline` with levels), blockquotes,
 *   Cloudinary image URLs, tags, a sentence pool, a block-by-block structure
 *   strip (`blocks`) and stats out of a post for the OG image generator's
 *   four house styles.
 *   Reads content/processed/<slug>.json; if that doesn't exist (drafts), falls
 *   back to the source markdown under content/blog/ and, when the env var
 *   DISPATCH_VAULT_PATH is set (the Dispatch app sets it), the Obsidian vault.
 *   Read-only. Only res.cloudinary.com/ejf image URLs are picked up.
 */

import { promises as fs } from 'node:fs'
import path from 'node:path'
import matter from 'gray-matter'

const ROOT = path.resolve(import.meta.dirname, '../..')
const PROCESSED_DIR = path.join(ROOT, 'content', 'processed')
const BLOG_DIR = path.join(ROOT, 'content', 'blog')

// Number of image cards to feed into the 3D scene. The renderer + layout
// happily handle more than 3; the old cap was conservative.
const MAX_IMAGES = 6
const CLOUDINARY_RE =
  /https:\/\/res\.cloudinary\.com\/ejf\/image\/upload\/[^\s"')]+/g

/**
 * Pull Cloudinary URLs out of frontmatter fields a writer might use
 * (`cover`, `image`, `og_image`, or an `images:` array). Anything that
 * doesn't look like a Cloudinary URL is ignored — the 3D renderer
 * specifically wants those.
 */
function imagesFromFrontmatter(fm) {
  const candidates = [
    fm.cover,
    fm.image,
    fm.og_image,
    fm.ogImage,
    fm.hero,
    ...(Array.isArray(fm.images) ? fm.images : []),
  ].filter(Boolean)
  const urls = []
  for (const c of candidates) {
    const s = typeof c === 'string' ? c : c?.url
    if (!s) continue
    const matches = s.match(CLOUDINARY_RE)
    if (matches) urls.push(...matches)
  }
  return urls
}

function dedupe(arr) {
  return [...new Set(arr)]
}

// Emoji and other pictographs in headings ("📸 Creative") would print as
// tofu or, worse, as emoji; the cards are glyph-only by house rule.
// The joiner and variation selector sit outside the class: inside one they
// trip no-misleading-character-class, and as alternatives they trip
// prefer-character-class. The two rules can't both be satisfied.
const EMOJI_RE =
  // eslint-disable-next-line regexp/prefer-character-class
  /[\u{1F000}-\u{1FAFF}\u{2300}-\u{23FF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}]|\u{FE0F}|\u{200D}/gu

function cleanText(s) {
  return s
    .replace(/&#x26;|&amp;/g, '&')
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&nbsp;/g, ' ')
    .replace(EMOJI_RE, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function countWords(s) {
  return s.split(/\s+/).filter(Boolean).length
}

/**
 * Split text into sentences, keeping the short, quotable ones. Styles use
 * these as typographic texture (footnote margins, glyph rain) so the card
 * is built from the post's own words rather than lorem.
 */
function pickSentences(text, max = 12) {
  const out = []
  for (const s of text.split(/(?<=[.!?])\s+/)) {
    const t = s.trim()
    if (t.length >= 24 && t.length <= 140) out.push(t)
    if (out.length >= max) break
  }
  return out
}

/**
 * Flatten a nested TOC (`metadata.toc` nests h3s under their h2) into
 * document order with levels. The old code read only the top level, so
 * a post whose h2s had children lost every child heading.
 */
function flattenToc(toc, out = []) {
  for (const h of toc || []) {
    const text = cleanText(h.text || '')
    if (text) out.push({ text, level: Number((h.level || 'h2').slice(1)) })
    if (h.children && h.children.length) flattenToc(h.children, out)
  }
  return out
}

/**
 * Walk a post's HTML top-level blocks in order and return a structure strip:
 * one entry per paragraph / heading / quote / code / list item / image with
 * its word count. The Academic sparkline and the Vulpes glyph field read
 * this; it's the post's shape, not its words.
 */
function blocksFromHtml(html) {
  const blocks = []
  const re =
    /<(h[1-6]|p|li|pre|blockquote)\b[^>]*>([\s\S]*?)<\/\1>|<img\b[^>]*>/gi
  for (const m of html.matchAll(re)) {
    if (!m[1]) {
      blocks.push({ type: 'img', words: 0 })
      continue
    }
    const tag = m[1].toLowerCase()
    const words = countWords(cleanText(m[2].replace(/<[^>]+>/g, ' ')))
    if (tag === 'pre') {
      blocks.push({ type: 'code', words })
    } else if (tag === 'blockquote') {
      blocks.push({ type: 'quote', words })
    } else if (tag[0] === 'h') {
      blocks.push({ type: tag, words })
    } else if (tag === 'li') {
      blocks.push({ type: 'li', words })
    } else if (words > 0) {
      blocks.push({ type: 'p', words })
    }
  }
  return blocks
}

/** Same structure strip, from raw markdown (draft fallback). */
function blocksFromMarkdown(content) {
  const blocks = []
  let inCode = false
  let codeWords = 0
  let para = []
  function flushPara() {
    if (para.length) {
      blocks.push({ type: 'p', words: countWords(para.join(' ')) })
      para = []
    }
  }
  for (const line of content.split('\n')) {
    const t = line.trim()
    if (t.startsWith('```')) {
      if (inCode) {
        blocks.push({ type: 'code', words: codeWords })
        codeWords = 0
      } else {
        flushPara()
      }
      inCode = !inCode
      continue
    }
    if (inCode) {
      codeWords += countWords(t)
      continue
    }
    if (!t) {
      flushPara()
      continue
    }
    const h = t.match(/^(#{1,6})\s+(\S.*)$/)
    if (h) {
      flushPara()
      blocks.push({ type: `h${h[1].length}`, words: countWords(h[2]) })
    } else if (t.startsWith('![')) {
      flushPara()
      blocks.push({ type: 'img', words: 0 })
    } else if (t.startsWith('>')) {
      flushPara()
      blocks.push({ type: 'quote', words: countWords(t.replace(/^>\s?/, '')) })
    } else if (/^(?:[-*]|\d+\.)\s/.test(t)) {
      flushPara()
      blocks.push({
        type: 'li',
        words: countWords(t.replace(/^(?:[-*]|\d+\.)\s/, '')),
      })
    } else {
      para.push(t)
    }
  }
  flushPara()
  return blocks
}

// ── Markdown fallback (no processed JSON yet) ──────────────────────────

/**
 * Try multiple candidate paths for a slug's source markdown. Posts live in
 * `blog/`, `blog/YYYY/`, or `blog/week-notes/` depending on type — and the
 * slug alone doesn't tell us which. We probe the likely roots and, as a
 * final fallback, walk the blog tree looking for `<slug>.md`.
 *
 * Website repo has the synced copies; Dispatch sets DISPATCH_VAULT_PATH
 * when generating from a draft that only lives in the Obsidian vault.
 */
async function readMarkdownForSlug(slug) {
  // Search roots, in priority order. The vault root is included because
  // `week-notes/` is a sibling of `blog/` in EJ's vault, not nested inside.
  const roots = [BLOG_DIR]
  if (process.env.DISPATCH_VAULT_PATH) {
    roots.push(
      path.join(process.env.DISPATCH_VAULT_PATH, 'blog'),
      process.env.DISPATCH_VAULT_PATH
    )
  }

  // Subdirs probed under each root before falling back to a tree walk.
  // Year inferred from a `YYYY-...` slug prefix.
  const subdirs = ['', 'week-notes']
  const yearMatch = slug.match(/^(\d{4})-/)
  if (yearMatch) subdirs.push(yearMatch[1])

  const tried = []
  for (const root of roots) {
    for (const sub of subdirs) {
      const p = path.join(root, sub, `${slug}.md`)
      try {
        return { raw: await fs.readFile(p, 'utf8'), path: p }
      } catch {
        tried.push(p)
      }
    }
  }

  // Last resort: shallow walk of each root for `<slug>.md` anywhere
  // beneath it. Vault has ~dozens of dirs; this stays cheap.
  for (const root of roots) {
    const found = await findMarkdownInTree(root, `${slug}.md`)
    if (found) return { raw: await fs.readFile(found, 'utf8'), path: found }
  }

  const err = new Error(
    `Could not find ${slug}.md under ${roots.join(' or ')} (tried: ${tried.join(', ')})`
  )
  err.code = 'ENOENT'
  throw err
}

/**
 * Shallow-recursive search for `filename` under `root`. Returns the first
 * match or null. Skips hidden dirs and node_modules out of paranoia.
 */
async function findMarkdownInTree(root, filename) {
  let entries
  try {
    entries = await fs.readdir(root, { withFileTypes: true })
  } catch {
    return null
  }
  // Direct hit before descending.
  for (const e of entries) {
    if (e.isFile() && e.name === filename) return path.join(root, filename)
  }
  for (const e of entries) {
    if (!e.isDirectory()) continue
    if (e.name.startsWith('.') || e.name === 'node_modules') continue
    const hit = await findMarkdownInTree(path.join(root, e.name), filename)
    if (hit) return hit
  }
  return null
}

/**
 * Best-effort fragment extraction from a raw markdown file. Used when the
 * processed JSON doesn't exist yet (drafts, in-progress posts).
 */
async function extractFromMarkdown(slug) {
  const { raw } = await readMarkdownForSlug(slug)
  const { data: fm, content } = matter(raw)

  // Title: first H1 (## or #), else filename
  const h1 = content.match(/^#{1,2}[ \t]+(\S.*)$/m)
  const title = (fm.title || h1?.[1] || slug.split('/').pop()).trim()

  // Headings ## / ###, skipping the first H1/H2 used as title. `outline`
  // keeps every heading with its level; `headings` is the first five texts
  // for the card layout.
  const outline = []
  for (const m of content.matchAll(/^(#{2,4})[ \t]+(\S.*)$/gm)) {
    const text = cleanText(m[2])
    if (!text || text === title) continue
    if (outline.some((h) => h.text === text)) continue
    outline.push({ text, level: m[1].length })
  }
  const headings = outline.slice(0, 5).map((h) => h.text)

  // Blockquotes (lines starting with >, joined into paragraphs).
  const blockquotes = []
  for (const m of content.matchAll(/^(?:>\s?.*(?:\n|$))+/gm)) {
    const text = m[0].replace(/^>\s?/gm, '').replace(/\s+/g, ' ').trim()
    if (text.length > 10 && text.length < 200) blockquotes.push(text)
    if (blockquotes.length >= 3) break
  }

  // Cloudinary image URLs — frontmatter first (cover/hero stays prominent),
  // then body markdown refs.
  const cloudinaryImgRe = new RegExp(
    String.raw`!\[[^\]]*\]\(` +
      String.raw`(https://res\.cloudinary\.com/ejf/image/upload/[^)]+)\)`,
    'g'
  )
  const imageUrls = dedupe([
    ...imagesFromFrontmatter(fm),
    ...Array.from(content.matchAll(cloudinaryImgRe)).map((m) => m[1]),
  ]).slice(0, MAX_IMAGES)

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

  const prose = content
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/^#.*$/gm, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[*_`>]/g, '')

  return {
    title: cleanText(title),
    dek: fm.dek || null,
    headings,
    outline,
    blockquotes,
    imageUrls,
    firstParagraph,
    sentences: pickSentences(cleanText(prose)),
    blocks: blocksFromMarkdown(content),
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

// ── Processed JSON (the normal path) ───────────────────────────────────

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

  // Extract headings from the (nested) TOC, flattened in document order.
  const outline = flattenToc(meta.toc)
  const headings = outline.slice(0, 5).map((h) => h.text)

  // Extract blockquotes from HTML
  const blockquotes = []
  const bqRe = /<blockquote[^>]*>([\s\S]*?)<\/blockquote>/gi
  for (const m of html.matchAll(bqRe)) {
    const text = cleanText(m[1].replace(/<[^>]+>/g, ' '))
    if (text.length > 10 && text.length < 200) {
      blockquotes.push(text)
    }
  }

  // Plain prose for the sentence pool: paragraphs only, tags stripped.
  const prose = Array.from(html.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/gi))
    .map((m) => cleanText(m[1].replace(/<[^>]+>/g, ' ')))
    .join(' ')

  // Extract Cloudinary image URLs — frontmatter (cover/hero/og_image first
  // so they stay prominent) then HTML src= attributes.
  const imageUrls = dedupe([
    ...imagesFromFrontmatter(meta),
    ...Array.from(
      html.matchAll(
        /src="(https:\/\/res\.cloudinary\.com\/ejf\/image\/upload\/[^"]+)"/gi
      )
    ).map((m) => m[1]),
  ]).slice(0, MAX_IMAGES)

  // Extract first paragraph
  const pRe = /<p[^>]*>([\s\S]*?)<\/p>/i
  const pMatch = html.match(pRe)
  const firstParagraph = pMatch
    ? pMatch[1]
        .replace(/<[^>]+>/g, '')
        .trim()
        .slice(0, 120)
    : null

  return {
    title: cleanText(post.title || slug.split('/').pop()),
    dek: meta.dek || null,
    headings,
    outline,
    blockquotes: blockquotes.slice(0, 3),
    imageUrls,
    firstParagraph,
    sentences: pickSentences(prose),
    blocks: blocksFromHtml(html),
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
