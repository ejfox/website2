import { defineEventHandler } from 'h3'
import { readFile } from 'fs/promises'
import { resolve } from 'path'

export default defineEventHandler(async (event) => {
  try {
    const manifestPath = resolve(
      process.cwd(),
      'content/processed/manifest-lite.json'
    )
    console.log('Reading manifest from:', manifestPath)
    const manifestContent = await readFile(manifestPath, 'utf-8')
    const manifest = JSON.parse(manifestContent)

    // Basic validation
    if (!Array.isArray(manifest)) {
      console.error('Manifest is not an array')
      return []
    }

    // Log some stats
    console.log('Manifest stats:', {
      total: manifest.length,
      posts: manifest.filter((p) => p?.metadata?.type === 'post').length,
      weekNotes: manifest.filter((p) => p?.slug?.includes('week-notes/'))
        .length,
      hidden: manifest.filter((p) => p?.metadata?.hidden || p?.hidden).length,
      drafts: manifest.filter((p) => p?.metadata?.draft || p?.draft).length
    })

    return manifest
  } catch (error: any) {
    console.error(`Error fetching manifest:`, {
      message: error?.message,
      stack: error?.stack,
      name: error?.name
    })
    return []
  }
})
