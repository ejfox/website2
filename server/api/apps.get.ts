/**
 * @file apps.get.ts
 * @description GET /api/apps. The apps EJ has made, from data/apps.json, each with
 *   `store` = live App Store details ({ url, version, updated, icon }) or null.
 *   Used by pages/apps and pages/projects/[slug].
 *   Cached 6h with swr: the store changes slowly and Apple's iTunes lookup API is
 *   free but shouldn't be hit per request. A failed lookup just nulls `store`;
 *   a missing or bad apps.json throws.
 */
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

interface AppEntry {
  slug: string
  name: string
  line: string
  platforms: string[]
  status: 'app-store' | 'unreleased' | 'open-source'
  appStoreId?: string
  github?: string
  note?: string
}

interface StoreDetails {
  url: string
  version: string
  updated: string | null
  icon: string | null
}

async function lookup(id: string): Promise<StoreDetails | null> {
  try {
    const res = await $fetch<{ results?: any[] }>(
      'https://itunes.apple.com/lookup',
      // Apple serves this JSON as text/javascript, so force a JSON parse.
      { query: { id }, timeout: 8000, parseResponse: JSON.parse }
    )
    const app = res.results?.[0]
    if (!app) return null
    return {
      url: String(app.trackViewUrl || '').split('?')[0],
      version: app.version,
      updated: app.currentVersionReleaseDate || null,
      icon: app.artworkUrl512 || app.artworkUrl100 || null,
    }
  } catch {
    return null
  }
}

export default defineCachedEventHandler(
  async () => {
    const apps: AppEntry[] = JSON.parse(
      await readFile(join(process.cwd(), 'data/apps.json'), 'utf8')
    )
    return Promise.all(
      apps.map(async (a) => ({
        ...a,
        store: a.appStoreId ? await lookup(a.appStoreId) : null,
      }))
    )
  },
  { maxAge: 21600, swr: true, name: 'apps' }
)
