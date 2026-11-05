/**
 * @file text.mjs
 * @description Shared typesetting helpers for the OG image house styles:
 *   measure-based word wrap, a title fitter (shrink until it fits N lines)
 *   and a halo (soft glow behind crisp text — the house alternative to a
 *   box). All take a canvas 2D context and leave its state as they found it.
 */

/**
 * Word-wrap `text` so every line measures ≤ maxWidth in the current
 * ctx.font. A single word wider than the line gets its own line rather
 * than being broken mid-word.
 */
export function wrapText(ctx, text, maxWidth) {
  const words = String(text).split(/\s+/).filter(Boolean)
  const lines = []
  let current = ''
  for (const word of words) {
    let test = word
    if (current) test = `${current} ${word}`
    if (ctx.measureText(test).width > maxWidth && current) {
      lines.push(current)
      current = word
    } else {
      current = test
    }
  }
  if (current) lines.push(current)
  return lines
}

/**
 * Find the largest font size (≤ maxSize, ≥ minSize) at which `text` wraps
 * into at most `maxLines` lines of `maxWidth`. `fontFor(size)` builds the
 * ctx.font string so weight/family stay with the caller. Returns the size
 * and the wrapped lines; sets ctx.font to the winning font.
 */
export function fitText(ctx, text, fontFor, opts) {
  const { maxWidth, maxLines, maxSize, minSize } = opts
  let size = maxSize
  let lines = []
  while (size >= minSize) {
    ctx.font = fontFor(size)
    lines = wrapText(ctx, text, maxWidth)
    const widest = Math.max(...lines.map((l) => ctx.measureText(l).width))
    if (lines.length <= maxLines && widest <= maxWidth) break
    size -= 2
  }
  if (size < minSize) {
    size = minSize
    ctx.font = fontFor(size)
    lines = wrapText(ctx, text, maxWidth).slice(0, maxLines)
  }
  return { size, lines }
}

/**
 * Draw text with a soft halo behind it: a blurred pass (or several, for a
 * wider bloom) in `haloColor`, then the crisp glyphs in `color`. Uses the
 * current ctx.font / textAlign / textBaseline.
 */
export function haloText(ctx, text, x, y, opts = {}) {
  const {
    color = '#fff',
    haloColor = 'rgba(255,255,255,0.5)',
    blur = 24,
    passes = 2,
  } = opts
  ctx.save()
  ctx.shadowColor = haloColor
  ctx.shadowBlur = blur
  ctx.fillStyle = haloColor
  for (let i = 0; i < passes; i++) ctx.fillText(text, x, y)
  ctx.shadowBlur = 0
  ctx.shadowColor = 'transparent'
  ctx.fillStyle = color
  ctx.fillText(text, x, y)
  ctx.restore()
}

/** A 1px hairline between two points, in the given color. */
export function hairline(ctx, x1, y1, x2, y2, color, width = 1) {
  ctx.save()
  ctx.strokeStyle = color
  ctx.lineWidth = width
  ctx.beginPath()
  ctx.moveTo(x1, y1)
  ctx.lineTo(x2, y2)
  ctx.stroke()
  ctx.restore()
}

/** Truncate with an ellipsis so `text` measures ≤ maxWidth in ctx.font. */
export function ellipsize(ctx, text, maxWidth) {
  if (ctx.measureText(text).width <= maxWidth) return text
  let t = text
  while (t.length > 1 && ctx.measureText(`${t}…`).width > maxWidth) {
    t = t.slice(0, -1)
  }
  return `${t.trimEnd()}…`
}

/** YYYY-MM-DD from a date string or null → '' */
export function isoDay(date) {
  if (!date) return ''
  const d = new Date(date)
  if (Number.isNaN(d.getTime())) return String(date).slice(0, 10)
  return d.toISOString().slice(0, 10)
}

/** 1,383 → "1,383" with a thin-space-free thousands separator */
export function fmtInt(n) {
  return String(Math.round(n || 0)).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}
