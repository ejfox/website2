/**
 * Main renderer — composes 3D floating cards onto a canvas.
 * Uses pseudo-3D projection, depth of field, god rays, and dithering.
 */

import { createCanvas, loadImage } from '@napi-rs/canvas'
import { createNoise2D } from 'simplex-noise'
import { createRng } from './seed.mjs'
import { project3D, sortByDepth, depthBlur, perspectiveSkew } from './project.mjs'
import { ZINC, rgba, rgb } from './palette.mjs'
import { drawPixelText } from './font.mjs'
import { applyDither } from './dither.mjs'
import { applyGodRays } from './godrays.mjs'

const WIDTH = 1200
const HEIGHT = 630

/**
 * Render a complete OG image for a post.
 * @param {object} content - from extract.mjs
 * @param {object} scene - { cards, connections } from layout.mjs
 * @param {string} slug - for seeding noise
 * @param {number} variant - variant number (0-3) for reroll
 * @returns {Buffer} PNG buffer
 */
export async function renderScene(content, scene, slug, variant = 0) {
  const canvas = createCanvas(WIDTH, HEIGHT)
  const ctx = canvas.getContext('2d')
  const rng = createRng(`${slug}:${variant}`)
  const noise = createNoise2D(() => rng())

  // ----- Background -----
  ctx.fillStyle = rgb(ZINC.bg)
  ctx.fillRect(0, 0, WIDTH, HEIGHT)

  // Subtle noise texture on background
  const bgImageData = ctx.getImageData(0, 0, WIDTH, HEIGHT)
  for (let y = 0; y < HEIGHT; y += 2) {
    for (let x = 0; x < WIDTH; x += 2) {
      const n = noise(x * 0.002, y * 0.002) * 12
      const i = (y * WIDTH + x) * 4
      bgImageData.data[i] += n
      bgImageData.data[i + 1] += n
      bgImageData.data[i + 2] += n
      // Fill the 2x2 block
      if (x + 1 < WIDTH) {
        const i2 = (y * WIDTH + x + 1) * 4
        bgImageData.data[i2] += n; bgImageData.data[i2 + 1] += n; bgImageData.data[i2 + 2] += n
      }
      if (y + 1 < HEIGHT) {
        const i3 = ((y + 1) * WIDTH + x) * 4
        bgImageData.data[i3] += n; bgImageData.data[i3 + 1] += n; bgImageData.data[i3 + 2] += n
      }
    }
  }
  ctx.putImageData(bgImageData, 0, 0)

  // ----- Connections (thin lines between cards) -----
  const sortedCards = sortByDepth(scene.cards)

  // ----- Preload images from Cloudinary (monochrome thumbnails) -----
  const imageCache = new Map()
  for (const card of scene.cards) {
    if (card.type === 'image' && card.imageUrl) {
      try {
        // Get a small grayscale version via Cloudinary transforms
        let thumbUrl = card.imageUrl.replace(/^http:\/\//i, 'https://')
        const parts = thumbUrl.split('/upload/')
        if (parts.length === 2) {
          thumbUrl = `${parts[0]}/upload/c_fill,w_200,h_140,f_jpg,q_auto,e_grayscale/${parts[1]}`
        }
        const img = await loadImage(thumbUrl)
        imageCache.set(card.imageUrl, img)
      } catch {
        // Failed to load — will use placeholder
      }
    }
  }

  // ----- Connections (brighter, more visible) -----
  for (const conn of scene.connections) {
    const a = scene.cards[conn.from]
    const b = scene.cards[conn.to]
    const pa = project3D(a.x, a.y, a.z, WIDTH, HEIGHT)
    const pb = project3D(b.x, b.y, b.z, WIDTH, HEIGHT)
    const avgDepth = (a.z + b.z) / 2
    const alpha = Math.max(0.05, 0.2 - avgDepth * 0.04)

    ctx.beginPath()
    ctx.moveTo(pa.screenX, pa.screenY)
    ctx.lineTo(pb.screenX, pb.screenY)
    ctx.strokeStyle = rgba(ZINC.dim, alpha)
    ctx.lineWidth = 1
    ctx.stroke()
  }

  // ----- Render cards back to front, title LAST (always on top) -----
  const titleCards = sortedCards.filter(c => c.type === 'title')
  const otherCards = sortedCards.filter(c => c.type !== 'title')
  const renderOrder = [...otherCards, ...titleCards]

  for (const card of renderOrder) {
    const proj = project3D(card.x, card.y, card.z, WIDTH, HEIGHT)
    const w = card.width * proj.scale
    const h = card.height * proj.scale
    const cx = proj.screenX - w / 2
    const cy = proj.screenY - h / 2

    // Skip tiny or off-screen cards
    if (w < 15 || h < 8) continue
    if (cx + w < -50 || cx > WIDTH + 50 || cy + h < -50 || cy > HEIGHT + 50) continue

    ctx.save()

    // Perspective skew
    const skew = perspectiveSkew(card, proj)
    ctx.translate(proj.screenX, proj.screenY)
    ctx.rotate((card.rotation * Math.PI) / 180)
    ctx.transform(1, skew.skewX * 0.003, skew.skewX * 0.002, 1, 0, 0)
    ctx.translate(-proj.screenX, -proj.screenY)

    // Depth-based opacity — much higher floor so far cards stay readable
    const depthAlpha = Math.max(0.4, 1 - card.z * 0.12)

    // Tapered card shape
    const topW = w * skew.taperTop
    const botW = w * skew.taperBottom
    const topOffset = (w - topW) / 2
    const botOffset = (w - botW) / 2

    // Helper: draw card trapezoid path
    function cardPath(ox = 0, oy = 0) {
      ctx.beginPath()
      ctx.moveTo(cx + topOffset + ox, cy + oy)
      ctx.lineTo(cx + topOffset + topW + ox, cy + oy)
      ctx.lineTo(cx + botOffset + botW + ox, cy + h + oy)
      ctx.lineTo(cx + botOffset + ox, cy + h + oy)
      ctx.closePath()
    }

    // Only draw card backgrounds for image cards — text floats naked
    const drawCardBg = card.type === 'image'

    if (drawCardBg) {
      // Shadow
      ctx.fillStyle = rgba([0, 0, 0], 0.35 * depthAlpha)
      cardPath(6, 6)
      ctx.fill()

      // Card background
      const cardBrightness = Math.round(40 + (1 - card.z * 0.1) * 30)
      ctx.fillStyle = rgba([cardBrightness, cardBrightness, cardBrightness + 4], 0.95 * depthAlpha)
      cardPath()
      ctx.fill()

      // Card border
      ctx.strokeStyle = rgba([100, 100, 108], 0.6 * depthAlpha)
      ctx.lineWidth = 1
      ctx.stroke()
    }

    // Title gets just the red border, no fill
    if (card.importance >= 1.0) {
      ctx.strokeStyle = rgba(ZINC.accent, 0.5 * depthAlpha)
      ctx.lineWidth = 1
      cardPath()
      ctx.stroke()
    }

    // Card content — text needs to be BRIGHT
    const fontSize = Math.max(9, Math.round(13 * proj.scale))

    switch (card.type) {
      case 'title': {
        // Pixel font title — two lines if needed
        const charWidth = 6
        const pixelSize = 3
        const charsPerLine = Math.floor((w - 24) / (pixelSize * charWidth))
        const words = card.text.split(' ')
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
        const lineHeight = pixelSize * 9
        const startY = cy + h / 2 - (lines.length * lineHeight) / 2
        for (let li = 0; li < Math.min(lines.length, 3); li++) {
          drawPixelText(ctx, lines[li], cx + 12, startY + li * lineHeight, pixelSize, rgba(ZINC.accent, depthAlpha))
        }
        break
      }
      case 'heading': {
        ctx.font = `bold ${fontSize}px monospace`
        ctx.fillStyle = rgba([220, 220, 225], depthAlpha)
        ctx.fillText(card.text.slice(0, 30), cx + 8, cy + h / 2 + fontSize / 3)
        break
      }
      case 'quote': {
        // Left border accent line
        ctx.fillStyle = rgba([140, 140, 150], 0.7 * depthAlpha)
        ctx.fillRect(cx + 4, cy + 5, 2, h - 10)
        ctx.font = `italic ${Math.max(9, fontSize - 1)}px Georgia, serif`
        ctx.fillStyle = rgba([190, 190, 195], depthAlpha * 0.85)
        ctx.fillText(card.text.slice(0, 40), cx + 12, cy + h / 2 + fontSize / 3)
        break
      }
      case 'image': {
        const loadedImg = imageCache.get(card.imageUrl)
        if (loadedImg) {
          // Draw actual image, desaturated + dimmed to match scene
          ctx.globalAlpha = depthAlpha * 0.7
          ctx.drawImage(loadedImg, cx + 3, cy + 3, w - 6, h - 6)
          ctx.globalAlpha = 1
          // Dark overlay to reduce contrast and blend with scene
          ctx.fillStyle = rgba(ZINC.bg, 0.3)
          ctx.fillRect(cx + 3, cy + 3, w - 6, h - 6)
        } else {
          // Fallback: diagonal lines placeholder
          ctx.fillStyle = rgba([60, 60, 66], 0.5 * depthAlpha)
          ctx.fillRect(cx + 4, cy + 4, w - 8, h - 8)
          ctx.strokeStyle = rgba([90, 90, 96], 0.3 * depthAlpha)
          ctx.lineWidth = 0.5
          for (let d = 0; d < w + h; d += 14) {
            ctx.beginPath()
            ctx.moveTo(cx + 4 + d, cy + 4)
            ctx.lineTo(cx + 4, cy + 4 + d)
            ctx.stroke()
          }
        }
        break
      }
      case 'tag': {
        const tagFontSize = Math.max(8, Math.round(10 * proj.scale))
        ctx.font = `${tagFontSize}px monospace`
        ctx.fillStyle = rgba([160, 160, 170], depthAlpha * 0.9)
        ctx.fillText(`#${card.text}`, cx + 5, cy + h / 2 + tagFontSize / 3)
        break
      }
      case 'stats': {
        const statsFontSize = Math.max(8, Math.round(10 * proj.scale))
        ctx.font = `${statsFontSize}px monospace`
        ctx.fillStyle = rgba([120, 120, 130], depthAlpha * 0.7)
        ctx.fillText(card.text, cx + 5, cy + h / 2 + statsFontSize / 3)
        break
      }
    }

    ctx.restore()
  }

  // ----- Post-processing -----

  // God rays
  const lightX = 0.2 + rng() * 0.3 // seeded light position
  const lightY = 0.1 + rng() * 0.2
  const imgData = ctx.getImageData(0, 0, WIDTH, HEIGHT)
  applyGodRays(imgData, lightX, lightY, 0.10, 14, 0.96)

  // Dither pass
  applyDither(imgData, 0.20, ZINC.bg, ZINC.text)

  ctx.putImageData(imgData, 0, 0)

  // ----- Pixel font title (on top, unaffected by post-processing) -----
  // Small URL at bottom-right
  const url = `ejfox.com`
  drawPixelText(ctx, url, WIDTH - url.length * 18 - 16, HEIGHT - 30, 2, rgba(ZINC.dim, 0.5))

  return canvas.toBuffer('image/png')
}
