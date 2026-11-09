/**
 * @file style-academic.mjs
 * @description House style 2, "Academic": a black-and-white typographic
 *   card in the spirit of academic.css — OLED black, one type scale,
 *   hierarchy from weight, case, tone, hairlines and spacing. The
 *   generative part is the post itself: a small multiple of the document's
 *   block structure (one bar per paragraph, ticks for headings, hollow
 *   marks for quotes), a numbered section list, footnote-style quotes in
 *   the margin and a faint dot field seeded by the slug.
 */

import { createCanvas } from '@napi-rs/canvas'
import { createNoise2D } from 'simplex-noise'
import { createRng, randPick } from './seed.mjs'
import {
  fitText,
  wrapText,
  hairline,
  ellipsize,
  isoDay,
  fmtInt,
} from './text.mjs'

export const name = 'academic'

const WIDTH = 1200
const HEIGHT = 630
const MARGIN = 72

// academic.css tonal ramp (dark). True white is the h1 only.
const TONE = {
  bright: '#ffffff',
  strong: '#e6e6e6',
  text: '#c4c4c4',
  muted: '#858585',
  faint: '#767676',
  rule: '#3a3a3a',
  bgMuted: '#141414',
}

const SANS = 'Helvetica Neue, Helvetica, Arial, sans-serif'
const MONO = 'IBM Plex Mono, Menlo, monospace'

/** Faint dot field: a grid whose dot size follows slug-seeded noise. */
function drawDotField(ctx, noise, x0, y0, x1, y1, step) {
  for (let y = y0; y < y1; y += step) {
    for (let x = x0; x < x1; x += step) {
      const n = (noise(x * 0.004, y * 0.004) + 1) / 2
      if (n < 0.45) continue
      const r = 0.5 + (n - 0.45) * 2.2
      ctx.fillStyle = `rgba(255,255,255,${0.05 + (n - 0.45) * 0.3})`
      ctx.beginPath()
      ctx.arc(x, y, r, 0, Math.PI * 2)
      ctx.fill()
    }
  }
}

/**
 * The document as a strip: reading order left→right, one mark per block.
 * Paragraph = bar scaled to word count; heading = full-height hairline
 * tick; quote = hollow bar; list item = short bar; image/code = a dot row.
 */
function drawStructureStrip(ctx, blocks, x, y, w, h) {
  if (!blocks.length) return
  const maxWords = Math.max(1, ...blocks.map((b) => b.words))
  const slot = w / blocks.length
  const barW = Math.max(1, Math.min(6, slot * 0.6))
  const base = y + h

  hairline(ctx, x, base + 0.5, x + w, base + 0.5, TONE.rule)

  for (let i = 0; i < blocks.length; i++) {
    const b = blocks[i]
    const bx = x + i * slot + (slot - barW) / 2
    const bh = Math.max(2, (b.words / maxWords) * h)
    if (b.type[0] === 'h') {
      hairline(ctx, bx + barW / 2, y, bx + barW / 2, base, TONE.strong)
    } else if (b.type === 'quote') {
      ctx.strokeStyle = TONE.muted
      ctx.lineWidth = 1
      ctx.strokeRect(bx + 0.5, base - bh + 0.5, barW - 1, bh - 1)
    } else if (b.type === 'img' || b.type === 'code') {
      ctx.fillStyle = TONE.muted
      ctx.beginPath()
      ctx.arc(bx + barW / 2, base - 4, 2, 0, Math.PI * 2)
      ctx.fill()
    } else {
      let tone = TONE.text
      if (b.type === 'li') tone = TONE.faint
      ctx.fillStyle = tone
      ctx.fillRect(bx, base - bh, barW, bh)
    }
  }
}

