/**
 * @file github-commits.get.ts
 * @description Serves pre-cached GitHub commit data from JSON file
 * @endpoint GET /api/github-commits
 * @returns Parsed JSON data containing GitHub commit history
 */
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

export default defineEventHandler(() => {
  const data = readFileSync(
    join(process.cwd(), 'data/github-commits.json'),
    'utf-8'
  )
  return JSON.parse(data)
})
