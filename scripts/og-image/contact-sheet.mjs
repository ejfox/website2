#!/usr/bin/env node
/**
 * @file contact-sheet.mjs
 * @description Render several posts through all four house styles and tile
 *   them into one labeled PNG (rows = posts, columns = styles) for art
 *   direction. Writes data/og-previews/_contact-sheet.png (gitignored dir).
 *   Also writes _contact-sheet-thumb.png: one row at feed-thumbnail width
 *   (500px per card) as the legibility check.
 *
 * Usage:
 *   node scripts/og-image/contact-sheet.mjs 2025/using-radios 2024/the-mystery-of-peter-todd [...]
 *   node scripts/og-image/contact-sheet.mjs --batch 1 2025/using-radios   # reroll seed
 */

import { promises as fs } from 'node:fs'
import path from 'node:path'
import { createCanvas, loadImage } from '@napi-rs/canvas'
import { extractContent } from './extract.mjs'
import { STYLES, WIDTH, HEIGHT } from './styles.mjs'

const ROOT = path.resolve(import.meta.dirname, '../..')
const OUT_DIR = path.join(ROOT, 'data', 'og-previews')

const args = process.argv.slice(2)
let batch = 0
const batchIdx = args.indexOf('--batch')
if (batchIdx !== -1) {
  batch = Number.parseInt(args[batchIdx + 1], 10)
  args.splice(batchIdx, 2)
}
const slugs = args
if (!slugs.length) {
  console.error('Usage: node scripts/og-image/contact-sheet.mjs [--batch N] <slug> [...]')
  process.exit(1)
}

const CELL_W = 400
const CELL_H = Math.round((CELL_W * HEIGHT) / WIDTH)
const GUTTER = 12
const LABEL_W = 170
const HEADER_H = 36

async function main() {
  const rows = []
  for (const slug of slugs) {
    const content = await extractContent(slug)
    let seedBase = slug
    if (batch) seedBase = `${slug}:batch${batch}`
    const cells = []
    for (let v = 0; v < STYLES.length; v++) {
      const t0 = performance.now()
      const png = await STYLES[v].render(content, `${seedBase}:v${v}`)
      const ms = Math.round(performance.now() - t0)
      cells.push({ img: await loadImage(png), ms })
      console.log(`  ${slug} ${STYLES[v].name} ${ms}ms`)
    }
    rows.push({ slug, cells })
  }

  const sheetW = LABEL_W + STYLES.length * (CELL_W + GUTTER) + GUTTER
  const sheetH = HEADER_H + rows.length * (CELL_H + GUTTER) + GUTTER
  const sheet = createCanvas(sheetW, sheetH)
  const ctx = sheet.getContext('2d')
  ctx.fillStyle = '#1a1a1a'
  ctx.fillRect(0, 0, sheetW, sheetH)
  ctx.fillStyle = '#ddd'
  ctx.font = '600 14px Helvetica Neue, sans-serif'
  for (let v = 0; v < STYLES.length; v++) {
    ctx.fillText(
      `${v} · ${STYLES[v].name}`,
      LABEL_W + GUTTER + v * (CELL_W + GUTTER),
      24
    )
  }
  ctx.font = '400 12px Menlo, monospace'
  for (let r = 0; r < rows.length; r++) {
    const y = HEADER_H + GUTTER + r * (CELL_H + GUTTER)
    ctx.fillStyle = '#bbb'
    const label = rows[r].slug.split('/').pop()
    ctx.fillText(label.slice(0, 22), GUTTER, y + 16)
    if (batch) ctx.fillText(`batch ${batch}`, GUTTER, y + 34)
    for (let v = 0; v < STYLES.length; v++) {
      const x = LABEL_W + GUTTER + v * (CELL_W + GUTTER)
      ctx.drawImage(rows[r].cells[v].img, x, y, CELL_W, CELL_H)
      ctx.fillStyle = '#777'
      ctx.fillText(`${rows[r].cells[v].ms}ms`, x, y + CELL_H + 10)
      ctx.fillStyle = '#bbb'
    }
  }

  await fs.mkdir(OUT_DIR, { recursive: true })
  let suffix = ''
  if (batch) suffix = `-batch${batch}`
  const outPath = path.join(OUT_DIR, `_contact-sheet${suffix}.png`)
  await fs.writeFile(outPath, sheet.toBuffer('image/png'))
  console.log(`\n  Sheet: ${outPath}`)

  // Feed-thumbnail check: first row at 500px wide, nothing else.
  const thumb = createCanvas(STYLES.length * 510 + 10, 273)
  const tctx = thumb.getContext('2d')
  tctx.fillStyle = '#1a1a1a'
  tctx.fillRect(0, 0, thumb.width, thumb.height)
  for (let v = 0; v < STYLES.length; v++) {
    tctx.drawImage(rows[0].cells[v].img, 10 + v * 510, 5, 500, 263)
  }
  const thumbPath = path.join(OUT_DIR, `_contact-sheet-thumb${suffix}.png`)
  await fs.writeFile(thumbPath, thumb.toBuffer('image/png'))
  console.log(`  Thumb: ${thumbPath}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
