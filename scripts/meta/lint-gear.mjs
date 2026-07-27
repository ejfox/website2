#!/usr/bin/env node
/**
 * Schema-driven gear.csv linter
 *
 * Validates data/gear.csv against the vendored contract data/gear-schema.json
 * (the canonical schema lives in the `gear` repo and is mirrored here by
 * sync-gear.js — see CLAUDE.md "Gear Inventory System").
 *
 * Checks: required fields, enum values, numeric/integer/date formats, column
 * coverage, and orphan physical containers. Because every rule is derived from
 * the schema, the linter can never drift from the contract.
 *
 * Usage: node scripts/lint-gear.mjs [--fix]
 */

import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

const CSV_PATH = resolve(process.cwd(), 'data/gear.csv')
const SCHEMA_PATH = resolve(process.cwd(), 'data/gear-schema.json')
const FIX_MODE = process.argv.includes('--fix')

// Physical top-level anchors that aren't themselves rows in the CSV.
const TOP_LEVEL_CONTAINERS = ['Body', 'Motorcycle']

const schema = JSON.parse(readFileSync(SCHEMA_PATH, 'utf-8'))
const props = schema.properties
const SCHEMA_COLUMNS = Object.keys(props)
const REQUIRED = schema.required || []

// Derive rule sets from the schema so they never drift.
const ENUMS = Object.fromEntries(
  Object.entries(props)
    .filter(([, v]) => Array.isArray(v.enum))
    .map(([k, v]) => [k, v.enum])
)
const NUMERIC = Object.entries(props)
  .filter(([, v]) => v.type === 'number')
  .map(([k]) => k)
const INTEGER = Object.entries(props)
  .filter(([, v]) => v.type === 'integer')
  .map(([k]) => k)
const DATES = Object.entries(props)
  .filter(([, v]) => v.format === 'date')
  .map(([k]) => k)

// Fields where empty means "unset" and is always allowed.
const isEmpty = (v) => !v || !v.trim()

// Parse CSV (handles quoted fields with commas, escaped quotes, newlines).
function parseCSV(text) {
  const rows = []
  let field = []
  let cur = ''
  let inQuotes = false
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          cur += '"'
          i++
        } else inQuotes = false
      } else cur += c
    } else if (c === '"') inQuotes = true
    else if (c === ',') {
      field.push(cur)
      cur = ''
    } else if (c === '\n') {
      field.push(cur)
      rows.push(field)
      field = []
      cur = ''
    } else if (c !== '\r') cur += c
  }
  if (cur !== '' || field.length) {
    field.push(cur)
    rows.push(field)
  }
  return rows.filter((r) => r.length > 1 || (r[0] && r[0].trim()))
}

function toCSV(rows) {
  const esc = (cell) =>
    cell.includes(',') || cell.includes('"') || cell.includes('\n')
      ? `"${cell.replace(/"/g, '""')}"`
      : cell
  return rows.map((row) => row.map(esc).join(',')).join('\n') + '\n'
}

