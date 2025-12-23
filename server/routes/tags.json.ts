/* eslint-disable no-console */
import { defineEventHandler, setHeader } from 'h3'
import { readFile } from 'node:fs/promises'
import path from 'node:path'

export default defineEventHandler(async (event) => {
  setHeader(event, 'content-type', 'application/json')
  setHeader(event, 'cache-control', 'public, max-age=3600')

  try {
    // Load base tags and content usage
    const baseTagsPath = path.join(process.cwd(), 'public/tags.json')
    const baseTags = JSON.parse(await readFile(baseTagsPath, 'utf-8'))

    let contentTagUsage = {}
    try {
      const contentTagsPath = path.join(
        process.cwd(),
        'public/content-tags.json'
      )
      contentTagUsage = JSON.parse(await readFile(contentTagsPath, 'utf-8'))
    } catch {
      // content-tags.json is optional, use empty object if not found
    }

    // Journalist pyramid: !tags first, then content tags by usage,
    // then unused base tags
    const contentTagKeys = Object.keys(contentTagUsage)
    console.log('Content tags found:', contentTagKeys.length)
    const allTags = new Set([...baseTags, ...contentTagKeys])
    const specialTags = Array.from(allTags)
      .filter((t) => t.startsWith('!'))
      .sort()
    const usedTags = Object.entries(contentTagUsage)
      .filter(([tag]) => !tag.startsWith('!'))
      .sort(([, a], [, b]) => (b as number) - (a as number))
      .map(([tag]) => tag)
    const unusedTags = baseTags
      .filter(
        (t: string) =>
          !t.startsWith('!') && !(contentTagUsage as Record<string, number>)[t]
      )
      .sort()
    console.log(
      'Special:',
      specialTags.length,
      'Used:',
      usedTags.length,
      'Unused:',
      unusedTags.length
    )

    return [...specialTags, ...usedTags, ...unusedTags]
  } catch (error) {
    console.error('Error loading tags:', error)
    try {
      const baseTagsPath = path.join(process.cwd(), 'public/tags.json')
      return JSON.parse(await readFile(baseTagsPath, 'utf-8'))
    } catch {
      return ['code', 'web', 'tools', 'automation']
    }
  }
})
