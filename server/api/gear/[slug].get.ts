import * as d3 from 'd3'
import { getRouterParam } from 'h3'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')

  if (!slug) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Slug is required'
    })
  }

  try {
    // Read the CSV file from data directory
    const csvPath = resolve('data/gear.csv')
    const csvText = await readFile(csvPath, 'utf-8')

    const gearItems = d3.csvParse(csvText as string)

    // Find the item by converting name to slug
    const foundItem = gearItems.find((item: any) => {
      const itemSlug = item.Name?.toLowerCase().replace(/[^a-z0-9]+/g, '-')
      return itemSlug === slug
    })

    if (!foundItem) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Gear item not found'
      })
    }

    return foundItem
  } catch (error: any) {
    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch gear data'
    })
  }
})
