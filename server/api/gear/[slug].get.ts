/**
 * @file gear/[slug].get.ts
 * @description Retrieves individual gear item by slug from gear.csv with slug-based lookup
 * @endpoint GET /api/gear/{slug}
 * @params slug: string - URL-friendly slug generated from gear item name
 * @returns Individual gear item data with all CSV columns
 */
import * as d3 from 'd3'
import { getRouterParam } from 'h3'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')

  if (!slug) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Slug is required',
    })
  }

  try {
    // Read the CSV file from data directory
    const csvPath = resolve('data/gear.csv')
    const csvText = await readFile(csvPath, 'utf-8')

    const gearItems = d3.csvParse(csvText as string)

    // Find the item by converting name to slug
    const foundItem = gearItems.find((item: d3.DSVRowString) => {
      const itemSlug = item.Name?.toLowerCase().replace(/[^a-z0-9]+/g, '-')
      return itemSlug === slug
    })

    if (!foundItem) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Gear item not found',
      })
    }

    return foundItem
  } catch (error) {
    const err = error as Error & { statusCode?: number }
    if (err.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch gear data',
    })
  }
})
