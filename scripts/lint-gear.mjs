#!/usr/bin/env node
/**
 * Lightweight gear.csv linter
 * - Validates column structure
 * - Checks data types and formats
 * - Auto-fixes common issues
 * - Surfaces problems
 *
 * Usage: node scripts/lint-gear.mjs [--fix]
 */

import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

const CSV_PATH = resolve(process.cwd(), 'data/gear.csv')
const FIX_MODE = process.argv.includes('--fix')

// Expected columns in order
const EXPECTED_COLUMNS = [
  'Name',
  'Weight_oz',
  'Parent Container',
  'Type',
  'Category',
  'Subcategory',
  'Priority',
  'Waterproof',
  'Worn',
  'Qty',
  'Consumable',
  'Star',
  'Notes',
  'Tags',
  'Condition',
  'Amazon_URL',
  'Last_Used',
  'Purchase_Date',
  'Purchase_Price',
  'Photo_URL',
  'Scan_3D_URL',
  'Serial_Number',
  'Model_Number',
  'Brand',
  'Location_Room',
  'Location_Detail',
]

// Valid values for enum-like fields
const VALID_VALUES = {
  Priority: ['High', 'Medium', 'Low', 'Optional', ''],
  Waterproof: ['Yes', 'No', ''],
  Worn: ['Yes', 'No', ''],
  Consumable: ['Yes', 'No', ''],
  Star: ['Yes', 'No', ''],
  Condition: ['Good', 'Fair', 'Poor', 'New', ''],
}

// Parse CSV (handles quoted fields with commas)
function parseCSV(text) {
  const lines = text.split('\n')
  const rows = []

  for (let line of lines) {
    line = line.trim()
    if (!line) continue

    const row = []
    let current = ''
    let inQuotes = false

    for (let i = 0; i < line.length; i++) {
      const char = line[i]
      if (char === '"') {
        inQuotes = !inQuotes
      } else if (char === ',' && !inQuotes) {
        row.push(current)
        current = ''
      } else {
        current += char
      }
    }
    row.push(current)
    rows.push(row)
  }

  return rows
}

// Convert rows back to CSV
function toCSV(rows) {
  return (
    rows
      .map((row) =>
        row
          .map((cell) => {
            if (
              cell.includes(',') ||
              cell.includes('"') ||
              cell.includes('\n')
            ) {
              return `"${cell.replace(/"/g, '""')}"`
            }
            return cell
          })
          .join(',')
      )
      .join('\n') + '\n'
  )
}

