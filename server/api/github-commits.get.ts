import { readFileSync } from 'node:fs'
import { join } from 'node:path'

export default defineEventHandler(() => {
  const data = readFileSync(
    join(process.cwd(), 'data/github-commits.json'),
    'utf-8'
  )
  return JSON.parse(data)
})
