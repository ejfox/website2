import { defineEventHandler } from 'h3'
import { readFile } from 'fs/promises'
import { resolve } from 'path'

export default defineEventHandler(async (event) => {
  try {
    const manifestPath = resolve(
      process.cwd(),
      'dist/processed/manifest-lite.json'
    )
    const manifestContent = await readFile(manifestPath, 'utf-8')
    return JSON.parse(manifestContent)
  } catch (error) {
    console.error(`Error fetching manifest: ${error.message}`)
    event.res.statusCode = 500
    return { error: 'Unable to fetch manifest' }
  }
})
