/**
 * @file flashcards.get.ts
 * @description Serves flashcard decks with metadata
 * @endpoint GET /api/flashcards
 * @returns Array of deck objects with name, course, cards
 */
import { readFile, readdir } from 'node:fs/promises'
import { resolve } from 'node:path'

interface Deck {
  id: string
  name: string
  course: string
  filename: string
  cards: string[][]
  cardCount: number
}

// Parse deck info from filename
function parseDeckName(filename: string): { course: string; name: string } {
  // flashcards-applied-quant-week01.csv -> Applied Quant, Week 01
  const base = filename.replace('flashcards-', '').replace('.csv', '')

  if (base.startsWith('applied-quant')) {
    const week = base.replace('applied-quant-', '')
    return {
      course: 'Applied Quant',
      name: formatWeekName(week),
    }
  }
  if (base.startsWith('milstrat')) {
    const part = base.replace('milstrat-', '')
    return {
      course: 'Military Strategy',
      name: formatWeekName(part),
    }
  }
  if (base.startsWith('crypto')) {
    const part = base.replace('crypto-', '')
    return {
      course: 'Crypto',
      name: formatWeekName(part),
    }
  }

  return { course: 'Other', name: base }
}

function formatWeekName(s: string): string {
  return (
    s
      .split('-')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ')
      // Insert space before numbers: "Week01" -> "Week 01"
      .replace(/([a-z])(\d)/gi, '$1 $2')
  )
}

// Parse CSV rows (no header assumed)
function parseCSV(content: string): string[][] {
  const rows: string[][] = []
  let current = ''
  let inQuotes = false
  let row: string[] = []

  for (let i = 0; i < content.length; i++) {
    const char = content[i]
    const next = content[i + 1]

    if (char === '"') {
      if (inQuotes && next === '"') {
        current += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
    } else if (char === ',' && !inQuotes) {
      row.push(current.trim())
      current = ''
    } else if ((char === '\n' || char === '\r') && !inQuotes) {
      if (char === '\r' && next === '\n') i++
      row.push(current.trim())
      if (row.some((cell) => cell)) rows.push(row)
      row = []
      current = ''
    } else {
      current += char
    }
  }

  if (current || row.length) {
    row.push(current.trim())
    if (row.some((cell) => cell)) rows.push(row)
  }

  return rows
}

export default defineEventHandler(async () => {
  try {
    const dir = resolve('public/data/flashcards')
    const files = await readdir(dir)

    const decks: Deck[] = []

    for (const file of files) {
      if (!file.endsWith('.csv')) continue
      if (file === 'all-cards.csv') continue // Skip combined file

      const content = await readFile(resolve(dir, file), 'utf-8')
      const cards = parseCSV(content).filter((row) => row[0]?.trim())
      const { course, name } = parseDeckName(file)

      decks.push({
        id: file.replace('.csv', ''),
        name,
        course,
        filename: file,
        cards,
        cardCount: cards.length,
      })
    }

    // Sort by course, then by name
    decks.sort((a, b) => {
      if (a.course !== b.course) return a.course.localeCompare(b.course)
      return a.name.localeCompare(b.name, undefined, { numeric: true })
    })

    return decks
  } catch (error) {
    console.error('Error reading flashcard decks:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to load flashcard decks',
    })
  }
})
