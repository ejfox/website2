/**
 * @file api-catalog.test.ts
 * @description Guards utils/apiCatalog.ts (which powers /api-docs and
 * /openapi.json) against drift. Fails if a route file exists with no catalog
 * entry, or a catalog entry points at a route file that doesn't exist. Keeps the
 * public docs from quietly lying about what the API is.
 */
import { describe, it, expect } from 'vitest'
import { readdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import { apiCatalog } from '../../../utils/apiCatalog'

const ROOT = fileURLToPath(new URL('../../../', import.meta.url))
const API_DIR = join(ROOT, 'server/api')

function walk(dir: string): string[] {
  const out: string[] = []
  for (const name of readdirSync(dir)) {
    const full = join(dir, name)
    if (statSync(full).isDirectory()) {
      if (name === '__tests__') continue
      out.push(...walk(full))
    } else if (name.endsWith('.ts')) {
      out.push(full)
    }
  }
  return out
}

// Normalize dynamic segments so [slug], [...slug] and {slug} all compare equal.
function normalize(path: string): string {
  return path.replace(/\[[^\]]+\]|\{[^}]+\}/g, '{}')
}

function fileToUrl(file: string): string {
  const p = relative(API_DIR, file)
    .replace(/\\/g, '/')
    .replace(/\.(get|post|put|patch|delete)\.ts$/, '')
    .replace(/\.ts$/, '')
  return normalize('/api/' + p)
}

describe('apiCatalog matches the filesystem', () => {
  const fsRoutes = new Set(walk(API_DIR).map(fileToUrl))
  const catalogRoutes = new Set(apiCatalog.map((r) => normalize(r.path)))

  it('every route file has a catalog entry', () => {
    const missing = [...fsRoutes].filter((r) => !catalogRoutes.has(r))
    expect(
      missing,
      `Route files with no entry in utils/apiCatalog.ts: ${missing.join(', ')}`
    ).toEqual([])
  })

  it('every catalog entry points at a real route file', () => {
    const phantom = [...catalogRoutes].filter((r) => !fsRoutes.has(r))
    expect(
      phantom,
      `Catalog entries with no matching route file: ${phantom.join(', ')}`
    ).toEqual([])
  })
})
