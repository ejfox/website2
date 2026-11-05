/**
 * @file render.mjs
 * @description Compose a layout.mjs scene into a 1200×630 OG PNG buffer with
 *   @napi-rs/canvas. Called by scripts/og-image/index.mjs. Network: fetches
 *   each image card from Cloudinary (resized + grayscaled via URL
 *   transform); a failed fetch just leaves an empty frame.
 *
 * Pipeline:
 *   1. Background (noise gradient)
 *   2. Grid floor (vanishing perspective lines)
 *   3. Connections (thin lines between cards)
 *   4. Cards back-to-front (images get frames, text floats naked);
 *      title cards drawn after all others so they stay on top
 *   5. Post-process: vignette → god rays → dither
 *   6. URL watermark
 */

import { createCanvas, loadImage } from '@napi-rs/canvas'
import { createNoise2D } from 'simplex-noise'
import { createRng } from './seed.mjs'
import { project3D, sortByDepth, perspectiveSkew } from './project.mjs'
import { ZINC, rgba, rgb } from './palette.mjs'
import { drawPixelText, measurePixelText } from './font.mjs'
import { applyDither } from './dither.mjs'
import { applyGodRays } from './godrays.mjs'

const WIDTH = 1200
const HEIGHT = 630

// ── Helpers ──────────────────────────────────────────────────────────────