export async function render(content, seed) {
  const canvas = createCanvas(WIDTH, HEIGHT)
  const ctx = canvas.getContext('2d')
  const rng = createRng(seed)
  const noise = createNoise2D(() => rng())

  ctx.fillStyle = '#000'
  ctx.fillRect(0, 0, WIDTH, HEIGHT)

  const blocks = content.blocks || []
  const outline = content.outline || []
  const quotes = content.blockquotes || []
  const sentences = content.sentences || []
  const paragraphs = blocks.filter((b) => b.type === 'p').length
  const minutes = Math.max(1, Math.round((content.stats.words || 0) / 230))

  // Two layouts, picked by seed: the strip rides the right margin beside
  // the title, or runs full-width beneath it like a figure.
  const layout = randPick(rng, ['margin', 'figure'])
  const dotRegion = randPick(rng, ['right', 'bottom', 'none'])
  // More seeded dimensions so a reroll reads as a fresh card: strip
  // height, title ceiling, and which sentences land in the margin.
  const stripH = randPick(rng, [70, 110, 150])
  const titleMax = randPick(rng, [68, 84, 96])
  const noteOffset = Math.floor(rng() * Math.max(1, sentences.length - 2))

  if (dotRegion === 'right') {
    drawDotField(ctx, noise, WIDTH * 0.62, 0, WIDTH, HEIGHT, 14)
  } else if (dotRegion === 'bottom') {
    drawDotField(ctx, noise, 0, HEIGHT * 0.55, WIDTH, HEIGHT, 14)
  }

  // ── Eyebrow: site · date · words · read time, hairline beneath ────────
  ctx.textBaseline = 'alphabetic'
  ctx.font = `400 15px ${MONO}`
  ctx.letterSpacing = '2px'
  ctx.fillStyle = TONE.muted
  const eyebrow = [
    'EJFOX.COM',
    isoDay(content.stats.date),
    `${fmtInt(content.stats.words)} WORDS`,
    `${minutes} MIN`,
  ]
    .filter(Boolean)
    .join('   ·   ')
  ctx.fillText(eyebrow, MARGIN, MARGIN)
  hairline(ctx, MARGIN, MARGIN + 16.5, WIDTH - MARGIN, MARGIN + 16.5, TONE.rule)

  // ── H1: uppercase, tight, the one true white ──────────────────────────
  let titleW = WIDTH - MARGIN * 2
  if (layout === 'margin') titleW = 760
  ctx.letterSpacing = '-3px'
  const title = fitText(
    ctx,
    content.title.toUpperCase(),
    (s) => `700 ${s}px ${SANS}`,
    { maxWidth: titleW, maxLines: 3, maxSize: titleMax, minSize: 48 }
  )
  ctx.letterSpacing = `${-title.size * 0.05}px`
  ctx.fillStyle = TONE.bright
  const lineH = title.size * 1.02
  let y = MARGIN + 50 + title.size
  for (const line of title.lines) {
    ctx.fillText(line, MARGIN - 2, y)
    y += lineH
  }
  ctx.letterSpacing = '0px'

  // ── Dek: the post's dek or its first sentence, body tone ──────────────
  let dek = content.dek
  if (!dek && sentences.length) dek = sentences[0]
  if (!dek && content.firstParagraph) dek = content.firstParagraph
  y += 8
  // The footer band starts at HEIGHT - MARGIN - 44; the dek never enters it.
  let dekRoom = HEIGHT - MARGIN - 64 - y
  // In the figure layout the strip (≥44px + caption) still has to fit
  // under the dek, so the dek gives way first.
  if (layout === 'figure') dekRoom = HEIGHT - MARGIN - 80 - 44 - 36 - y
  const dekMaxLines = Math.min(2, Math.floor(dekRoom / 30))
  if (dek && dekMaxLines >= 1) {
    ctx.font = `400 21px ${SANS}`
    ctx.fillStyle = TONE.text
    const allLines = wrapText(ctx, dek, titleW - 40)
    const dekLines = allLines.slice(0, dekMaxLines)
    for (let i = 0; i < dekLines.length; i++) {
      let line = dekLines[i]
      if (i === dekLines.length - 1 && dekLines.length < allLines.length) {
        line = ellipsize(ctx, `${line}…`, titleW - 40)
      }
      ctx.fillText(line, MARGIN, y + 21)
      y += 30
    }
  }

  // ── Structure strip + caption ─────────────────────────────────────────
  let caption = `${blocks.length} BLOCKS · ${paragraphs} ¶ · ${outline.length} §`
  if (quotes.length) caption += ` · ${quotes.length} QUOTES`
  if (layout === 'margin') {
    const sx = MARGIN + 790
    const sw = WIDTH - MARGIN - sx
    drawStructureStrip(ctx, blocks, sx, MARGIN + 60, sw, stripH)
    ctx.font = `400 12px ${MONO}`
    ctx.letterSpacing = '1.5px'
    ctx.fillStyle = TONE.faint
    ctx.fillText(caption, sx, MARGIN + stripH + 82)
    ctx.letterSpacing = '0px'
  } else {
    // The figure needs at least 44px; if the title ate the room, pull the
    // figure up under the dek rather than squashing it.
    const figFloor = HEIGHT - MARGIN - 80
    const sy = Math.min(Math.max(y + 36, 330), figFloor - 44)
    const figH = Math.max(44, Math.min(stripH, figFloor - sy))
    drawStructureStrip(ctx, blocks, MARGIN, sy, WIDTH - MARGIN * 2, figH)
    ctx.font = `400 12px ${MONO}`
    ctx.letterSpacing = '1.5px'
    ctx.fillStyle = TONE.faint
    ctx.fillText(caption, MARGIN, sy + figH + 22)
    ctx.letterSpacing = '0px'
    y = sy + figH + 30
  }

  // ── Footer band: numbered sections (h3 tone), or tags, with hairline ──
  const footY = HEIGHT - MARGIN
  hairline(ctx, MARGIN, footY - 44.5, WIDTH - MARGIN, footY - 44.5, TONE.rule)

  ctx.font = `400 13px ${MONO}`
  ctx.letterSpacing = '2px'
  ctx.fillStyle = TONE.muted
  let items = outline.map((h, i) => `§${i + 1} ${h.text.toUpperCase()}`)
  if (!items.length)
    items = (content.tags || []).map((t) => `#${t.toUpperCase()}`)
  if (!items.length) {
    items = [`${paragraphs} PARAGRAPHS`, `${fmtInt(content.stats.links)} LINKS`]
  }
  let fx = MARGIN
  const gap = 34
  const fyBase = footY - 18
  for (const item of items) {
    const w = ctx.measureText(item).width
    if (fx + w > WIDTH - MARGIN) {
      // Last one that fits gets an ellipsis if more remain
      const rest = ellipsize(ctx, item, WIDTH - MARGIN - fx)
      if (WIDTH - MARGIN - fx > 60) ctx.fillText(rest, fx, fyBase)
      break
    }
    ctx.fillText(item, fx, fyBase)
    fx += w + gap
  }
  ctx.letterSpacing = '0px'

  // ── Margin footnotes: quotes (or sentences), italic, muted ────────────
  let notes = sentences.slice(1 + noteOffset, 3 + noteOffset)
  if (quotes.length) notes = quotes.slice(0, 2)
  if (layout === 'margin' && notes.length) {
    const nx = MARGIN + 790
    const nw = WIDTH - MARGIN - nx
    let ny = MARGIN + stripH + 130
    ctx.font = `italic 400 15px Georgia, serif`
    for (let i = 0; i < notes.length; i++) {
      const lines = wrapText(ctx, notes[i], nw - 22).slice(0, 3)
      ctx.font = `400 11px ${MONO}`
      ctx.fillStyle = TONE.faint
      ctx.fillText(String(i + 1), nx, ny)
      ctx.font = `italic 400 15px Georgia, serif`
      ctx.fillStyle = TONE.muted
      for (const line of lines) {
        ctx.fillText(line, nx + 18, ny)
        ny += 21
      }
      ny += 14
      if (ny > footY - 70) break
    }
  } else if (layout === 'figure' && notes.length) {
    // One footnote under the figure, left column, if room remains
    const room = footY - 60 - y
    if (room > 40) {
      ctx.font = `italic 400 15px Georgia, serif`
      ctx.fillStyle = TONE.muted
      const lines = wrapText(ctx, notes[0], WIDTH - MARGIN * 2 - 18).slice(
        0,
        Math.floor(room / 21)
      )
      ctx.font = `400 11px ${MONO}`
      ctx.fillStyle = TONE.faint
      ctx.fillText('1', MARGIN, y + 16)
      ctx.font = `italic 400 15px Georgia, serif`
      ctx.fillStyle = TONE.muted
      let ly = y + 16
      for (const line of lines) {
        ctx.fillText(line, MARGIN + 18, ly)
        ly += 21
      }
    }
  }

  return canvas.toBuffer('image/png')
}
