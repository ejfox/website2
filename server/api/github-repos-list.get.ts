/**
 * @file github-repos-list.get.ts
 * @description GET /api/github-repos-list. The pre-cached repo list from
 *   data/github-repos-list.json, each repo annotated with `hasNetwork` (whether
 *   data/github-repos/<name>.network.json exists) so the listing can flag repos
 *   with code-network data. Built once at module load. Returns [] on any error.
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
