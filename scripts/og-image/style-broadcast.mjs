/**
 * @file style-broadcast.mjs
 * @description House style 4, "Broadcast": EJ's stream/video graphics look.
 *   Black and white, Archivo Black title with a white halo (never a box),
 *   IBM Plex Mono lower-third with a hairline, kicker above. The field
 *   behind is a halftone: of the post's first Cloudinary image when there
 *   is one (network fetch, like render.mjs; a failed fetch falls back), or
 *   of a seeded noise/spotlight field when there isn't. Dot grid angle,
 *   spotlight and kicker vary by seed.
 */

import { createCanvas, loadImage } from '@napi-rs/canvas'
import { createNoise2D } from 'simplex-noise'
import { createRng, randRange, randPick } from './seed.mjs'
import { fitText, haloText, hairline, isoDay, fmtInt } from './text.mjs'

export const name = 'broadcast'

const WIDTH = 1200
const HEIGHT = 630
const MARGIN = 72

const DISPLAY = 'Archivo Black, Helvetica Neue, sans-serif'
const MONO = 'IBM Plex Mono, Menlo, monospace'

/** Fetch the first image as a grayscale 1200×630 cover crop, or null. */
async function loadHero(urls) {
  if (!urls || !urls.length) return null
  try {
    let url = urls[0].replace(/^http:\/\//i, 'https://')
    const parts = url.split('/upload/')
    if (parts.length === 2) {
      url = `${parts[0]}/upload/c_fill,w_600,h_315,f_jpg,q_auto,e_grayscale/${parts[1]}`
    }
    return await loadImage(url)
  } catch {
    return null
  }
}

/**
 * Halftone: sample a luminance function on a rotated grid and draw a
 * white dot per cell with radius ∝ brightness. `lum(x, y)` returns 0–1.
 */
function drawHalftone(ctx, lum, cell, angle, maxR, alpha) {
  const cos = Math.cos(angle)
  const sin = Math.sin(angle)
  const diag = Math.hypot(WIDTH, HEIGHT)
  ctx.fillStyle = `rgba(255,255,255,${alpha})`
  for (let v = -diag / 2; v < diag / 2; v += cell) {
    for (let u = -diag / 2; u < diag / 2; u += cell) {
      const x = WIDTH / 2 + u * cos - v * sin
      const y = HEIGHT / 2 + u * sin + v * cos
      if (x < -cell || x > WIDTH + cell || y < -cell || y > HEIGHT + cell)
        continue
      const l = lum(x, y)
      if (l <= 0.04) continue
      const r = Math.sqrt(l) * maxR
      ctx.beginPath()
      ctx.arc(x, y, r, 0, Math.PI * 2)
      ctx.fill()
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

  // ── Halftone field ────────────────────────────────────────────────────
  const hero = await loadHero(content.imageUrls)
  const angle = randRange(rng, -0.35, 0.35)
  const cell = randPick(rng, [7, 8, 9])
  const spotX = randRange(rng, WIDTH * 0.5, WIDTH * 0.9)
  const spotY = randRange(rng, HEIGHT * 0.1, HEIGHT * 0.5)
  const spotR = randRange(rng, 320, 520)

  let lum
  if (hero) {
    // Sample the photo's luminance from a small offscreen copy.
    const sw = 300
    const sh = 158
    const off = createCanvas(sw, sh)
    const octx = off.getContext('2d')
    octx.drawImage(hero, 0, 0, sw, sh)
    const px = octx.getImageData(0, 0, sw, sh).data
    lum = function photoLum(x, y) {
      const ix = Math.min(sw - 1, Math.max(0, Math.floor((x / WIDTH) * sw)))
      const iy = Math.min(sh - 1, Math.max(0, Math.floor((y / HEIGHT) * sh)))
      const i = (iy * sw + ix) * 4
      const l = px[i] / 255
      // Keep the lower-left (title zone) dark so the type wins.
      const fade = Math.min(1, Math.max(0, (x - WIDTH * 0.25) / (WIDTH * 0.45)))
      const vert = Math.min(
        1,
        Math.max(0, 1 - (y - HEIGHT * 0.35) / (HEIGHT * 0.45))
      )
      return l * l * (0.25 + 0.75 * fade) * (0.3 + 0.7 * vert)
    }
  } else {
    // Two spotlights + noise: soft discs that break into grain at their
    // edges, the second smaller and off to the side.
    const spot2X = randRange(rng, WIDTH * 0.05, WIDTH * 0.45)
    const spot2Y = randRange(rng, -HEIGHT * 0.1, HEIGHT * 0.35)
    const spot2R = spotR * randRange(rng, 0.45, 0.75)
    lum = function spotLum(x, y) {
      const d1 = Math.hypot(x - spotX, y - spotY) / spotR
      const d2 = Math.hypot(x - spot2X, y - spot2Y) / spot2R
      const disc = Math.max(Math.max(0, 1 - d1), Math.max(0, 1 - d2) * 0.7)
      const n = (noise(x * 0.004, y * 0.004) + 1) / 2
      return disc * disc * (0.4 + 0.6 * n)
    }
  }
  drawHalftone(ctx, lum, cell, angle, cell * 0.46, 0.85)

  // ── Kicker: first heading, else first tag, else the year ──────────────
  let kicker
  if (content.outline && content.outline.length) {
    kicker = randPick(rng, content.outline.slice(0, 3)).text
  } else if (content.tags && content.tags.length) {
    kicker = `#${content.tags[0]}`
  } else {
    kicker = isoDay(content.stats.date).slice(0, 4)
  }
  kicker = kicker.toUpperCase()

  // ── Title: Archivo Black, lower-third anchored, white halo ────────────
  const titleW = WIDTH - MARGIN * 2
  const title = fitText(
    ctx,
    content.title.toUpperCase(),
    (s) => `400 ${s}px ${DISPLAY}`,
    {
      maxWidth: titleW,
      maxLines: 3,
      maxSize: 112,
      minSize: 54,
    }
  )
  const lineH = title.size * 0.98
  const blockH = title.lines.length * lineH
  const lowerThirdY = HEIGHT - MARGIN - 8
  const titleBottom = lowerThirdY - 52
  const titleTop = titleBottom - blockH

  // Dark bed behind the type so the halftone can't fight it
  const bedTop = titleTop - 180
  const bed = ctx.createLinearGradient(0, bedTop, 0, HEIGHT)
  bed.addColorStop(0, 'rgba(0,0,0,0)')
  bed.addColorStop(0.4, 'rgba(0,0,0,0.88)')
  bed.addColorStop(1, 'rgba(0,0,0,0.95)')
  ctx.fillStyle = bed
  ctx.fillRect(0, bedTop, WIDTH, HEIGHT - bedTop)

  // Kicker with a short hairline lead
  ctx.font = `500 18px ${MONO}`
  ctx.letterSpacing = '4px'
  ctx.fillStyle = '#bdbdbd'
  hairline(
    ctx,
    MARGIN,
    titleTop - 26.5,
    MARGIN + 36,
    titleTop - 26.5,
    '#fff',
    2
  )
  ctx.fillText(kicker, MARGIN + 50, titleTop - 20)
  ctx.letterSpacing = '0px'

  ctx.font = `400 ${title.size}px ${DISPLAY}`
  let y = titleTop + title.size * 0.86
  for (const line of title.lines) {
    haloText(ctx, line, MARGIN - 3, y, {
      color: '#fff',
      haloColor: 'rgba(255,255,255,0.45)',
      blur: 36,
      passes: 2,
    })
    y += lineH
  }

  // ── Lower third ───────────────────────────────────────────────────────
  hairline(
    ctx,
    MARGIN,
    lowerThirdY - 30.5,
    WIDTH - MARGIN,
    lowerThirdY - 30.5,
    '#fff',
    1
  )
  ctx.font = `500 16px ${MONO}`
  ctx.letterSpacing = '2px'
  ctx.fillStyle = '#fff'
  ctx.fillText('●', MARGIN, lowerThirdY)
  ctx.fillStyle = '#e4e4e4'
  const parts = [
    'EJFOX.COM',
    isoDay(content.stats.date),
    `${fmtInt(content.stats.words)} WORDS`,
  ]
  ctx.fillText(parts.filter(Boolean).join('   //   '), MARGIN + 28, lowerThirdY)

  const tags = (content.tags || [])
    .slice(0, 3)
    .map((t) => `#${t.toUpperCase()}`)
    .join('  ')
  if (tags) {
    ctx.textAlign = 'right'
    ctx.fillStyle = '#8a8a8a'
    ctx.fillText(tags, WIDTH - MARGIN, lowerThirdY)
    ctx.textAlign = 'left'
  }
  ctx.letterSpacing = '0px'

  return canvas.toBuffer('image/png')
}
