/**
 * @file gear-stats.get.ts
 * @description Calculates statistics from gear.csv including total weight, item counts, and type distribution
 * @endpoint GET /api/gear-stats
 * @returns Gear statistics with total items, total weight (oz), container count, and type distribution
 */
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import * as d3 from 'd3'

interface GearItem {
  Name?: string
  Weight_oz?: string
  'Parent Container'?: string
  Type?: string
  Category?: string
  Worn?: string
  Qty?: string
  Consumable?: string
  Star?: string
}

export default defineEventHandler(async (_event) => {
  try {
    // Read the CSV file from data directory
    const csvPath = resolve(process.cwd(), 'data/gear.csv')
    const csvText = await readFile(csvPath, 'utf-8')

    // Parse CSV using d3
    const gearItems = d3.csvParse(csvText) as GearItem[]

    // Calculate total items
    const totalItems = gearItems.length

    // Helper to parse weight with quantity multiplier
    const getItemWeight = (item: GearItem): number => {
      const weightStr = item.Weight_oz
      const weightNum =
        weightStr && weightStr.trim() !== '' ? Number.parseFloat(weightStr) : 0
      const qty = item.Qty ? Number.parseInt(item.Qty, 10) : 1
      const validQty = Number.isNaN(qty) ? 1 : qty
      return Number.isNaN(weightNum) ? 0 : weightNum * validQty
    }

    // Calculate total weight
    const totalWeight = gearItems.reduce(
      (sum, item) => sum + getItemWeight(item),
      0
    )

    // Calculate worn weight (items with Worn=Yes)
    const wornWeight = gearItems
      .filter((item) => item.Worn?.toLowerCase() === 'yes')
      .reduce((sum, item) => sum + getItemWeight(item), 0)

    // Calculate consumable weight (items with Consumable=Yes)
    const consumableWeight = gearItems
      .filter((item) => item.Consumable?.toLowerCase() === 'yes')
      .reduce((sum, item) => sum + getItemWeight(item), 0)

    // Calculate base weight (total - worn - consumable)
    const baseWeight = totalWeight - wornWeight - consumableWeight

    // Calculate total pack weight (base + consumable, excludes worn)
    const totalPackWeight = baseWeight + consumableWeight

    // Calculate skin-out weight (everything)
    const skinOutWeight = totalWeight

    // Count starred items (Big 3 or key items)
    const starredItems = gearItems.filter(
      (item) => item.Star?.toLowerCase() === 'yes'
    )
    const starredCount = starredItems.length
    const starredWeight = starredItems.reduce(
      (sum, item) => sum + getItemWeight(item),
      0
    )

    // Calculate container count
    const containers = gearItems
      .map((item) => item['Parent Container'])
      .filter((container) => container && container.trim() !== '')
    const containerCount = new Set(containers).size

    // Calculate type distribution
    const typeDistribution = gearItems.reduce(
      (acc: Record<string, number>, item) => {
        if (item.Type) {
          acc[item.Type] = (acc[item.Type] || 0) + 1
        }
        return acc
      },
      {}
    )

    return {
      stats: {
        totalItems,
        totalWeight: Number.parseFloat(totalWeight.toFixed(1)),
        containerCount,
      },
      // LighterPack-style weight categories (all in oz)
      weightCategories: {
        baseWeight: Number.parseFloat(baseWeight.toFixed(1)),
        wornWeight: Number.parseFloat(wornWeight.toFixed(1)),
        consumableWeight: Number.parseFloat(consumableWeight.toFixed(1)),
        totalPackWeight: Number.parseFloat(totalPackWeight.toFixed(1)),
        skinOutWeight: Number.parseFloat(skinOutWeight.toFixed(1)),
      },
      // Starred items (Big 3 / key gear)
      starred: {
        count: starredCount,
        weight: Number.parseFloat(starredWeight.toFixed(1)),
        items: starredItems.map((item) => item.Name),
      },
      typeDistribution,
      lastUpdated: new Date().toISOString(),
    }
  } catch (error) {
    console.error('Error processing gear data:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to process gear data',
    })
  }
})
