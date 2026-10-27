/**
 * @file github-commits.get.ts
 * @description GET /api/github-commits. Pre-cached GitHub commit history from
 *   data/github-commits.json (written by a script, not fetched live).
 *   No cache, re-read per request. Throws (500) if the file is missing or bad JSON.
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