function lintGear() {
  const rows = parseCSV(readFileSync(CSV_PATH, 'utf-8'))
  if (rows.length === 0) {
    console.error('Error: Empty CSV file')
    process.exit(1)
  }

  const issues = []
  const fixes = []

  const headers = rows[0].map((h) => h.trim())
  rows[0] = headers
  const col = {}
  headers.forEach((h, i) => (col[h] = i))

  // Column coverage (order-independent — readers match by header name).
  console.info('\n📋 Checking columns...')
  const missing = SCHEMA_COLUMNS.filter((c) => !headers.includes(c))
  const unknown = headers.filter((h) => !SCHEMA_COLUMNS.includes(h))
  if (missing.length)
    issues.push(`Missing schema columns: ${missing.join(', ')}`)
  if (unknown.length)
    issues.push(`Unknown columns (not in schema): ${unknown.join(', ')}`)

  // Known item names + physical anchors, for orphan-container detection.
  const names = new Set(
    rows
      .slice(1)
      .map((r) => (r[col['Name']] || '').trim())
      .filter(Boolean)
  )

  console.info('🔍 Checking rows...')
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i]
    const rowNum = i + 1
    const name = (row[col['Name']] || `(row ${rowNum})`).trim()

    if (row.length !== headers.length)
      issues.push(
        `Row ${rowNum} "${name}": column count ${row.length}, expected ${headers.length}`
      )

    // Required fields.
    for (const field of REQUIRED) {
      if (isEmpty(row[col[field]]))
        issues.push(`Row ${rowNum}: Missing required "${field}"`)
    }

    // Enum fields (empty allowed; case-insensitive auto-fix).
    for (const [field, valid] of Object.entries(ENUMS)) {
      const idx = col[field]
      if (idx === undefined) continue
      const value = (row[idx] || '').trim()
      if (!value) continue
      if (!valid.includes(value)) {
        const match = valid.find((v) => v.toLowerCase() === value.toLowerCase())
        if (match && FIX_MODE) {
          row[idx] = match
          fixes.push(
            `Row ${rowNum} "${name}": ${field} "${value}" → "${match}"`
          )
        } else {
          issues.push(
            `Row ${rowNum} "${name}": Invalid ${field} "${value}" (valid: ${valid.join(', ')})`
          )
        }
      }
    }

    // Numeric fields.
    for (const field of NUMERIC) {
      const v = row[col[field]]
      if (!isEmpty(v) && Number.isNaN(Number.parseFloat(v)))
        issues.push(`Row ${rowNum} "${name}": ${field} "${v}" not numeric`)
    }

    // Integer fields (Qty: positive int; auto-fill/repair under --fix).
    for (const field of INTEGER) {
      const idx = col[field]
      if (idx === undefined) continue
      const v = row[idx]
      if (isEmpty(v)) {
        if (FIX_MODE) {
          row[idx] = '1'
          fixes.push(`Row ${rowNum} "${name}": empty ${field} → 1`)
        }
        continue
      }
      const n = Number.parseInt(v, 10)
      if (Number.isNaN(n) || n < 1) {
        if (FIX_MODE) {
          row[idx] = '1'
          fixes.push(`Row ${rowNum} "${name}": ${field} "${v}" → 1`)
        } else {
          issues.push(
            `Row ${rowNum} "${name}": ${field} "${v}" not a positive integer`
          )
        }
      }
    }

    // Date fields.
    for (const field of DATES) {
      const v = row[col[field]]
      if (!isEmpty(v) && !/^\d{4}-\d{2}-\d{2}$/.test(v.trim()))
        issues.push(`Row ${rowNum} "${name}": ${field} "${v}" not YYYY-MM-DD`)
    }

    // Orphan physical container: a non-empty Parent Container must name a
    // real item or a known top-level anchor. Status (Archived/HomeBase/
    // Modular) lives in its own column now, so it can never be an orphan here.
    const pc = (row[col['Parent Container']] || '').trim()
    if (pc && !names.has(pc) && !TOP_LEVEL_CONTAINERS.includes(pc))
      issues.push(
        `Row ${rowNum} "${name}": orphan Parent Container "${pc}" (not a known item or ${TOP_LEVEL_CONTAINERS.join('/')})`
      )

    // Normalize Yes/No enum fields under --fix.
    if (FIX_MODE) {
      for (const field of ['Waterproof', 'Worn', 'Consumable', 'Star']) {
        const idx = col[field]
        if (idx === undefined) continue
        const v = (row[idx] || '').trim().toLowerCase()
        if (v === 'yes' && row[idx] !== 'Yes') {
          row[idx] = 'Yes'
          fixes.push(`Row ${rowNum} "${name}": ${field} → "Yes"`)
        } else if (v === 'no' && row[idx] !== 'No') {
          row[idx] = 'No'
          fixes.push(`Row ${rowNum} "${name}": ${field} → "No"`)
        }
      }
      // Default empty Status to Active.
      const sIdx = col['Status']
      if (sIdx !== undefined && isEmpty(row[sIdx])) {
        row[sIdx] = 'Active'
        fixes.push(`Row ${rowNum} "${name}": empty Status → "Active"`)
      }
    }

    // Trim Name whitespace.
    const nameVal = row[col['Name']]
    if (nameVal && nameVal !== nameVal.trim()) {
      if (FIX_MODE) {
        row[col['Name']] = nameVal.trim()
        fixes.push(`Row ${rowNum}: trimmed Name`)
      } else {
        issues.push(`Row ${rowNum} "${name}": Name has surrounding whitespace`)
      }
    }
  }

  console.info('\n' + '='.repeat(50))
  if (issues.length === 0) console.info('✅ No issues found!')
  else {
    console.info(`\n⚠️  Found ${issues.length} issue(s):\n`)
    issues.forEach((x) => console.info(`  • ${x}`))
  }

  if (FIX_MODE && fixes.length > 0) {
    console.info(`\n🔧 Applied ${fixes.length} fix(es):\n`)
    fixes.forEach((x) => console.info(`  • ${x}`))
    writeFileSync(CSV_PATH, toCSV(rows))
    console.info(`\n💾 Saved changes to ${CSV_PATH}`)
  } else if (FIX_MODE) console.info('\n✨ Nothing to fix!')
  else if (issues.length > 0)
    console.info('\n💡 Run with --fix to auto-fix some issues')

  // Stats.
  const data = rows.slice(1)
  const n = (f) => data.filter((r) => !isEmpty(r[col[f]])).length
  const yes = (f) =>
    data.filter((r) => (r[col[f]] || '').toLowerCase() === 'yes').length
  const byStatus = {}
  for (const r of data) {
    const s = (r[col['Status']] || 'Active').trim() || 'Active'
    byStatus[s] = (byStatus[s] || 0) + 1
  }
  console.info('\n📊 Stats:')
  console.info(`  • ${data.length} items total`)
  console.info(
    `  • ${n('Weight_oz')} with weight (${data.length - n('Weight_oz')} missing)`
  )
  console.info(
    `  • by Status: ${Object.entries(byStatus)
      .map(([k, v]) => `${k} ${v}`)
      .join(', ')}`
  )
  console.info(
    `  • ${yes('Star')} starred (Big 3), ${yes('Worn')} worn, ${yes('Consumable')} consumable`
  )
  console.info('')

  process.exit(issues.length > 0 ? 1 : 0)
}

lintGear()