// Main linting logic
function lintGear() {
  const content = readFileSync(CSV_PATH, 'utf-8')
  const rows = parseCSV(content)

  const issues = []
  const fixes = []

  if (rows.length === 0) {
    console.error('Error: Empty CSV file')
    process.exit(1)
  }

  // Trim all headers
  const headers = rows[0].map((h) => h.trim())
  rows[0] = headers

  // Check columns
  console.info('\n📋 Checking columns...')

  if (headers.length !== EXPECTED_COLUMNS.length) {
    issues.push(
      `Column count mismatch: got ${headers.length}, expected ${EXPECTED_COLUMNS.length}`
    )
  }

  for (let i = 0; i < EXPECTED_COLUMNS.length; i++) {
    if (headers[i] !== EXPECTED_COLUMNS[i]) {
      issues.push(
        `Column ${i + 1}: got "${headers[i]}", expected "${EXPECTED_COLUMNS[i]}"`
      )
    }
  }

  // Create column index map
  const colIndex = {}
  headers.forEach((h, i) => (colIndex[h] = i))

  // Check each row
  console.info('🔍 Checking rows...')

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i]
    const rowNum = i + 1
    const name = row[colIndex['Name']] || `(row ${rowNum})`

    // Column count
    if (row.length !== headers.length) {
      issues.push(
        `Row ${rowNum} "${name}": column count ${row.length}, expected ${headers.length}`
      )
    }

    // Name required
    if (!row[colIndex['Name']]?.trim()) {
      issues.push(`Row ${rowNum}: Missing Name`)
    }

    // Weight_oz should be numeric or empty
    const weight = row[colIndex['Weight_oz']]
    if (weight && weight.trim() && Number.isNaN(Number.parseFloat(weight))) {
      issues.push(`Row ${rowNum} "${name}": Invalid Weight_oz "${weight}"`)
    }

    // Qty should be positive integer or empty
    const qty = row[colIndex['Qty']]
    if (qty && qty.trim()) {
      const qtyNum = Number.parseInt(qty, 10)
      if (Number.isNaN(qtyNum) || qtyNum < 1) {
        issues.push(
          `Row ${rowNum} "${name}": Invalid Qty "${qty}" (should be positive integer)`
        )
        if (FIX_MODE) {
          rows[i][colIndex['Qty']] = '1'
          fixes.push(`Row ${rowNum} "${name}": Set Qty to 1`)
        }
      }
    } else if (FIX_MODE && colIndex['Qty'] !== undefined) {
      // Auto-fill empty Qty with 1
      rows[i][colIndex['Qty']] = '1'
      fixes.push(`Row ${rowNum} "${name}": Set empty Qty to 1`)
    }

    // Validate enum fields
    for (const [field, validValues] of Object.entries(VALID_VALUES)) {
      const idx = colIndex[field]
      if (idx === undefined) continue

      const value = row[idx]?.trim() || ''
      if (value && !validValues.includes(value)) {
        // Try case-insensitive match for auto-fix
        const match = validValues.find(
          (v) => v.toLowerCase() === value.toLowerCase()
        )
        if (match && FIX_MODE) {
          rows[i][idx] = match
          fixes.push(
            `Row ${rowNum} "${name}": Fixed ${field} "${value}" → "${match}"`
          )
        } else {
          issues.push(
            `Row ${rowNum} "${name}": Invalid ${field} "${value}" (valid: ${validValues.filter((v) => v).join(', ')})`
          )
        }
      }
    }

    // Normalize Yes/No fields to title case
    if (FIX_MODE) {
      for (const field of ['Waterproof', 'Worn', 'Consumable', 'Star']) {
        const idx = colIndex[field]
        if (idx === undefined) continue

        const value = row[idx]?.trim().toLowerCase()
        if (value === 'yes' && row[idx] !== 'Yes') {
          rows[i][idx] = 'Yes'
          fixes.push(`Row ${rowNum} "${name}": Normalized ${field} to "Yes"`)
        } else if (value === 'no' && row[idx] !== 'No') {
          rows[i][idx] = 'No'
          fixes.push(`Row ${rowNum} "${name}": Normalized ${field} to "No"`)
        } else if (!value && row[idx] !== 'No') {
          // Default empty to No for boolean fields
          rows[i][idx] = 'No'
          fixes.push(`Row ${rowNum} "${name}": Set empty ${field} to "No"`)
        }
      }
    }

    // Check for trailing/leading whitespace in Name
    const nameVal = row[colIndex['Name']]
    if (nameVal && nameVal !== nameVal.trim()) {
      if (FIX_MODE) {
        rows[i][colIndex['Name']] = nameVal.trim()
        fixes.push(`Row ${rowNum}: Trimmed whitespace from Name`)
      } else {
        issues.push(
          `Row ${rowNum} "${name}": Name has leading/trailing whitespace`
        )
      }
    }
  }

  // Summary
  console.info('\n' + '='.repeat(50))

  if (issues.length === 0) {
    console.info('✅ No issues found!')
  } else {
    console.info(`\n⚠️  Found ${issues.length} issue(s):\n`)
    issues.forEach((issue) => console.info(`  • ${issue}`))
  }

  if (FIX_MODE && fixes.length > 0) {
    console.info(`\n🔧 Applied ${fixes.length} fix(es):\n`)
    fixes.forEach((fix) => console.info(`  • ${fix}`))

    writeFileSync(CSV_PATH, toCSV(rows))
    console.info(`\n💾 Saved changes to ${CSV_PATH}`)
  } else if (fixes.length === 0 && FIX_MODE) {
    console.info('\n✨ Nothing to fix!')
  } else if (issues.length > 0) {
    console.info('\n💡 Run with --fix to auto-fix some issues')
  }

  // Stats
  const dataRows = rows.length - 1
  const withWeight = rows
    .slice(1)
    .filter((r) => r[colIndex['Weight_oz']]?.trim()).length
  const starred = rows
    .slice(1)
    .filter((r) => r[colIndex['Star']]?.toLowerCase() === 'yes').length
  const worn = rows
    .slice(1)
    .filter((r) => r[colIndex['Worn']]?.toLowerCase() === 'yes').length
  const consumable = rows
    .slice(1)
    .filter((r) => r[colIndex['Consumable']]?.toLowerCase() === 'yes').length

  console.info('\n📊 Stats:')
  console.info(`  • ${dataRows} items total`)
  console.info(
    `  • ${withWeight} with weight (${dataRows - withWeight} missing)`
  )
  console.info(`  • ${starred} starred (Big 3)`)
  console.info(`  • ${worn} worn`)
  console.info(`  • ${consumable} consumable`)
  console.info('')

  process.exit(issues.length > 0 ? 1 : 0)
}

lintGear()
