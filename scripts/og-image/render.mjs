/**
 * Main renderer — composes 3D floating cards onto a canvas.
 * Uses pseudo-3D projection, depth of field, god rays, and dithering.
 */

import { createCanvas } from '@napi-rs/canvas'
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
      const n = noise(x * 0.06, y * 0.06) * 18
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

  for (const conn of scene.connections) {
    const a = scene.cards[conn.from]
    const b = scene.cards[conn.to]
    const pa = project3D(a.x, a.y, a.z, WIDTH, HEIGHT)
    const pb = project3D(b.x, b.y, b.z, WIDTH, HEIGHT)
    const avgDepth = (a.z + b.z) / 2
    const alpha = Math.max(0.02, 0.12 - avgDepth * 0.03)

    ctx.beginPath()
    ctx.moveTo(pa.screenX, pa.screenY)
    ctx.lineTo(pb.screenX, pb.screenY)
    ctx.strokeStyle = rgba(ZINC.dim, alpha)
    ctx.lineWidth = 0.5
    ctx.stroke()
  }

  // ----- Render cards back to front -----
  for (const card of sortedCards) {
    const proj = project3D(card.x, card.y, card.z, WIDTH, HEIGHT)
    const w = card.width * proj.scale
    const h = card.height * proj.scale
    const cx = proj.screenX - w / 2
    const cy = proj.screenY - h / 2
    const blur = depthBlur(card.z)

    // Skip if off-screen
    if (cx + w < -50 || cx > WIDTH + 50 || cy + h < -50 || cy > HEIGHT + 50) continue

    ctx.save()

    // Perspective skew
    const skew = perspectiveSkew(card, proj)

    ctx.translate(proj.screenX, proj.screenY)
    ctx.rotate((card.rotation * Math.PI) / 180)
    // Apply horizontal skew for 3D tilt effect
    ctx.transform(1, skew.skewX * 0.003, skew.skewX * 0.002, 1, 0, 0)
    ctx.translate(-proj.screenX, -proj.screenY)

    // Depth-based opacity (far cards fade more aggressively)
    const depthAlpha = Math.max(0.08, 1 - card.z * 0.25)

    // Tapered card shape (trapezoid for perspective)
    const topW = w * skew.taperTop
    const botW = w * skew.taperBottom
    const topOffset = (w - topW) / 2
    const botOffset = (w - botW) / 2

    // Card shadow
    ctx.fillStyle = rgba([0, 0, 0], 0.2 * depthAlpha)
    ctx.beginPath()
    ctx.moveTo(cx + topOffset + 4, cy + 4)
    ctx.lineTo(cx + topOffset + topW + 4, cy + 4)
    ctx.lineTo(cx + botOffset + botW + 4, cy + h + 4)
    ctx.lineTo(cx + botOffset + 4, cy + h + 4)
    ctx.closePath()
    ctx.fill()

    // Card background (trapezoid)
    ctx.fillStyle = rgba(ZINC.card, 0.85 * depthAlpha)
    ctx.beginPath()
    ctx.moveTo(cx + topOffset, cy)
    ctx.lineTo(cx + topOffset + topW, cy)
    ctx.lineTo(cx + botOffset + botW, cy + h)
    ctx.lineTo(cx + botOffset, cy + h)
    ctx.closePath()
    ctx.fill()

    // Card border — red for the title, zinc for everything else
    if (card.importance >= 1.0) {
      ctx.strokeStyle = rgba(ZINC.accent, 0.7 * depthAlpha)
      ctx.lineWidth = 1.5
    } else {
      ctx.strokeStyle = rgba(ZINC.cardBorder, 0.5 * depthAlpha)
      ctx.lineWidth = 0.5
    }
    ctx.stroke()

    // Card content
    const textAlpha = depthAlpha
    const fontSize = Math.max(8, Math.round(12 * proj.scale))

    switch (card.type) {
      case 'title': {
        // Pixel font for title — red accent
        const pixelSize = Math.max(2, Math.round(3 * proj.scale))
        drawPixelText(ctx, card.text.slice(0, 30), cx + 8, cy + h / 2 - pixelSize * 3.5, pixelSize, rgba(ZINC.accent, textAlpha))
        break
      }
      case 'heading': {
        ctx.font = `${fontSize}px monospace`
        ctx.fillStyle = rgba(ZINC.text, textAlpha * 0.9)
        ctx.fillText(card.text.slice(0, 35), cx + 6, cy + h / 2 + fontSize / 3)
        break
      }
      case 'quote': {
        // Left border accent
        ctx.fillStyle = rgba(ZINC.dim, 0.5 * textAlpha)
        ctx.fillRect(cx + 3, cy + 4, 2, h - 8)
        // Italic text
        ctx.font = `italic ${Math.max(8, fontSize - 1)}px Georgia, serif`
        ctx.fillStyle = rgba(ZINC.text, textAlpha * 0.7)
        ctx.fillText(card.text.slice(0, 50), cx + 10, cy + h / 2 + fontSize / 3)
        break
      }
      case 'image': {
        // Placeholder rectangle representing the image
        ctx.fillStyle = rgba(ZINC.dim, 0.3 * textAlpha)
        ctx.fillRect(cx + 4, cy + 4, w - 8, h - 8)
        // Small cross in center (like a broken image icon but aesthetic)
        const mx = cx + w / 2
        const my = cy + h / 2
        ctx.strokeStyle = rgba(ZINC.text, 0.15 * textAlpha)
        ctx.lineWidth = 0.5
        ctx.beginPath()
        ctx.moveTo(mx - 8, my - 8); ctx.lineTo(mx + 8, my + 8)
        ctx.moveTo(mx + 8, my - 8); ctx.lineTo(mx - 8, my + 8)
        ctx.stroke()
        break
      }
      case 'tag': {
        const tagFontSize = Math.max(7, Math.round(9 * proj.scale))
        ctx.font = `${tagFontSize}px monospace`
        ctx.fillStyle = rgba(ZINC.dim, textAlpha * 0.8)
        ctx.fillText(`#${card.text}`, cx + 4, cy + h / 2 + tagFontSize / 3)
        break
      }
      case 'stats': {
        const statsFontSize = Math.max(7, Math.round(9 * proj.scale))
        ctx.font = `${statsFontSize}px monospace`
        ctx.fillStyle = rgba(ZINC.dim, textAlpha * 0.5)
        ctx.fillText(card.text, cx + 4, cy + h / 2 + statsFontSize / 3)
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
  applyDither(imgData, 0.30, ZINC.bg, ZINC.text)

  ctx.putImageData(imgData, 0, 0)

  // ----- Pixel font title (on top, unaffected by post-processing) -----
  // Small URL at bottom-right
  const url = `ejfox.com`
  drawPixelText(ctx, url, WIDTH - url.length * 18 - 16, HEIGHT - 30, 2, rgba(ZINC.dim, 0.5))

  return canvas.toBuffer('image/png')
}
