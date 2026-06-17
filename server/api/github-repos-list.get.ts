/**
 * @file github-repos-list.get.ts
 * @description Serves pre-cached GitHub repository list from JSON file, annotated
 *              with `hasNetwork` so the listing UI can flag repos with code-network data.
 * @endpoint GET /api/github-repos-list
 * @returns Parsed JSON array of repositories, each with optional hasNetwork boolean
 */
import { readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'

const LIST_PATH = join(process.cwd(), 'data/github-repos-list.json')
const REPOS_DIR = join(process.cwd(), 'data/github-repos')

// Enriched list cached at module load (re-evaluated on dev hot reload + per cold prod boot)
const enriched = (() => {
  try {
    const raw = JSON.parse(readFileSync(LIST_PATH, 'utf-8'))
    return raw.map((r: { name: string }) => ({
      ...r,
      hasNetwork: existsSync(join(REPOS_DIR, `${r.name}.network.json`)),
    }))
  } catch {
    return []
  }
})()

export default defineEventHandler(() => enriched)
