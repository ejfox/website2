/**
 * @file cameras.get.ts
 * @description Public NYSDOT / 511NY traffic cameras for the Valley Atlas
 * (/atlas), from EJ's camwatch app.
 * @endpoint GET /api/atlas/cameras
 *
 * DOT cameras only (camwatch's private webcams list is skipped). A snapshot
 * URL is passed on only when it's https on a public DOT/511 host and camwatch
 * hasn't marked the feed as a placeholder or broken; never camwatch's proxy.
 */
import { fetchSmallweb } from '../../utils/smallweb'

interface Camera {
  source?: string | null
  name?: string | null
  road?: string | null
  direction?: string | null
  latitude?: number | null
  longitude?: number | null
  image_url?: string | null
  last_checked?: string | null
  is_active?: number | boolean | null
  feed_status?: string | null
}

const BBOX = { west: -75.6, east: -72.6, south: 40.7, north: 42.9 }
const CACHE_MS = 10 * 60e3
const SOURCES: Record<string, string> = { '511NY': '511NY', NYSDOT: 'NYSDOT' }
const BAD_FEED = new Set(['placeholder', 'error'])

/** Public DOT/511 image hosts; keep in sync with utils/atlas/layers/cameras */
export const SNAPSHOT_HOSTS = [
  '511ny.org',
  '511nj.org',
  'dot.ny.gov',
  'nysdot.skyvdn.com',
]
export const isPublicSnapshot = (url: unknown): url is string => {
  if (typeof url !== 'string') return false
  try {
    const u = new URL(url)
    return (
      u.protocol === 'https:' &&
      !u.username &&
      !u.password &&
      SNAPSHOT_HOSTS.some(
        (h) => u.hostname === h || u.hostname.endsWith(`.${h}`)
      )
    )
  } catch {
    return false
  }
}

const clean = (s: unknown, max = 80) =>
  typeof s === 'string' && s.trim() ? s.trim().slice(0, max) : null

// camwatch timestamps are UTC without a zone ("2026-09-30 16:55:02")
const iso = (s: unknown) => {
  if (typeof s !== 'string') return null
  const t = Date.parse(/[z+]/i.test(s) ? s : `${s.replace(' ', 'T')}Z`)
  return Number.isFinite(t) ? new Date(t).toISOString() : null
}

export function toCameras(cameras: Camera[]) {
  const features = []
  for (const c of cameras) {
    const source = c.source ? SOURCES[c.source] : undefined
    if (!source || !c.is_active) continue
    const lon = c.longitude
    const lat = c.latitude
    if (typeof lon !== 'number' || typeof lat !== 'number') continue
    if (lon < BBOX.west || lon > BBOX.east) continue
    if (lat < BBOX.south || lat > BBOX.north) continue
    const snapshot =
      isPublicSnapshot(c.image_url) && !BAD_FEED.has(c.feed_status ?? '')
        ? c.image_url
        : null
    features.push({
      type: 'Feature' as const,
      geometry: {
        type: 'Point' as const,
        coordinates: [+lon.toFixed(5), +lat.toFixed(5)],
      },
      properties: {
        name: clean(c.name) ?? 'Traffic camera',
        road: clean(c.road),
        direction: clean(c.direction, 20),
        source,
        snapshot,
        lastChecked: iso(c.last_checked),
      },
    })
  }
  return { type: 'FeatureCollection' as const, features }
}

type Cameras = ReturnType<typeof toCameras>
let cache: { at: number; data: Cameras } | null = null
let pending: Promise<Cameras> | null = null

export default defineEventHandler(async () => {
  if (cache && Date.now() - cache.at < CACHE_MS)
    return { cameras: cache.data, fetched: new Date(cache.at).toISOString() }
  pending ??= fetchSmallweb<{ cameras?: Camera[] }>('camwatch', '/api/cameras')
    .then((r) => toCameras(r.cameras ?? []))
    .finally(() => (pending = null))
  try {
    const data = await pending
    cache = { at: Date.now(), data }
    return { cameras: data, fetched: new Date(cache.at).toISOString() }
  } catch (e) {
    return {
      cameras: cache?.data ?? { type: 'FeatureCollection', features: [] },
      fetched: cache ? new Date(cache.at).toISOString() : null,
      errors: { cameras: e instanceof Error ? e.message : String(e) },
    }
  }
})
