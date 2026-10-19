#!/usr/bin/env node
/**
 * @file vendor-link-icons.mjs
 * @description Fetch every icon remarkEnhanceLinks maps a domain to and write
 *   the raw SVGs to data/link-icons.json, so markdown processing renders link
 *   icons offline. Re-run after adding a domain to `socialPlatforms`.
 * @usage yarn icons:vendor
 *
 * Polite to api.iconify.design: one request at a time, and it honors
 * Retry-After on 429. Existing entries are kept when a fetch fails, so a bad
 * run never drops an icon that was already vendored.
 */
import { readFileSync, writeFileSync } from 'node:fs'
import {
  socialPlatforms,
  iconUrl,
  isSafeSvg,
} from '../plugins/remarkEnhanceLinks.mjs'

const OUT = new URL('../../data/link-icons.json', import.meta.url)
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

let existing = {}
try {
  existing = JSON.parse(readFileSync(OUT, 'utf8'))
} catch {
  // first run
}

const names = [...new Set(Object.values(socialPlatforms))].sort()
const icons = {}
const failed = []

for (const name of names) {
  let svg = null
  for (let attempt = 1; attempt <= 5 && !svg; attempt++) {
    const res = await fetch(iconUrl(name), {
      headers: { 'User-Agent': 'ejfox.com link-icon vendor' },
    })
    if (res.ok) {
      const body = await res.text()
      if (isSafeSvg(body)) svg = body
      else break
    } else if (res.status === 429) {
      const wait = Number(res.headers.get('retry-after')) || 10 * attempt
      console.log(`  429 on ${name}, waiting ${wait}s`)
      await sleep(wait * 1000)
    } else {
      break
    }
  }
  if (svg) icons[name] = svg
  else if (existing[name]) icons[name] = existing[name]
  if (!svg) failed.push(name)
  await sleep(250)
}

writeFileSync(OUT, JSON.stringify(icons, null, 2) + '\n')
console.log(
  `✓ ${Object.keys(icons).length}/${names.length} icons → data/link-icons.json`
)
if (failed.length) {
  console.log(`  not refreshed (kept old copy if any): ${failed.join(', ')}`)
  process.exitCode = 1
}
