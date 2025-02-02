import { defineEventHandler } from 'h3'
import { readFile } from 'fs/promises'
import path from 'path'

export default defineEventHandler(async () => {
  try {
    const manifestPath = path.join(
      process.cwd(),
      'content/processed/manifest-lite.json'
    )
    console.log('Reading manifest from:', manifestPath)

    const rawData = await readFile(manifestPath, 'utf-8')
    const data = JSON.parse(rawData)

    console.log('Manifest loaded:', {
      total: data?.length,
      types: [...new Set(data?.map((p) => p.type))].slice(0, 5)
    })

    return data
  } catch (error) {
    console.error('Error reading manifest:', error)
    throw error
  }
})
