/**
 * @file gear.get.ts
 * @description Parses gear.csv and returns all gear items with generated slugs, sorted alphabetically
 * @endpoint GET /api/gear
 * @returns Array of gear items with slugs, count, and last updated timestamp
 */
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import * as d3 from 'd3'

interface GearItem {
  Name?: string
  Type?: string
  'Base Weight ()'?: string
  'Parent Container'?: string
  Notes?: string
}

interface GearItemWithSlug extends GearItem {
  slug: string
}

function createSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-')
}

export default defineEventHandler(async (_event) => {
  try {
    // Read the CSV file from data directory
    const csvPath = resolve(process.cwd(), 'data/gear.csv')
    const csvText = await readFile(csvPath, 'utf-8')

    // Parse CSV using d3
    const gearItems = d3.csvParse(csvText) as GearItem[]

    // Add slugs and filter out items without names
    const itemsWithSlugs: GearItemWithSlug[] = gearItems
      .filter((item) => item.Name && item.Name.trim() !== '')
      .map((item) => ({
        ...item,
        slug: createSlug(item.Name!),
      }))
      .sort((a, b) => (a.Name || '').localeCompare(b.Name || ''))

    return {
      items: itemsWithSlugs,
      count: itemsWithSlugs.length,
      lastUpdated: new Date().toISOString(),
    }
  } catch (error) {
    console.error('Error loading gear data:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to load gear data',
    })
  }
})
