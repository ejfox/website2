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
      types: [...new Set(data?.map((p: { type: string }) => p.type))].slice(
        0,
        5
      )
    })

    return data
  } catch (error) {
    const err = error as NodeJS.ErrnoException
    if (err.code === 'ENOENT') {
      console.error('Manifest file not found:', err.path)
      return {
        error:
          'Manifest file not found. Please ensure the file exists at the specified path.'
      }
    }
    console.error('Error reading manifest:', err)
    throw err
  }
})
