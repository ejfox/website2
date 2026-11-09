/**
 * @file style-vulpes.mjs
 * @description House style 3, "Vulpes": EJ's terminal identity. OLED black,
 *   single-hue pink/magenta with ±7° hue drift, teal as the one second hue
 *   (one datum only), IBM Plex Mono. A flow field of glyph streams built
 *   from the post's own sentences runs through the frame; the title sits
 *   in it with a pink halo under a shell prompt; a status line closes it
 *   like tmux. Scanlines on top. Palette: ~/code/vulpes-devices/shared/
 *   palette.js (copied here so the generator has no outside imports).
 */

import { createCanvas } from '@napi-rs/canvas'
import { createNoise2D } from 'simplex-noise'
import { createRng, randRange, randPick } from './seed.mjs'
import { fitText, haloText, hairline, isoDay, fmtInt } from './text.mjs'

export const name = 'vulpes'

const WIDTH = 1200
const HEIGHT = 630
const MARGIN = 72

// vulpes palette (dark) — the signature pink family + the one teal.
const V = {
  bg: '#000000',
  fg: '#f2cfdf',
  fgDim: '#c490a8',
  fgDark: '#735865',
  base: '#e60067',
  bright: '#ff277d',
  teal: '#6eedf7',
}

const MONO = 'IBM Plex Mono, Menlo, monospace'

// #e60067 is hue ~333°. Streams drift ±7° around it, never further.
const BASE_HUE = 333

function pink(hueOffset, light, alpha) {
  return `hsla(${BASE_HUE + hueOffset}, 100%, ${light}%, ${alpha})`
}

/**
 * Glyph flow field: `count` streams start at seeded points and step
 * through a simplex angle field, stamping one character per step from a
 * sentence of the post. Streams fade with age and steer around the title
 * band so the type stays clean. Bounded: count × steps glyph draws.
 */
function drawGlyphField(ctx, rng, noise, pool, avoid, count, steps) {
  ctx.font = `500 13px ${MONO}`
  ctx.textBaseline = 'middle'
  ctx.textAlign = 'center'
  const scale = 0.0022
  for (let s = 0; s < count; s++) {
    const text = randPick(rng, pool)
    let x = randRange(rng, -40, WIDTH + 40)
    let y = randRange(rng, -40, HEIGHT + 40)
    const hue = randRange(rng, -7, 7)
    const light = randRange(rng, 38, 56)
    const strength = randRange(rng, 0.35, 1)
    const step = randRange(rng, 11, 15)
    for (let i = 0; i < steps; i++) {
      const a = noise(x * scale, y * scale) * Math.PI * 2
      x += Math.cos(a) * step
      y += Math.sin(a) * step
      if (x < -20 || x > WIDTH + 20 || y < -20 || y > HEIGHT + 20) break
      const inBand = avoid.some(
        (a) => y > a.top && y < a.bottom && x > a.left && x < a.right
      )
      if (inBand) continue
      const age = 1 - i / steps
      const ch = text[(i + s) % text.length]
      if (ch === ' ') continue
      ctx.fillStyle = pink(hue, light, 0.12 + 0.55 * age * strength)
      ctx.fillText(ch, x, y)
    }
  }
  ctx.textAlign = 'left'
  ctx.textBaseline = 'alphabetic'
}

/** CRT scanlines: every third row pulled toward black. */
function applyScanlines(ctx) {
  ctx.fillStyle = 'rgba(0,0,0,0.22)'
  for (let y = 0; y < HEIGHT; y += 3) ctx.fillRect(0, y, WIDTH, 1)
}

