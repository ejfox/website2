/**
 * @file travels.get.ts
 * @description PRIVATE Valley Atlas layer: "where I've been", a coarse heat
 * of time spent on EJ's trips, from his travels app.
 * @endpoint GET /api/atlas/private/travels (404 unless the atlas is unlocked)
 *
 * travels' own /api/heatmap has no timestamps (and ~500 m cells), so this
 * rebuilds the heat from each trip's timestamped path instead:
 * - weight = minutes spent, from the gap to the next path point (capped 60)
 * - points from the last 7 days are dropped: never live, never recent
 * - snapped to a ~2 km grid; only cell centres + weights leave the server
 * - cells within HOME_RADIUS_KM of any ATLAS_HOME_EXCLUDE point
 *   ("lat,lon;lat,lon", kept in env because this repo is public) are
 *   dropped. Without that env the route fails closed and returns nothing
 *
 * Not defineCachedEventHandler: a cached handler can answer without running
 * requireAtlasPrivate. The upstream fetch is memoized in-process instead.
 */
import { requireAtlasPrivate } from '~/server/utils/atlasPrivate'
import { serverEnv } from '~/server/utils/serverEnv'
import { fetchSmallweb } from '~/server/utils/smallweb'

interface TripPath {
  path: [number, number][]
  timestamps: number[]
}

const DAY = 864e5
const CACHE_MS = 60 * 60e3
const HOME_RADIUS_KM = 3
const CELL_KM = 2
const LAT_STEP = CELL_KM / 110.574

export const parseHomes = (env: string): [number, number][] =>
  env
    .split(';')
    .map((p) => p.split(',').map(Number))
    .filter(
      (p): p is [number, number] =>
        p.length === 2 && p.every((n) => Number.isFinite(n))
    )

const km = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const r = Math.PI / 180
  const a =
    Math.sin(((lat2 - lat1) * r) / 2) ** 2 +
    Math.cos(lat1 * r) *
      Math.cos(lat2 * r) *
      Math.sin(((lon2 - lon1) * r) / 2) ** 2
  return 12742 * Math.asin(Math.sqrt(a))
}

/** ~2 km cell: rows of fixed latitude, columns widened by 1/cos(lat) */
const cellOf = (lon: number, lat: number) => {
  const row = Math.round(lat / LAT_STEP)
  const cLat = row * LAT_STEP
  const lonStep = LAT_STEP / Math.max(0.05, Math.cos((cLat * Math.PI) / 180))
  const col = Math.round(lon / lonStep)
  return { key: `${row},${col}`, lon: col * lonStep, lat: cLat }
}

export function travelHeat(
  trips: TripPath[],
  homes: [number, number][],
  now = Date.now()
) {
  const cutoff = (now - 7 * DAY) / 1000
  const cells = new Map<string, { lon: number; lat: number; w: number }>()
  for (const t of trips) {
    const { path = [], timestamps = [] } = t
    for (let i = 0; i < path.length - 1; i++) {
      const ts = timestamps[i]
      const next = timestamps[i + 1]
      // Untimed or recent points never count
      if (typeof ts !== 'number' || typeof next !== 'number') continue
      if (!Number.isFinite(ts) || !Number.isFinite(next)) continue
      if (ts >= cutoff || next >= cutoff) continue
      const mins = Math.min(Math.max(0, (next - ts) / 60), 60)
      if (!mins) continue
      const pt = path[i]
      if (!pt) continue
      const [lon, lat] = pt
      if (!Number.isFinite(lon) || !Number.isFinite(lat)) continue
      const c = cellOf(lon, lat)
      const cell = cells.get(c.key) ?? { lon: c.lon, lat: c.lat, w: 0 }
      cell.w += mins
      cells.set(c.key, cell)
    }
  }
  let excluded = 0
  const features = []
  for (const c of cells.values()) {
    if (homes.some(([hl, ho]) => km(hl, ho, c.lat, c.lon) < HOME_RADIUS_KM)) {
      excluded++
      continue
    }
    const minutes = Math.round(c.w)
    if (minutes < 1) continue
    features.push({
      type: 'Feature' as const,
      geometry: {
        type: 'Point' as const,
        coordinates: [+c.lon.toFixed(3), +c.lat.toFixed(3)],
      },
      properties: { minutes },
    })
  }
  return {
    collection: { type: 'FeatureCollection' as const, features },
    excluded,
  }
}

async function load() {
  const homes = parseHomes(serverEnv('ATLAS_HOME_EXCLUDE'))
  // Fail closed: no home reference, no heat
  if (!homes.length) throw new Error('ATLAS_HOME_EXCLUDE is not set')
  const now = Date.now()
  const list = await fetchSmallweb<{ id: number; start: string }[]>(
    'travels',
    '/api/trips'
  )
  // Trips that started in the last 7 days can only contribute recent points
  const ids = (list ?? [])
    .filter((t) => Date.parse(t.start) < now - 7 * DAY)
    .map((t) => t.id)
  const trips = await Promise.all(
    ids.map((id) =>
      fetchSmallweb<TripPath>('travels', `/api/trips/${Number(id)}`, 20000)
    )
  )
  const { collection, excluded } = travelHeat(trips, homes, now)
  return {
    travels: collection,
    trips: trips.length,
    excluded,
    fetched: new Date(now).toISOString(),
  }
}

let cached: {
  at: number
  value: Promise<Awaited<ReturnType<typeof load>>>
} | null = null

export default defineEventHandler(async (event) => {
  requireAtlasPrivate(event)
  if (!cached || Date.now() - cached.at > CACHE_MS) {
    const value = load()
    cached = { at: Date.now(), value }
    value.catch(() => {
      cached = null
    })
  }
  try {
    return await cached.value
  } catch (err) {
    throw createError({
      statusCode: 502,
      statusMessage: err instanceof Error ? err.message : 'travels failed',
    })
  }
})
