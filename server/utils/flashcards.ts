/**
 * @file flashcards.ts
 * @description Shared utilities for flashcard API endpoints
 */
import { readFile, readdir } from 'node:fs/promises'
import { resolve } from 'node:path'

export interface FlashcardDeck {
  id: string
  name: string
  course: string
  filename: string
  cards: string[][]
  cardCount: number
}

export interface Flashcard {
  id: string
  front: string
  back: string
  hints: string[]
  deckId: string
  deckName: string
  course: string
}

// Parse deck info from filename
export function parseDeckName(filename: string): {
  course: string
  name: string
} {
  const base = filename.replace('flashcards-', '').replace('.csv', '')

  if (base.startsWith('applied-quant')) {
    const week = base.replace('applied-quant-', '')
    return { course: 'Applied Quant', name: formatWeekName(week) }
  }
  if (base.startsWith('milstrat')) {
    const part = base.replace('milstrat-', '')
    return { course: 'Military Strategy', name: formatWeekName(part) }
  }
  if (base.startsWith('crypto')) {
    const part = base.replace('crypto-', '')
    return { course: 'Crypto', name: formatWeekName(part) }
  }

  return { course: 'Other', name: base }
}

function formatWeekName(s: string): string {
  return s
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
    .replace(/([a-z])(\d)/gi, '$1 $2')
}

// Parse CSV rows (no header assumed)
export function parseCSV(content: string): string[][] {
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

// Load all decks
export async function loadAllDecks(): Promise<FlashcardDeck[]> {
  const dir = resolve('public/data/flashcards')
  const files = await readdir(dir)
  const decks: FlashcardDeck[] = []

  for (const file of files) {
    if (!file.endsWith('.csv')) continue
    if (file === 'all-cards.csv') continue

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

  decks.sort((a, b) => {
    if (a.course !== b.course) return a.course.localeCompare(b.course)
    return a.name.localeCompare(b.name, undefined, { numeric: true })
  })

  return decks
}

// Load a single deck by ID
export async function loadDeck(deckId: string): Promise<FlashcardDeck | null> {
  const dir = resolve('public/data/flashcards')
  const filename = `${deckId}.csv`

  try {
    const content = await readFile(resolve(dir, filename), 'utf-8')
    const cards = parseCSV(content).filter((row) => row[0]?.trim())
    const { course, name } = parseDeckName(filename)

    return {
      id: deckId,
      name,
      course,
      filename,
      cards,
      cardCount: cards.length,
    }
  } catch {
    return null
  }
}

// Convert raw card array to Flashcard object
export function cardToFlashcard(
  card: string[],
  index: number,
  deck: FlashcardDeck
): Flashcard {
  return {
    id: `${deck.id}-${index}`,
    front: card[0] || '',
    back: card[1] || '',
    hints: card.slice(2).filter(Boolean),
    deckId: deck.id,
    deckName: deck.name,
    course: deck.course,
  }
}

// Get all cards as Flashcard objects
export async function getAllCards(): Promise<Flashcard[]> {
  const decks = await loadAllDecks()
  const cards: Flashcard[] = []

  for (const deck of decks) {
    deck.cards.forEach((card, i) => {
      cards.push(cardToFlashcard(card, i, deck))
    })
  }

  return cards
}

// Get random item from array
export function randomItem<T>(arr: T[]): T | null {
  if (arr.length === 0) return null
  return arr[Math.floor(Math.random() * arr.length)]
}
