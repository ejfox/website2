/**
 * @file github-repos-list.get.ts
 * @description Serves pre-cached GitHub repository list from JSON file
 * @endpoint GET /api/github-repos-list
 * @returns Parsed JSON data containing list of GitHub repositories
 */
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

export default defineEventHandler(() => {
  const data = readFileSync(
    join(process.cwd(), 'data/github-repos-list.json'),
    'utf-8'
  )
  return JSON.parse(data)
})
