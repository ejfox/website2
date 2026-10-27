#!/usr/bin/env node
/**
 * @file seed-published-urls.mjs
 * @description (Re)build data/published-urls.json from the Wayback Machine:
 *   every /blog, /projects and /reading page it captured returning 200, in the
 *   current site's URL shapes. scripts/meta/check-urls.mjs then requires each
 *   one to still resolve (or be listed in data/gone-urls.json).
 *   `yarn check:urls:seed`. NETWORK: hits the public web.archive.org CDX API
 *   (no key; slow, retries with backoff). Writes the JSON; no git.
 *
 * This is the history from before check-urls existed. After that, the
 * base-vs-head check in the pre-commit hook and CI covers new losses, so this
 * only needs re-running if you want to pick up URLs the Archive found later.
 *
 *   node scripts/meta/seed-published-urls.mjs          # merge into the file
 *   node scripts/meta/seed-published-urls.mjs --dry    # print, don't write
 *
 * Merges, never drops: a URL already in the file stays even if the Archive
 * stops returning it.
 */

import { promises as fs } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { routeKey } from '../utils/internal-links.mjs'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const OUT = path.join(ROOT, 'data/published-urls.json')
const PREFIXES = ['blog', 'projects', 'reading']

// Current-site shapes only. The 2006-era WordPress blog (/blog/2006/07/slug,
// ?p=, wp-content) is long gone and not this site's URLs to keep.
const SHAPES = [
  /^\/blog\/(19|20)\d\d\/[^/]+$/, // /blog/2023/slug
  /^\/blog\/robots\/[^/]+$/,
  /^\/projects\/[^/]+$/,
  /^\/reading\/[^/]+$/,
]
const NOT_A_PAGE = /\.[a-z0-9]{1,5}$|^\d{1,2}$/i // assets, twins, month dirs

// The CDX API sometimes answers 200 with an HTML error page, hence the
// body-starts-with-'[' test, not just res.ok. Row 0 is the field header.
async function cdx(prefix) {
  const url =
    `https://web.archive.org/cdx/search/cdx?url=ejfox.com/${prefix}/*` +
    `&filter=statuscode:200&collapse=urlkey&fl=original,timestamp&output=json`
  for (let attempt = 1; attempt <= 4; attempt++) {
    const res = await fetch(url, { signal: AbortSignal.timeout(120_000) })
    const body = await res.text()
    if (res.ok && body.trimStart().startsWith('[')) {
      return JSON.parse(body).slice(1)
    }
    console.error(`  ${prefix}: Archive said ${res.status}, retry ${attempt}`)
    await new Promise((r) => setTimeout(r, 10_000 * attempt))
  }
  throw new Error(`Wayback CDX unavailable for /${prefix}/*; try again later`)
}

async function main() {
  let existing = []
  try {
    existing = JSON.parse(await fs.readFile(OUT, 'utf8')).urls
  } catch {
    // first run
  }
  const seen = new Map(existing.map((e) => [e.url, e.seen]))

  for (const prefix of PREFIXES) {
    const rows = await cdx(prefix)
    let kept = 0
    for (const [original, ts] of rows) {
      let pathname
      try {
        pathname = new URL(original).pathname
      } catch {
        continue
      }
      const key = routeKey(pathname)
      const last = key.split('/').pop()
      if (!SHAPES.some((re) => re.test(key)) || NOT_A_PAGE.test(last)) continue
      const date = `${ts.slice(0, 4)}-${ts.slice(4, 6)}-${ts.slice(6, 8)}`
      // Keep the earliest capture date: `seen` means first seen live.
      if (!seen.has(key) || date < seen.get(key)) seen.set(key, date)
      kept++
    }
    console.log(`  /${prefix}: ${rows.length} captures, ${kept} page URLs`)
  }

  const urls = [...seen]
    .map(([url, s]) => ({ url, seen: s }))
    .sort((a, b) => a.url.localeCompare(b.url))
  const doc = {
    _doc:
      'URLs the Wayback Machine saw live (first 200 capture). Each must still ' +
      'resolve or be listed in data/gone-urls.json. Rebuild: ' +
      'node scripts/meta/seed-published-urls.mjs',
    urls,
  }
  if (process.argv.includes('--dry')) {
    console.log(JSON.stringify(doc, null, 2))
  } else {
    await fs.writeFile(OUT, JSON.stringify(doc, null, 2) + '\n')
    console.log(`wrote ${urls.length} URLs to data/published-urls.json`)
  }
}

main().catch((err) => {
  console.error(err.message)
  process.exit(1)
})
