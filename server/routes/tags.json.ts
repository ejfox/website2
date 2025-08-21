import { defineEventHandler, setHeader } from 'h3'
import { readFile } from 'fs/promises'
import path from 'path'

export default defineEventHandler(async (event) => {
  setHeader(event, 'content-type', 'application/json')
  setHeader(event, 'cache-control', 'public, max-age=3600')
  
  try {
    // Load base tags and content usage
    const baseTagsPath = path.join(process.cwd(), 'public/tags.json')
    const baseTags = JSON.parse(await readFile(baseTagsPath, 'utf-8'))
    
    let contentTagUsage = {}
    try {
      const contentTagsPath = path.join(process.cwd(), 'public/content-tags.json')
      contentTagUsage = JSON.parse(await readFile(contentTagsPath, 'utf-8'))
    } catch {}
    
    // Journalist pyramid: !tags first, then content tags by usage, then unused base tags
    console.log('Content tags found:', Object.keys(contentTagUsage).length)
    const allTags = new Set([...baseTags, ...Object.keys(contentTagUsage)])
    const specialTags = Array.from(allTags).filter(t => t.startsWith('!')).sort()
    const usedTags = Object.entries(contentTagUsage)
      .filter(([tag]) => !tag.startsWith('!'))
      .sort(([,a], [,b]) => b - a)
      .map(([tag]) => tag)
    const unusedTags = baseTags.filter(t => !t.startsWith('!') && !contentTagUsage[t]).sort()
    console.log('Special:', specialTags.length, 'Used:', usedTags.length, 'Unused:', unusedTags.length)
    
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