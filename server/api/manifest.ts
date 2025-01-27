import { defineEventHandler, createError } from 'h3'
import { readFile } from 'fs/promises'
import path from 'path'
import { resolve } from 'path'

interface Post {
  slug?: string
  type?: string
  title?: string
  hidden?: boolean
  draft?: boolean
  metadata?: {
    type?: string
    slug?: string
  }
}

export default defineEventHandler(async (event) => {
  try {
    const manifest = await readManifest()

    // Simple check for projects
    const projectSlugs = manifest
      .filter((p: Post) => p.slug?.startsWith('projects/'))
      .map((p: Post) => p.slug)

    console.log('Manifest endpoint check:', {
      total: manifest.length,
      projectSlugs,
      // Log a sample project if we have one
      sampleProject: manifest.find((p: Post) => p.slug?.startsWith('projects/'))
    })

    return manifest
  } catch (error: any) {
    console.error('Error in manifest endpoint:', error)
    throw createError({
      statusCode: 500,
      message: `Failed to read manifest: ${error.message}`
    })
  }
})

async function readManifest() {
  const manifestPath = resolve(
    process.cwd(),
    'content/processed/manifest-lite.json'
  )
  try {
    const content = await readFile(manifestPath, 'utf8')
    return JSON.parse(content)
  } catch (error: any) {
    console.error('Error reading manifest file:', error)
    throw error
  }
}
