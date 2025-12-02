import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

export default defineEventHandler(async () => {
  try {
    // Read the CSV file from data directory
    const csvPath = resolve('data/gear.csv')
    const csvContent = await readFile(csvPath, 'utf-8')

    return csvContent
  } catch (error) {
    console.error('Error reading gear.csv:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to load gear data',
    })
  }
})
