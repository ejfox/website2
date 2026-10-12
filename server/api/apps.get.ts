/**
 * @file apps.get.ts
 * @description The apps EJ has made, from data/apps.json, with live App Store
 * details (version, icon, last update) for the ones that are in the store.
 * Cached 6h with swr: the store changes slowly and Apple's lookup API is
 * free but shouldn't be hit per request.
 * @endpoint GET /api/apps
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
