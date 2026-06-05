#!/usr/bin/env node
/**
 * Build the hand-drawn asset kit.
 *
 * Source of truth: assets/hand-drawn/master.svg — a single sheet of notebook
 * marginalia (arrows, circled numbers, badges, boxes, numerals) traced in
 * Illustrator. Rather than physically slice 962 paths into ~100 files, we keep
 * ALL the geometry in one sprite and address each asset as a viewBox rectangle
 * into that shared coordinate space. Cheap, lossless, and a new asset is 4 numbers.
 *
 * Inputs (committed alongside master.svg):
 *   - regions.csv : `id,x,y,w,h,n` bounding boxes for every cluster of ink,
 *                   computed once from the browser via element.getBBox().
 *   - names.json  : which clusters to publish, their names + categories, plus
 *                   hand-tuned rects for the tight glyph rows (circled numbers).
 *
 * Outputs:
 *   - assets/hand-drawn/manifest.json : [{ name, cat, x, y, w, h }] (imported by the component)
 *   - public/hand-drawn/sprite.svg    : the shared geometry, recolored to currentColor
 *
 * To add an asset: find its cluster id in regions.csv (or eyeball x/y/w/h),
 * add a line to names.json, and re-run `node scripts/buildHandDrawn.mjs`.
 */
import { readFileSync, writeFileSync, mkdirSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const HD = join(ROOT, 'assets/hand-drawn')

const master = readFileSync(join(HD, 'master.svg'), 'utf8')
const csv = readFileSync(join(HD, 'regions.csv'), 'utf8').trim()
const names = JSON.parse(readFileSync(join(HD, 'names.json'), 'utf8'))

const cb = {}
csv.split(';').forEach((s) => {
  const [id, x, y, w, h] = s.split(',').map(Number)
  cb[id] = { x, y, w, h }
})

const PAD = 4 // breathing room around each crop
const assets = []
for (const [id, [name, cat]] of Object.entries(names.fromClusters)) {
  const b = cb[id]
  if (!b) { console.warn('! no bbox for cluster', id, '(' + name + ')'); continue }
  assets.push({ name, cat, x: b.x - PAD, y: b.y - PAD, w: b.w + PAD * 2, h: b.h + PAD * 2 })
}
const addRects = (list, prefix, cat) =>
  list.forEach((r, i) => assets.push({ name: `${prefix}${i + 1}`, cat, x: r[0] - PAD, y: r[1] - PAD, w: r[2] + PAD * 2, h: r[3] + PAD * 2 }))
addRects(names.circledThin || [], 'circled-', 'circled')
addRects(names.circledBold || [], 'circled-bold-', 'circled')

writeFileSync(join(HD, 'manifest.json'), JSON.stringify(assets, null, 2) + '\n')

// shared geometry, recolored so every asset inherits currentColor
const inner = master
  .replace(/^[\s\S]*?<svg[^>]*>/, '')
  .replace(/<\/svg>\s*$/, '')
  .replace(/<style[\s\S]*?<\/style>/, '')
const style = `<style>
#hd-ink path{fill:currentColor;stroke:none}
#hd-ink .st0{fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}
#hd-ink .st1{fill:currentColor}
#hd-ink .st2{fill:currentColor}
#hd-ink text{fill:currentColor}
</style>`
const sprite = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" style="display:none" aria-hidden="true">
${style}
<defs><g id="hd-ink">${inner}</g></defs>
</svg>`
mkdirSync(join(ROOT, 'public/hand-drawn'), { recursive: true })
writeFileSync(join(ROOT, 'public/hand-drawn/sprite.svg'), sprite)

console.log(`✓ ${assets.length} assets → manifest.json, sprite.svg (${(sprite.length / 1024).toFixed(0)}KB)`)
