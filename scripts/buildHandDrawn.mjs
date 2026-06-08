#!/usr/bin/env node
/**
 * Build the hand-drawn asset kit.
 *
 * Source of truth: assets/hand-drawn/master.svg — a single sheet of notebook
 * marginalia (arrows, circled numbers, badges, boxes, numerals) traced in
 * Illustrator — plus assets/hand-drawn/catalog.json, the curated taxonomy that
 * names every shape and its bounding box.
 *
 * Rather than physically slice 962 paths into ~120 files, we keep ALL the
 * geometry in one sprite and address each asset as a viewBox rectangle into that
 * shared coordinate space. Cheap, lossless, and a new asset is four numbers.
 *
 * catalog.json entry: { name, group, sub, desc, x, y, w, h }
 *   group: arrows | numbers | circled | magnitudes | boxes | circles | letters | words | textures
 *
 * Outputs:
 *   - assets/hand-drawn/manifest.json : the catalog padded + sorted (imported by the component)
 *   - public/hand-drawn/sprite.svg    : the shared geometry, recolored to currentColor
 *
 * Add/rename an asset: edit catalog.json, then `node scripts/buildHandDrawn.mjs`.
 * (regions.csv / element bounding boxes came from the browser via element.getBBox().)
 */
import { readFileSync, writeFileSync, mkdirSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const HD = join(ROOT, 'assets/hand-drawn')

const master = readFileSync(join(HD, 'master.svg'), 'utf8')
const catalog = JSON.parse(readFileSync(join(HD, 'catalog.json'), 'utf8'))

const PAD = 4 // default breathing room around each crop; override per-entry with `pad`
            // (e.g. the stipple dots sit ~7px apart and need pad:0 to avoid bleed)
const assets = catalog.map((a) => {
  const pad = a.pad ?? PAD
  return {
    name: a.name,
    group: a.group,
    sub: a.sub || '',
    desc: a.desc || '',
    x: a.x - pad,
    y: a.y - pad,
    w: a.w + pad * 2,
    h: a.h + pad * 2
  }
})

// dupe-name guard
const seen = new Set()
for (const a of assets) {
  if (seen.has(a.name)) console.warn('! duplicate name:', a.name)
  seen.add(a.name)
}

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

const byGroup = assets.reduce((m, a) => ((m[a.group] = (m[a.group] || 0) + 1), m), {})
console.log(`✓ ${assets.length} assets → manifest.json, sprite.svg`)
console.log('  ' + Object.entries(byGroup).map(([g, n]) => `${g}:${n}`).join('  '))
