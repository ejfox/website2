/**
 * @file tags.json.ts
 * @description GET /tags.json — the tag vocabulary in "journalist pyramid"
 *   order: `!`-special tags, then content tags by usage count, then unused
 *   base tags. Merges public/tags.json (base vocabulary) with
 *   public/content-tags.json (usage counts written by `yarn blog:process`).
 *   Read by pages/bookmarklet-popup.vue and pages/sitemap.vue.
 *
 * Gotcha: public/tags.json lives at the SAME URL. In production the response
 *   looks like that static file (alphabetical, with static-file etag /
 *   last-modified, no `max-age=3600`), so this handler appears to be shadowed
 *   by Nitro's public-asset serving. Check before relying on the ordering.
 */
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
    // console.log('Content tags found:', contentTagKeys.length)
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
    // console.log(
    //   'Special:',
    //   specialTags.length,
    //   'Used:',
    //   usedTags.length,
    //   'Unused:',
    //   unusedTags.length
    // )

    return [...specialTags, ...usedTags, ...unusedTags]
  } catch (error) {
    // Degrade, don't fail: unordered base tags, then a hardcoded stub, so the
    // bookmarklet's tag list (pages/bookmarklet-popup.vue) never gets a 500.
    console.error('Error loading tags:', error)
    try {
      const baseTagsPath = path.join(process.cwd(), 'public/tags.json')
      return JSON.parse(await readFile(baseTagsPath, 'utf-8'))
    } catch {
      return ['code', 'web', 'tools', 'automation']
    }
  }
})
