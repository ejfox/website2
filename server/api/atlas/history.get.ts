/**
 * @file history.get.ts
 * @description The Revolution in the valley, for the Valley Atlas (/atlas):
 * battles, forts and positions, troop and courier routes, and NPS battlefield
 * study areas, from EJ's hudsonmaps app.
 * @endpoint GET /api/atlas/history
 *
 * Sources: hudsonmaps.tools.ejfox.com /api/battles, /api/positions,
 * /api/routes and /api/boundaries (ABPP study-area polygons). Geometry is
 * kept to the atlas bounds and only whitelisted fields leave this route.
 * Each source fails on its own: an empty collection plus an `errors` entry.
 */
import { fetchSmallweb } from '~/server/utils/smallweb'

type Coord = [number, number]
type Props = Record<string, unknown>
interface Feature {
  type: 'Feature'
  geometry:
    | { type: 'Point'; coordinates: Coord }
    | { type: 'LineString'; coordinates: Coord[] }
    | { type: 'Polygon'; coordinates: Coord[][] }
  properties: Props
}
const collection = (features: Feature[] = []) => ({
  type: 'FeatureCollection' as const,
  features,
})

const CACHE_MS = 6 * 3600e3
const BOUNDS = { west: -75.6, east: -72.6, south: 40.7, north: 42.9 }

const text = (s: unknown, max = 400) =>
  typeof s === 'string' ? s.replace(/\s+/g, ' ').trim().slice(0, max) : ''

const httpUrl = (u: unknown) => {
  try {
    const url = new URL(String(u))
    return /^https?:$/.test(url.protocol) ? url.href : null
  } catch {
    return null
  }
}

const coord = (c: unknown): Coord | null => {
  if (!Array.isArray(c)) return null
  const [lon, lat] = c.map(Number)
  return lon >= BOUNDS.west &&
    lon <= BOUNDS.east &&
    lat >= BOUNDS.south &&
    lat <= BOUNDS.north
    ? [+lon.toFixed(5), +lat.toFixed(5)]
    : null
}

const yearOf = (s: string) => {
  const y = s.match(/\b17\d\d\b/)
  return y ? +y[0] : null
}

export function shapeBattles(raw: any): Feature[] {
  return (raw?.battles ?? []).flatMap((b: any) => {
    const c = coord(b.coords)
    const name = text(b.name, 120)
    if (!c || !name) return []
    const date = text(b.date, 60)
    return [
      {
        type: 'Feature',
        geometry: { type: 'Point', coordinates: c },
        properties: {
          id: text(b.id, 80),
          name,
          date,
          year: yearOf(date),
          result: text(b.result, 80),
          notes: text(b.notes),
          wiki: httpUrl(b.wiki),
        },
      },
    ]
  })
}

export function shapePositions(raw: any): Feature[] {
  return (['continental', 'british'] as const).flatMap((side) =>
    (raw?.[side] ?? []).flatMap((p: any) => {
      const c = coord(p.coords)
      const name = text(p.name, 120)
      if (!c || !name) return []
      const letters = (Array.isArray(p.letters) ? p.letters : [])
        .flatMap((l: any) => {
          const url = httpUrl(l?.url)
          return url
            ? [{ title: text(l.title, 120), date: text(l.date, 40), url }]
            : []
        })
        .slice(0, 3)
      return [
        {
          type: 'Feature' as const,
          geometry: { type: 'Point' as const, coordinates: c },
          properties: {
            id: text(p.id, 80),
            name,
            side,
            type: text(p.type, 40),
            date: text(p.date, 60),
            commander: text(p.commander, 120),
            garrison: text(p.garrison, 120),
            notes: text(p.notes),
            letters,
          },
        },
      ]
    })
  )
}

export function shapeRoutes(raw: any): Feature[] {
  return (raw?.routes ?? []).flatMap((r: any) => {
    // Drop vertices outside the bounds; keep what's left if it's still a line
    const coords = (Array.isArray(r.coords) ? r.coords : [])
      .map(coord)
      .filter(Boolean) as Coord[]
    const name = text(r.name, 120)
    if (coords.length < 2 || !name) return []
    return [
      {
        type: 'Feature',
        geometry: { type: 'LineString', coordinates: coords },
        properties: {
          id: text(r.id, 80),
          name,
          type: text(r.type, 40),
          // hudsonmaps draws British movements in red
          side: r.color === '#c00' ? 'british' : 'continental',
          description: text(r.description),
        },
      },
    ]
  })
}

export function shapeFields(raw: any): Feature[] {
  return (raw?.features ?? []).flatMap((f: any) => {
    if (f?.geometry?.type !== 'Polygon') return []
    const rings = (f.geometry.coordinates as unknown[][]).map((ring) =>
      ring.map((c: any) =>
        Array.isArray(c)
          ? ([+(+c[0]).toFixed(4), +(+c[1]).toFixed(4)] as Coord)
          : null
      )
    )
    const outer = rings[0] ?? []
    // Keep a field only if it sits wholly inside the bounds
    if (!outer.length || outer.some((c) => !c || !coord(c))) return []
    return [
      {
        type: 'Feature',
        geometry: { type: 'Polygon', coordinates: rings as Coord[][] },
        // Source names are title-cased by machine: "Pell'S Point"
        properties: {
          name: text(f.properties?.NAME, 120).replace(/'S\b/g, "'s"),
        },
      },
    ]
  })
}

const SOURCES = {
  battles: ['/api/battles', shapeBattles],
  positions: ['/api/positions', shapePositions],
  routes: ['/api/routes', shapeRoutes],
  fields: ['/api/boundaries', shapeFields],
} as const
type Key = keyof typeof SOURCES
const KEYS = Object.keys(SOURCES) as Key[]

// Per-source cache; a failed refresh keeps serving the last good copy
const cache: Partial<Record<Key, { at: number; features: Feature[] }>> = {}

const load = async (k: Key) => {
  const hit = cache[k]
  if (hit && Date.now() - hit.at < CACHE_MS) return hit.features
  const [path, shape] = SOURCES[k]
  try {
    const features = shape(await fetchSmallweb('hudsonmaps', path, 15000))
    cache[k] = { at: Date.now(), features }
    return features
  } catch (e) {
    if (hit) return hit.features
    throw e
  }
}

export default defineCachedEventHandler(
  async () => {
    const settled = await Promise.allSettled(KEYS.map(load))
    const errors: Record<string, string> = {}
    const out: Record<string, ReturnType<typeof collection>> = {}
    settled.forEach((r, i) => {
      if (r.status === 'fulfilled') out[KEYS[i]] = collection(r.value)
      else {
        out[KEYS[i]] = collection()
        errors[KEYS[i]] =
          r.reason instanceof Error ? r.reason.message : String(r.reason)
      }
    })
    return {
      ...out,
      fetched: new Date().toISOString(),
      ...(Object.keys(errors).length ? { errors } : {}),
    }
  },
  { name: 'atlas-history', maxAge: 30 * 60, swr: true }
)