/** Preload Cloudinary images as grayscale thumbnails */
async function preloadImages(cards) {
  const cache = new Map()
  const loads = cards
    .filter((c) => c.type === 'image' && c.imageUrl)
    .map(async (card) => {
      try {
        let url = card.imageUrl.replace(/^http:\/\//i, 'https://')
        // Splice a Cloudinary transform after /upload/ so we download a
        // small grayscale JPEG instead of the full-size original.
        const parts = url.split('/upload/')
        if (parts.length === 2) {
          url = `${parts[0]}/upload/c_fill,w_320,h_220,f_jpg,q_auto,e_grayscale/${parts[1]}`
        }
        cache.set(card.imageUrl, await loadImage(url))
      } catch {
        /* placeholder fallback */
      }
    })
  await Promise.all(loads)
  return cache
}

/** Draw card trapezoid path (perspective-tapered rectangle) */
function drawCardPath(ctx, cx, cy, w, h, skew, ox = 0, oy = 0) {
  const topW = w * skew.taperTop
  const botW = w * skew.taperBottom
  const topOff = (w - topW) / 2
  const botOff = (w - botW) / 2
  ctx.beginPath()
  ctx.moveTo(cx + topOff + ox, cy + oy)
  ctx.lineTo(cx + topOff + topW + ox, cy + oy)
  ctx.lineTo(cx + botOff + botW + ox, cy + h + oy)
  ctx.lineTo(cx + botOff + ox, cy + h + oy)
  ctx.closePath()
}

/** Word-wrap text into lines that fit a given char width */
function wordWrap(text, charsPerLine) {
  const words = text.split(' ')
  const lines = []
  let current = ''
  for (const word of words) {
    const test = current ? `${current} ${word}` : word
    if (test.length > charsPerLine && current) {
      lines.push(current)
      current = word
    } else {
      current = test
    }
  }
  if (current) lines.push(current)
  return lines
}

// ── Background ───────────────────────────────────────────────────────────

/**
 * Pure black, then a light source: a soft disc at the god-ray origin whose
 * gradient the Bayer pass later breaks into the classic 1-bit sun, plus
 * low-frequency noise so the falloff isn't a perfect circle.
 */
function renderBackground(ctx, noise, lightX, lightY) {
  ctx.fillStyle = '#000'
  ctx.fillRect(0, 0, WIDTH, HEIGHT)

  const lx = lightX * WIDTH
  const ly = lightY * HEIGHT
  const imgData = ctx.getImageData(0, 0, WIDTH, HEIGHT)
  const { data } = imgData
  const reach = WIDTH * 0.75
  for (let y = 0; y < HEIGHT; y += 2) {
    for (let x = 0; x < WIDTH; x += 2) {
      const d = Math.hypot(x - lx, y - ly) / reach
      const n = (noise(x * 0.0025, y * 0.0025) + 1) / 2
      const v = Math.max(0, 1 - d) ** 2.2 * (120 + 60 * n) + n * 14
      // Fill 2x2 block
      for (let dy = 0; dy < 2 && y + dy < HEIGHT; dy++) {
        for (let dx = 0; dx < 2 && x + dx < WIDTH; dx++) {
          const i = ((y + dy) * WIDTH + (x + dx)) * 4
          data[i] = v
          data[i + 1] = v
          data[i + 2] = v + 3
        }
      }
    }
  }
  ctx.putImageData(imgData, 0, 0)
}

/** Draw a subtle perspective grid on the floor to ground the scene */
function renderFloorGrid(ctx, rng) {
  const horizon = HEIGHT * 0.42
  const vanishX = WIDTH * (0.4 + rng() * 0.2)

  ctx.save()
  ctx.globalAlpha = 0.14

  // Horizontal lines receding into depth
  for (let i = 0; i < 20; i++) {
    const t = i / 20
    const y = horizon + (HEIGHT - horizon) * (t * t) // quadratic spacing
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(WIDTH, y)
    ctx.strokeStyle = rgb(ZINC.dim)
    ctx.lineWidth = 1 - t * 0.5
    ctx.stroke()
  }

  // Vertical lines converging to vanishing point
  for (let i = -8; i <= 8; i++) {
    const baseX = vanishX + i * 100
    ctx.beginPath()
    ctx.moveTo(vanishX, horizon)
    ctx.lineTo(baseX, HEIGHT + 50)
    ctx.strokeStyle = rgb(ZINC.dim)
    ctx.lineWidth = 0.5
    ctx.stroke()
  }

  ctx.restore()
}

// ── Connections ──────────────────────────────────────────────────────────

function renderConnections(ctx, cards, connections) {
  for (const conn of connections) {
    const a = cards[conn.from]
    const b = cards[conn.to]
    const pa = project3D(a.x, a.y, a.z, WIDTH, HEIGHT)
    const pb = project3D(b.x, b.y, b.z, WIDTH, HEIGHT)
    const avgZ = (a.z + b.z) / 2
    const alpha = Math.max(0.03, 0.15 - avgZ * 0.04)

    ctx.beginPath()
    ctx.moveTo(pa.screenX, pa.screenY)
    ctx.lineTo(pb.screenX, pb.screenY)
    ctx.strokeStyle = rgba(ZINC.dim, alpha)
    ctx.lineWidth = 0.8
    ctx.setLineDash([4, 8])
    ctx.stroke()
    ctx.setLineDash([])
  }
}

// ── Card renderers (one per type) ────────────────────────────────────────

const cardRenderers = {
  title(ctx, card, cx, cy, w, h, proj, depthAlpha, skew, imageCache, pass) {
    // Bitmap font, as large as fits in three lines (pixelSize 8 → 56px
    // caps, down to 4 → 28px). Two passes: 'halo' draws the dark pad and
    // light bloom before the dither (so they break into halftone), 'glyphs'
    // draws the letters after it so they stay crisp. No box, no color.
    let pixelSize = 8
    let lines = []
    while (pixelSize >= 4) {
      const charsPerLine = Math.floor(w / (pixelSize * 6))
      lines = wordWrap(card.text, charsPerLine)
      const widest = Math.max(...lines.map((l) => l.length))
      if (lines.length <= 3 && widest <= charsPerLine) break
      pixelSize -= 1
    }
    lines = lines.slice(0, 3)
    const lineHeight = pixelSize * 9
    const blockH = lines.length * lineHeight
    const startY = cy + h / 2 - blockH / 2
    const midX = cx + w / 2
    const midY = cy + h / 2

    if (pass === 'halo') {
      // Dark pad first so a bright photo behind can't eat the glyphs, then
      // the light bloom on top of it.
      // An ellipse of near-black under the glyphs, with the bloom pushed
      // out to a ring around it: after the dither that reads as black
      // type-bed with a halftone glow at its edge.
      ctx.save()
      ctx.translate(midX, midY)
      ctx.scale(1, (blockH + 90) / (w * 0.7))
      const r = w * 0.7
      const shade = ctx.createRadialGradient(0, 0, 0, 0, 0, r)
      shade.addColorStop(0, 'rgba(0,0,0,0.97)')
      shade.addColorStop(0.55, 'rgba(0,0,0,0.92)')
      shade.addColorStop(0.8, 'rgba(0,0,0,0.4)')
      shade.addColorStop(1, 'rgba(0,0,0,0)')
      ctx.fillStyle = shade
      ctx.fillRect(-r, -r, r * 2, r * 2)
      const ring = ctx.createRadialGradient(0, 0, r * 0.5, 0, 0, r)
      ring.addColorStop(0, 'rgba(255,255,255,0)')
      ring.addColorStop(0.35, 'rgba(255,255,255,0.45)')
      ring.addColorStop(0.7, 'rgba(255,255,255,0.1)')
      ring.addColorStop(1, 'rgba(255,255,255,0)')
      ctx.fillStyle = ring
      ctx.fillRect(-r, -r, r * 2, r * 2)
      ctx.restore()
      return
    }

    for (let i = 0; i < lines.length; i++) {
      const lineW = measurePixelText(lines[i], pixelSize)
      drawPixelText(
        ctx,
        lines[i],
        midX - lineW / 2,
        startY + i * lineHeight,
        pixelSize,
        '#fff'
      )
    }
  },

  line(ctx, card, cx, cy, w, h, proj, depthAlpha) {
    // A sentence from the post, far back: texture, not reading matter.
    const fontSize = Math.max(11, Math.round(16 * proj.scale))
    ctx.font = `${fontSize}px Georgia, serif`
    ctx.fillStyle = rgba([255, 255, 255], 0.55 + depthAlpha * 0.3)
    ctx.fillText(card.text.slice(0, 70), cx + 4, cy + h / 2 + fontSize / 3)
  },

  heading(ctx, card, cx, cy, w, h, proj, depthAlpha) {
    const fontSize = Math.max(13, Math.round(26 * proj.scale))
    ctx.font = `700 ${fontSize}px IBM Plex Mono, Menlo, monospace`
    ctx.fillStyle = rgba([255, 255, 255], 0.92)
    ctx.fillText(card.text.slice(0, 32), cx + 4, cy + h / 2 + fontSize / 3)
  },

  quote(ctx, card, cx, cy, w, h, proj, depthAlpha) {
    const fontSize = Math.max(11, Math.round(16 * proj.scale))
    // Hairline lead instead of a bar
    ctx.fillStyle = rgba([200, 200, 208], 0.8 * depthAlpha)
    ctx.fillRect(cx + 2, cy + h / 2, 1, h / 2 - 4)
    // Italic text
    ctx.font = `italic ${fontSize}px Georgia, serif`
    ctx.fillStyle = rgba([255, 255, 255], 0.9)
    ctx.fillText(card.text.slice(0, 45), cx + 10, cy + h / 2 + fontSize / 3)
  },

  image(ctx, card, cx, cy, w, h, proj, depthAlpha, skew, imageCache) {
    // The photo itself is the card: no frame, no border. A failed fetch
    // draws nothing rather than an empty box.
    const img = imageCache.get(card.imageUrl)
    if (!img) return

    // Drop shadow so it lifts off the wall
    ctx.fillStyle = rgba([0, 0, 0], 0.45 * depthAlpha)
    drawCardPath(ctx, cx, cy, w, h, skew, 6, 8)
    ctx.fill()

    ctx.save()
    drawCardPath(ctx, cx, cy, w, h, skew)
    ctx.clip()
    ctx.globalAlpha = depthAlpha * 0.8
    ctx.drawImage(img, cx, cy, w, h)
    ctx.globalAlpha = 1
    // Dark veil to blend into scene and keep photos below the title
    ctx.fillStyle = 'rgba(0,0,0,0.4)'
    ctx.fillRect(cx, cy, w, h)
    ctx.restore()
  },

  tag(ctx, card, cx, cy, w, h, proj, depthAlpha) {
    const fontSize = Math.max(10, Math.round(14 * proj.scale))
    ctx.font = `${fontSize}px IBM Plex Mono, Menlo, monospace`
    ctx.fillStyle = rgba([255, 255, 255], 0.88)
    ctx.fillText(`#${card.text}`, cx + 3, cy + h / 2 + fontSize / 3)
  },

  stats(ctx, card, cx, cy, w, h, proj, depthAlpha) {
    const fontSize = Math.max(9, Math.round(12 * proj.scale))
    ctx.font = `${fontSize}px IBM Plex Mono, Menlo, monospace`
    ctx.fillStyle = rgba([255, 255, 255], 0.8)
    ctx.fillText(card.text, cx + 3, cy + h / 2 + fontSize / 3)
  },
}

// ── Post-processing ──────────────────────────────────────────────────────

/** Subtle vignette darkening at edges */
function applyVignette(ctx) {
  const gradient = ctx.createRadialGradient(
    WIDTH / 2,
    HEIGHT / 2,
    HEIGHT * 0.3,
    WIDTH / 2,
    HEIGHT / 2,
    WIDTH * 0.7
  )
  gradient.addColorStop(0, 'rgba(0,0,0,0)')
  gradient.addColorStop(1, 'rgba(0,0,0,0.4)')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, WIDTH, HEIGHT)
}

