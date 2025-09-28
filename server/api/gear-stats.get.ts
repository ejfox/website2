import { readFile } from 'fs/promises'
import { resolve } from 'path'
import * as d3 from 'd3'

interface GearItem {
  Name?: string
  Type?: string
  'Base Weight ()'?: string
  'Parent Container'?: string
  'Time Criticality (T)'?: string
  'Consequence Severity (C)'?: string
  'Weight/Space Penalty (W)'?: string
  'Multi-Use Factor (M)'?: string
}

export default defineEventHandler(async (_event) => {
  try {
    // Read the CSV file from public directory
    const csvPath = resolve(process.cwd(), 'public/gear.csv')
    const csvText = await readFile(csvPath, 'utf-8')

    // Parse CSV using d3
    const gearItems = d3.csvParse(csvText) as GearItem[]

    // Calculate total items
    const totalItems = gearItems.length

    // Calculate total weight
    const totalWeight = gearItems.reduce((sum, item) => {
      const weightStr = item['Base Weight ()']
      const weightNum =
        weightStr && weightStr.trim() !== '' ? parseFloat(weightStr) : 0
      return sum + (isNaN(weightNum) ? 0 : weightNum)
    }, 0)

    // Calculate container count
    const containers = gearItems
      .map((item) => item['Parent Container'])
      .filter((container) => container && container.trim() !== '')
    const containerCount = new Set(containers).size

    // Calculate average TCWM score
    const validScores = gearItems
      .map((item) => {
        const T = Number(item['Time Criticality (T)']) || 0
        const C = Number(item['Consequence Severity (C)']) || 0
        const W = Number(item['Weight/Space Penalty (W)']) || 0
        const M = Number(item['Multi-Use Factor (M)']) || 0
        return 2 * T + 2 * C + 1.5 * W + M
      })
      .filter((score) => score > 0)

    const avgTCWMScore =
      validScores.length > 0
        ? validScores.reduce((a, b) => a + b, 0) / validScores.length
        : 0

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
        totalWeight: parseFloat(totalWeight.toFixed(1)),
        containerCount,
        avgTCWMScore: parseFloat(avgTCWMScore.toFixed(1))
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
