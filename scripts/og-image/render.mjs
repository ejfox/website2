/**
 * Main renderer — composes floating content cards in a 3D room onto a canvas.
 *
 * Pipeline:
 *   1. Background (noise gradient)
 *   2. Grid floor (vanishing perspective lines)
 *   3. Connections (thin lines between cards)
 *   4. Cards back-to-front (images get frames, text floats naked)
 *   5. Title (always last, always on top)
 *   6. Post-process: god rays → dither → vignette
 *   7. URL watermark
 */

import { createCanvas, loadImage } from '@napi-rs/canvas'
import { createNoise2D } from 'simplex-noise'
import { createRng } from './seed.mjs'
import { project3D, sortByDepth, perspectiveSkew } from './project.mjs'
import { ZINC, rgba, rgb } from './palette.mjs'
import { drawPixelText } from './font.mjs'
import { applyDither } from './dither.mjs'
import { applyGodRays } from './godrays.mjs'

const WIDTH = 1200
const HEIGHT = 630

// ── Helpers ──────────────────────────────────────────────────────────────

/** Preload Cloudinary images as grayscale thumbnails */
async function preloadImages(cards) {
  const cache = new Map()
  const loads = cards
    .filter(c => c.type === 'image' && c.imageUrl)
    .map(async (card) => {
      try {
        let url = card.imageUrl.replace(/^http:\/\//i, 'https://')
        const parts = url.split('/upload/')
        if (parts.length === 2) {
          url = `${parts[0]}/upload/c_fill,w_320,h_220,f_jpg,q_auto,e_grayscale/${parts[1]}`
        }
        cache.set(card.imageUrl, await loadImage(url))
      } catch { /* placeholder fallback */ }
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

function renderBackground(ctx, noise) {
  ctx.fillStyle = rgb(ZINC.bg)
  ctx.fillRect(0, 0, WIDTH, HEIGHT)

  // Subtle large-scale noise gradient
  const imgData = ctx.getImageData(0, 0, WIDTH, HEIGHT)
  const { data } = imgData
  for (let y = 0; y < HEIGHT; y += 2) {
    for (let x = 0; x < WIDTH; x += 2) {
      const n = noise(x * 0.002, y * 0.002) * 10
      // Fill 2x2 block
      for (let dy = 0; dy < 2 && y + dy < HEIGHT; dy++) {
        for (let dx = 0; dx < 2 && x + dx < WIDTH; dx++) {
          const i = ((y + dy) * WIDTH + (x + dx)) * 4
          data[i] += n
          data[i + 1] += n
          data[i + 2] += n
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
  ctx.globalAlpha = 0.06

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
  title(ctx, card, cx, cy, w, h, proj, depthAlpha, skew) {
    // Red border outline only (no fill)
    ctx.strokeStyle = rgba(ZINC.accent, 0.6 * depthAlpha)
    ctx.lineWidth = 1.5
    drawCardPath(ctx, cx, cy, w, h, skew)
    ctx.stroke()

    // Pixel font — word wrap to fit
    const pixelSize = 3
    const charWidth = pixelSize * 6
    const charsPerLine = Math.floor((w - 24) / charWidth)
    const lines = wordWrap(card.text, charsPerLine)
    const lineHeight = pixelSize * 9
    const startY = cy + h / 2 - (Math.min(lines.length, 3) * lineHeight) / 2
    for (let i = 0; i < Math.min(lines.length, 3); i++) {
      drawPixelText(ctx, lines[i], cx + 12, startY + i * lineHeight, pixelSize, rgba(ZINC.accent, depthAlpha))
    }
  },

  heading(ctx, card, cx, cy, w, h, proj, depthAlpha) {
    const fontSize = Math.max(10, Math.round(14 * proj.scale))
    ctx.font = `bold ${fontSize}px monospace`
    ctx.fillStyle = rgba([210, 210, 218], depthAlpha * 0.9)
    ctx.fillText(card.text.slice(0, 32), cx + 4, cy + h / 2 + fontSize / 3)
  },

  quote(ctx, card, cx, cy, w, h, proj, depthAlpha) {
    const fontSize = Math.max(9, Math.round(12 * proj.scale))
    // Accent bar
    ctx.fillStyle = rgba(ZINC.dim, 0.6 * depthAlpha)
    ctx.fillRect(cx + 2, cy + 4, 2, h - 8)
    // Italic text
    ctx.font = `italic ${fontSize}px Georgia, serif`
    ctx.fillStyle = rgba([185, 185, 192], depthAlpha * 0.8)
    ctx.fillText(card.text.slice(0, 45), cx + 10, cy + h / 2 + fontSize / 3)
  },

  image(ctx, card, cx, cy, w, h, proj, depthAlpha, skew, imageCache) {
    // Frame shadow
    ctx.fillStyle = rgba([0, 0, 0], 0.4 * depthAlpha)
    drawCardPath(ctx, cx, cy, w, h, skew, 5, 5)
    ctx.fill()

    // Frame background
    ctx.fillStyle = rgba([45, 45, 50], 0.95 * depthAlpha)
    drawCardPath(ctx, cx, cy, w, h, skew)
    ctx.fill()

    // Frame border
    ctx.strokeStyle = rgba([85, 85, 92], 0.7 * depthAlpha)
    ctx.lineWidth = 1
    ctx.stroke()

    // Actual image
    const img = imageCache.get(card.imageUrl)
    if (img) {
      ctx.save()
      drawCardPath(ctx, cx, cy, w, h, skew)
      ctx.clip()
      ctx.globalAlpha = depthAlpha * 0.75
      ctx.drawImage(img, cx + 2, cy + 2, w - 4, h - 4)
      ctx.globalAlpha = 1
      // Dark veil to blend into scene
      ctx.fillStyle = rgba(ZINC.bg, 0.2)
      ctx.fillRect(cx, cy, w, h)
      ctx.restore()
    }
  },

  tag(ctx, card, cx, cy, w, h, proj, depthAlpha) {
    const fontSize = Math.max(8, Math.round(11 * proj.scale))
    ctx.font = `${fontSize}px monospace`
    ctx.fillStyle = rgba([150, 150, 160], depthAlpha * 0.85)
    ctx.fillText(`#${card.text}`, cx + 3, cy + h / 2 + fontSize / 3)
  },

  stats(ctx, card, cx, cy, w, h, proj, depthAlpha) {
    const fontSize = Math.max(8, Math.round(10 * proj.scale))
    ctx.font = `${fontSize}px monospace`
    ctx.fillStyle = rgba([110, 110, 120], depthAlpha * 0.6)
    ctx.fillText(card.text, cx + 3, cy + h / 2 + fontSize / 3)
  },
}

// ── Post-processing ──────────────────────────────────────────────────────

/** Subtle vignette darkening at edges */
function applyVignette(ctx) {
  const gradient = ctx.createRadialGradient(
    WIDTH / 2, HEIGHT / 2, HEIGHT * 0.3,
    WIDTH / 2, HEIGHT / 2, WIDTH * 0.7
  )
  gradient.addColorStop(0, 'rgba(0,0,0,0)')
  gradient.addColorStop(1, 'rgba(0,0,0,0.4)')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, WIDTH, HEIGHT)
}

// ── Main render ──────────────────────────────────────────────────────────

export async function renderScene(content, scene, slug, variant = 0) {
  const canvas = createCanvas(WIDTH, HEIGHT)
  const ctx = canvas.getContext('2d')
  const rng = createRng(`${slug}:${variant}`)
  const noise = createNoise2D(() => rng())

  // 1. Background
  renderBackground(ctx, noise)

  // 2. Floor grid
  renderFloorGrid(ctx, rng)

  // 3. Preload images
  const imageCache = await preloadImages(scene.cards)

  // 4. Connections
  renderConnections(ctx, scene.cards, scene.connections)

  // 5. Cards (back to front, title last)
  const sorted = sortByDepth(scene.cards)
  const titleCards = sorted.filter(c => c.type === 'title')
  const otherCards = sorted.filter(c => c.type !== 'title')
  const renderOrder = [...otherCards, ...titleCards]

  for (const card of renderOrder) {
    const proj = project3D(card.x, card.y, card.z, WIDTH, HEIGHT)
    const w = card.width * proj.scale
    const h = card.height * proj.scale
    const cx = proj.screenX - w / 2
    const cy = proj.screenY - h / 2

    if (w < 12 || h < 6) continue
    if (cx + w < -80 || cx > WIDTH + 80 || cy + h < -80 || cy > HEIGHT + 80) continue

    ctx.save()

    const skew = perspectiveSkew(card, proj)
    ctx.translate(proj.screenX, proj.screenY)
    ctx.rotate((card.rotation * Math.PI) / 180)
    ctx.transform(1, skew.skewX * 0.003, skew.skewX * 0.002, 1, 0, 0)
    ctx.translate(-proj.screenX, -proj.screenY)

    const depthAlpha = Math.max(0.35, 1 - card.z * 0.15)
    const renderer = cardRenderers[card.type]
    if (renderer) {
      renderer(ctx, card, cx, cy, w, h, proj, depthAlpha, skew, imageCache)
    }

    ctx.restore()
  }

  // 6. Post-processing
  applyVignette(ctx)

  const imgData = ctx.getImageData(0, 0, WIDTH, HEIGHT)
  const lightX = 0.15 + rng() * 0.35
  const lightY = 0.05 + rng() * 0.25
  applyGodRays(imgData, lightX, lightY, 0.12, 16, 0.96)
  applyDither(imgData, 0.18, ZINC.bg, ZINC.text)
  ctx.putImageData(imgData, 0, 0)

  // 7. URL watermark
  drawPixelText(ctx, 'ejfox.com', WIDTH - 9 * 18 - 16, HEIGHT - 28, 2, rgba(ZINC.dim, 0.4))

  return canvas.toBuffer('image/png')
}