// ── Main render ──────────────────────────────────────────────────────────

/**
 * @param {object} content - from extract.mjs
 * @param {object} scene - from layout.mjs
 * @param {string} seed - the full seed string (slug + batch + slot), so a
 *   reroll moves the light and the background noise, not just the cards
 */
export async function renderScene(content, scene, seed) {
  const canvas = createCanvas(WIDTH, HEIGHT)
  const ctx = canvas.getContext('2d')
  const rng = createRng(`${seed}:render`)
  const noise = createNoise2D(() => rng())

  // The light sits high, either side; the background sun and the god
  // rays share it so the rays stream from something visible.
  let lightX = 0.1 + rng() * 0.3
  if (rng() > 0.5) lightX = 1 - lightX
  const lightY = 0.05 + rng() * 0.3

  // 1. Background
  renderBackground(ctx, noise, lightX, lightY)

  // 2. Floor grid
  renderFloorGrid(ctx, rng)

  // 3. Preload images
  const imageCache = await preloadImages(scene.cards)

  // 4. Connections
  renderConnections(ctx, scene.cards, scene.connections)

  // 5. Cards (back to front, title last)
  const sorted = sortByDepth(scene.cards)
  const titleCards = sorted.filter((c) => c.type === 'title')
  const otherCards = sorted.filter((c) => c.type !== 'title')

  /** Project, transform and draw one card; `pass` only matters to titles. */
  function drawCard(card, pass) {
    const proj = project3D(card.x, card.y, card.z, WIDTH, HEIGHT)
    const w = card.width * proj.scale
    const h = card.height * proj.scale
    const cx = proj.screenX - w / 2
    const cy = proj.screenY - h / 2

    // Skip cards too small to read or fully off-canvas (80px slack for
    // rotation/skew pushing corners back in).
    if (w < 12 || h < 6) return
    if (cx + w < -80 || cx > WIDTH + 80 || cy + h < -80 || cy > HEIGHT + 80)
      return

    ctx.save()

    const skew = perspectiveSkew(card, proj)
    ctx.translate(proj.screenX, proj.screenY)
    ctx.rotate((card.rotation * Math.PI) / 180)
    ctx.transform(1, skew.skewX * 0.003, skew.skewX * 0.002, 1, 0, 0)
    ctx.translate(-proj.screenX, -proj.screenY)

    const depthAlpha = Math.max(0.5, 1 - card.z * 0.12)
    const renderer = cardRenderers[card.type]
    if (renderer) {
      renderer(ctx, card, cx, cy, w, h, proj, depthAlpha, skew, imageCache, pass)
    }

    ctx.restore()
  }

  for (const card of otherCards) drawCard(card, 'full')
  for (const card of titleCards) drawCard(card, 'halo')

  // 6. Post-processing
  applyVignette(ctx)

  // Rays stream from the light; the dither at 0.9 pushes the whole frame
  // toward 1-bit (the sun becomes a Bayer halftone). Title glyphs are
  // drawn after, crisp.
  const imgData = ctx.getImageData(0, 0, WIDTH, HEIGHT)
  applyGodRays(imgData, lightX, lightY, 0.22, 18, 0.96)
  applyDither(imgData, 0.9, [0, 0, 0], [255, 255, 255])
  ctx.putImageData(imgData, 0, 0)

  for (const card of titleCards) drawCard(card, 'glyphs')

  // 7. URL watermark, 16px from the right edge. Width comes from the font
  // (6px advance × pixelSize 2 = 12px/char); the old `9 * 18` assumed 18px
  // per char and sat the mark ~54px further left than intended.
  drawPixelText(
    ctx,
    'ejfox.com',
    WIDTH - measurePixelText('ejfox.com', 2) - 16,
    HEIGHT - 28,
    2,
    'rgba(255,255,255,0.6)'
  )

  return canvas.toBuffer('image/png')
}
