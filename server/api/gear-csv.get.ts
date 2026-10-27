/**
 * @file gear-csv.get.ts
 * @description GET /api/gear-csv. The raw data/gear.csv text, every column,
 *   for pages/gear and GearStats.vue. No cache. Throws 500 if the file is missing.
 *   Public: anything added to the CSV (including Location_* columns) ships here.
 */
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
