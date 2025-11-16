import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import * as d3 from 'd3'

interface GearItem {
  Name?: string
  Type?: string
  Weight_oz?: string
  'Parent Container'?: string
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

    // Calculate total weight
    const totalWeight = gearItems.reduce((sum, item) => {
      const weightStr = item.Weight_oz
      const weightNum =
        weightStr && weightStr.trim() !== '' ? Number.parseFloat(weightStr) : 0
      return sum + (Number.isNaN(weightNum) ? 0 : weightNum)
    }, 0)

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
        containerCount
      },
      typeDistribution,
      lastUpdated: new Date().toISOString()
    }
  } catch (error) {
    console.error('Error processing gear data:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to process gear data'
    })
  }
})
