/**
 * @file manifest.ts
 * @description Serves the processed blog post manifest containing all published posts and projects
 * @endpoint GET /api/manifest
 * @returns Array of post metadata from manifest-lite.json
 */
import { defineEventHandler, createError } from 'h3'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

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

export default defineEventHandler(async () => {
  try {
    const manifest = await readManifest()

    // Simple check for projects
    const _projectSlugs = manifest
      .filter((p: Post) => p.slug?.startsWith('projects/'))
      .map((p: Post) => p.slug)

    // console.log('Manifest endpoint check:', {
    //   total: manifest.length,
    //   projectSlugs,
    //   sampleProject: manifest.find(
    //     (p: Post) => p.slug?.startsWith('projects/')
    //   )
    // })

    return manifest
  } catch (error) {
    console.error('Error in manifest endpoint:', error)
    const err = error as Error
    throw createError({
      statusCode: 500,
      message: `Failed to read manifest: ${err.message}`,
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
  } catch (error) {
    console.error('Error reading manifest file:', error)
    throw error
  }
}
