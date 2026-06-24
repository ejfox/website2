#!/usr/bin/env node
/**
 * @file gen-gear-annex.mjs
 * @description Generates the "gear annex" — the auto-derived, always-current checklists
 * that back the motorcycle runbooks. Reads data/gear.csv (same parser the site uses,
 * d3.csvParse) and writes a markdown annex into the agent-vault. Re-run before trips;
 * never hand-edit the output.
 *
 * Classification:
 *   - charge / capture / riding  -> driven by the freeform `Tags` field (powered/capture/riding|atgatt)
 *   - waterproof / sleep / restock -> driven by existing structured columns (Waterproof, Type, Consumable)
 *   - "needs tagging" -> Type=Tech items missing a `powered` tag, so coverage stays honest
 *
 * Usage: node scripts/gen-gear-annex.mjs   (override output with GEAR_ANNEX_OUT=/path)
 */
import * as d3 from 'd3'
import { readFile, writeFile } from 'node:fs/promises'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const CSV = resolve(__dirname, '../data/gear.csv')
const OUT =
  process.env.GEAR_ANNEX_OUT ||
  '/Users/ejfox/Library/Mobile Documents/iCloud~md~obsidian/Documents/agent-vault/anytime/gear-annex.md'

const rows = d3
  .csvParse(await readFile(CSV, 'utf-8'))
  .filter((r) => r.Name?.trim())
const active = rows.filter(
  (r) => !['Archived', 'HomeBase'].includes((r.Status || '').trim())
)

const tagsOf = (r) =>
  (r.Tags || '')
    .toLowerCase()
    .split(';')
    .map((s) => s.trim())
const has = (r, t) => tagsOf(r).includes(t)
const yes = (r, f) => (r[f] || '').trim().toLowerCase() === 'yes'

const BUCKETS = [
  [
    'charge',
    'Charge everything that takes a charge',
    (r) => yes(r, 'Powered') || has(r, 'powered'),
  ],
  [
    'capture',
    'Clear / format every capture device storage',
    (r) => yes(r, 'HasStorage') || has(r, 'capture'),
  ],
  [
    'riding',
    'Full ATGATT — don before rolling',
    (r) => has(r, 'riding') || has(r, 'atgatt'),
  ],
  [
    'waterproof',
    'Waterproof / shell — keep accessible',
    (r) => yes(r, 'Waterproof'),
  ],
  [
    'sleep',
    'Sleep system — layer to the forecast low',
    (r) => (r.Type || '').trim() === 'Sleep',
  ],
  [
    'restock',
    'Restock consumables (food / water / fuel)',
    (r) => yes(r, 'Consumable'),
  ],
]

const ts = new Date().toISOString()
let md = `---
date: ${ts}
modified: ${ts}
robot: true
model: Claude Opus 4.8
tags:
  - gear
  - motorcycle
  - annex
  - generated
draft: true
---
## Gear Annex (auto-generated)

> Generated from \`website2/data/gear.csv\` by \`scripts/gen-gear-annex.mjs\` on ${ts}.
> **Do not hand-edit** — re-run the generator. Backs [[motorcycle-trip-prep-runbook]] and [[motorcycle-camping-runbook]].

`

for (const [anchor, desc, pred] of BUCKETS) {
  const items = active
    .filter(pred)
    .map((r) => r.Name.trim())
    .sort((a, b) => a.localeCompare(b))
  md += `## ${anchor}\n*${desc}*\n\n`
  md += items.length
    ? items.map((n) => `- [ ] ${n}`).join('\n')
    : '_(none tagged yet)_'
  md += `\n\n`
}

// Charging audit — group powered items by connector so you know which cables/bricks to bring.
const poweredItems = active.filter(
  (r) => yes(r, 'Powered') || has(r, 'powered')
)
const byPort = d3.group(
  poweredItems,
  (r) => (r.ChargePort || '').trim() || '(unknown — fill in)'
)
md += `## charging audit\n*Powered devices grouped by connector — pack one cable per port type (plus a multi-port brick):*\n\n`
for (const port of [...byPort.keys()].sort()) {
  const items = byPort
    .get(port)
    .map((r) => r.Name.trim())
    .sort((a, b) => a.localeCompare(b))
  md += `**${port}** (${items.length}): ${items.join(', ')}\n\n`
}

// Card audit — group capture devices by media type so you bring the right cards + readers.
const captureItems = active.filter(
  (r) => yes(r, 'HasStorage') || has(r, 'capture')
)
const byCard = d3.group(
  captureItems,
  (r) => (r.CardType || '').trim() || '(unknown — fill in)'
)
md += `## card audit\n*Capture devices by storage type — bring spare cards + a reader for removable media; \`Internal\` offloads by cable:*\n\n`
for (const card of [...byCard.keys()].sort()) {
  const items = byCard
    .get(card)
    .map((r) => r.Name.trim())
    .sort((a, b) => a.localeCompare(b))
  md += `**${card}** (${items.length}): ${items.join(', ')}\n\n`
}

const untagged = active.filter(
  (r) => (r.Type || '').trim() === 'Tech' && !has(r, 'powered')
)
if (untagged.length) {
  md += `## needs tagging\n*\`Type=Tech\` but no \`powered\` tag — add the tag in gear.csv so they appear above:*\n\n`
  md += untagged.map((r) => `- ${r.Name.trim()}`).join('\n') + '\n\n'
}

md += `---\n${active.length} active items.\n`
await writeFile(OUT, md)
console.log(`wrote ${OUT}`)
for (const [a, , pred] of BUCKETS)
  console.log(`  ${a}: ${active.filter(pred).length}`)
console.log(`  needs-tagging: ${untagged.length}`)