export async function render(content, seed) {
  const canvas = createCanvas(WIDTH, HEIGHT)
  const ctx = canvas.getContext('2d')
  const rng = createRng(seed)
  const noise = createNoise2D(() => rng())

  ctx.fillStyle = V.bg
  ctx.fillRect(0, 0, WIDTH, HEIGHT)

  const slugName = content.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
  const year = isoDay(content.stats.date).slice(0, 4) || 'blog'

  // ── Title block, measured first so the field can avoid it ─────────────
  const titleMaxW = WIDTH - MARGIN * 2
  const title = fitText(ctx, content.title, (s) => `700 ${s}px ${MONO}`, {
    maxWidth: titleMaxW,
    maxLines: 3,
    maxSize: 72,
    minSize: 40,
  })
  const lineH = title.size * 1.12
  const blockH = title.lines.length * lineH
  // Title band vertical placement: upper, centered or lower by seed
  const anchor = randPick(rng, [0.36, 0.48, 0.58])
  const titleTop = HEIGHT * anchor - blockH / 2
  const avoid = [
    {
      top: titleTop - 56,
      bottom: titleTop + blockH + 20,
      left: MARGIN - 30,
      right:
        MARGIN +
        Math.max(...title.lines.map((l) => ctx.measureText(l).width)) +
        30,
    },
    // the status line
    {
      top: HEIGHT - MARGIN - 30,
      bottom: HEIGHT - MARGIN + 24,
      left: MARGIN - 20,
      right: WIDTH - MARGIN + 20,
    },
  ]

  // ── Glyph field from the post's own words ─────────────────────────────
  let pool = [...(content.sentences || []), ...(content.headings || [])]
  if (!pool.length) pool = [content.title]
  const streams = Math.round(randRange(rng, 110, 170))
  drawGlyphField(ctx, rng, noise, pool, avoid, streams, 48)

  // A pink bloom low in the frame, like a phosphor glow off the field
  const gx = randRange(rng, WIDTH * 0.2, WIDTH * 0.8)
  const glow = ctx.createRadialGradient(
    gx,
    HEIGHT + 60,
    0,
    gx,
    HEIGHT + 60,
    HEIGHT * 0.7
  )
  glow.addColorStop(0, pink(0, 45, 0.28))
  glow.addColorStop(1, pink(0, 45, 0))
  ctx.fillStyle = glow
  ctx.fillRect(0, 0, WIDTH, HEIGHT)

  // ── Prompt line ───────────────────────────────────────────────────────
  ctx.font = `400 17px ${MONO}`
  ctx.fillStyle = V.fgDim
  const cmd = randPick(rng, ['cat', 'bat', 'less', 'glow'])
  const prompt = `ejfox@vulpes:~/blog/${year} $ ${cmd} ${slugName}.md`
  ctx.fillText(prompt, MARGIN, titleTop - 22)

  // ── Title: fg pink-white with a magenta halo, teal cursor after it ────
  ctx.font = `700 ${title.size}px ${MONO}`
  let y = titleTop + title.size * 0.9
  for (let i = 0; i < title.lines.length; i++) {
    haloText(ctx, title.lines[i], MARGIN, y, {
      color: V.fg,
      haloColor: 'rgba(230,0,103,0.55)',
      blur: 28,
      passes: 2,
    })
    if (i === title.lines.length - 1) {
      // The one teal datum: the cursor
      const w = ctx.measureText(title.lines[i]).width
      ctx.fillStyle = V.teal
      ctx.fillRect(
        MARGIN + w + title.size * 0.2,
        y - title.size * 0.78,
        title.size * 0.5,
        title.size * 0.9
      )
    }
    y += lineH
  }

  // ── Status line (tmux) ────────────────────────────────────────────────
  const sy = HEIGHT - MARGIN + 10
  hairline(ctx, MARGIN, sy - 26.5, WIDTH - MARGIN, sy - 26.5, V.base, 1)
  ctx.font = `500 15px ${MONO}`
  let sx = MARGIN
  function seg(glyph, text, color) {
    ctx.fillStyle = V.bright
    ctx.fillText(glyph, sx, sy)
    sx += ctx.measureText(glyph).width + 10
    ctx.fillStyle = color
    ctx.fillText(text, sx, sy)
    sx += ctx.measureText(text).width + 34
  }
  seg('◆', isoDay(content.stats.date) || 'draft', V.fg)
  seg('◇', `${fmtInt(content.stats.words)} words`, V.fgDim)
  if (content.outline && content.outline.length) {
    seg('○', `${content.outline.length} sections`, V.fgDim)
  }
  const tags = (content.tags || []).map((t) => `#${t}`).join(' ')
  if (tags) {
    ctx.fillStyle = V.fgDark
    const maxW = WIDTH - MARGIN - sx
    if (ctx.measureText(tags).width < maxW) ctx.fillText(tags, sx, sy)
  }
  ctx.fillStyle = V.fgDim
  ctx.textAlign = 'right'
  ctx.fillText('ejfox.com', WIDTH - MARGIN, sy)
  ctx.textAlign = 'left'

  applyScanlines(ctx)

  return canvas.toBuffer('image/png')
}
