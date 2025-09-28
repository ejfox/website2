import { readFile } from 'fs/promises'
import { resolve } from 'path'

export default defineEventHandler(async () => {
  try {
    // Read the CSV file from public directory
    const csvPath = resolve('public/gear.csv')
    const csvContent = await readFile(csvPath, 'utf-8')

    return csvContent
  } catch (error) {
    console.error('Error reading gear.csv:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to load gear data'
    })
  }
})
