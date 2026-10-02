/**
 * @file ships.get.ts
 * @description Commercial and government vessels on the Hudson for the Valley
 * Atlas (/atlas), from EJ's riverwatch AIS app.
 * @endpoint GET /api/atlas/ships
 *
 * Only working boats: pleasure craft, untyped and "Other" vessels are
 * dropped, and only display fields leave this route (no callsigns, owners,
 * dimensions or first-seen history).
 */
import { fetchSmallweb } from '../../utils/smallweb'

interface Vessel {
  mmsi?: string | number | null
  name?: string | null
  vessel_type?: string | null
  destination?: string | null
  latitude?: number | null
  longitude?: number | null
  speed?: number | null
  course?: number | null
  heading?: number | null
  last_seen?: string | null
}

// The valley, not the harbor: from Spuyten Duyvil north
const BBOX = { west: -75.6, east: -72.6, south: 40.88, north: 42.9 }
const MAX_AGE_MS = 2 * 3600e3
const CACHE_MS = 60e3

// riverwatch's AIS type buckets that mean a working vessel. "Special" is
// AIS 50-59 (tugs with tow, dredgers, etc.); "Other" mixes yachts in, so it's out
const COMMERCIAL: Record<string, string> = {
  Tug: 'tug',
  Towing: 'towing',
  Special: 'tug / special craft',
  Cargo: 'cargo',
  Tanker: 'tanker',
  Passenger: 'passenger / ferry',
  'High Speed': 'high-speed ferry',
  Pilot: 'pilot boat',
  SAR: 'search & rescue',
  'Law Enforcement': 'law enforcement',
  'Port Tender': 'port tender',
  Research: 'research',
  Dredging: 'dredging',
}

const clean = (s: unknown, max = 40) =>
  typeof s === 'string' && s.trim() ? s.trim().slice(0, max) : null

// AIS destinations are free text; skip machine codes like "US^0RRA>10TA"
const place = (s: unknown) => {
  const d = clean(s, 30)
  return d && /^[\w .,'&()/-]+$/.test(d) ? d : null
}

// AIS uses 360 (course) and 511 (heading) for "not available"
const valid = (deg: unknown): deg is number =>
  typeof deg === 'number' && deg >= 0 && deg < 360
const bearing = (v: Vessel) => {
  const moving = (v.speed ?? 0) >= 0.5
  if (moving && valid(v.course)) return Math.round(v.course)
  if (valid(v.heading)) return Math.round(v.heading)
  return null
}

export function toShips(vessels: Vessel[], now = Date.now()) {
  const seen = new Set<string>()
  const features = []
  for (const v of vessels) {
    const type = v.vessel_type ? COMMERCIAL[v.vessel_type] : undefined
    if (!type) continue
    const lon = v.longitude
    const lat = v.latitude
    if (typeof lon !== 'number' || typeof lat !== 'number') continue
    if (lon < BBOX.west || lon > BBOX.east) continue
    if (lat < BBOX.south || lat > BBOX.north) continue
    const t = Date.parse(v.last_seen ?? '')
    if (!Number.isFinite(t) || now - t > MAX_AGE_MS) continue
    // riverwatch stores MMSI as a float string ("368430000.0")
    const mmsi = String(Math.trunc(Number(v.mmsi)))
    if (!/^\d{9}$/.test(mmsi) || seen.has(mmsi)) continue
    seen.add(mmsi)

    const course = bearing(v)
    features.push({
      type: 'Feature' as const,
      geometry: {
        type: 'Point' as const,
        coordinates: [+lon.toFixed(5), +lat.toFixed(5)],
      },
      properties: {
        name: clean(v.name) ?? `MMSI ${mmsi}`,
        type,
        speed: typeof v.speed === 'number' ? +v.speed.toFixed(1) : null,
        course,
        directed: course !== null,
        destination: place(v.destination),
        lastSeen: new Date(t).toISOString(),
        mmsi,
        url: `https://www.marinetraffic.com/en/ais/details/ships/mmsi:${mmsi}`,
      },
    })
  }
  return { type: 'FeatureCollection' as const, features }
}

type Ships = ReturnType<typeof toShips>
let cache: { at: number; data: Ships } | null = null
let pending: Promise<Ships> | null = null

export default defineEventHandler(async () => {
  if (cache && Date.now() - cache.at < CACHE_MS)
    return { ships: cache.data, fetched: new Date(cache.at).toISOString() }
  pending ??= fetchSmallweb<{ vessels?: Vessel[] }>(
    'riverwatch',
    '/api/vessels'
  )
    .then((r) => toShips(r.vessels ?? []))
    .finally(() => (pending = null))
  try {
    const data = await pending
    cache = { at: Date.now(), data }
    return { ships: data, fetched: new Date(cache.at).toISOString() }
  } catch (e) {
    // Serve the last good positions (if any) rather than an empty river
    return {
      ships: cache?.data ?? { type: 'FeatureCollection', features: [] },
      fetched: cache ? new Date(cache.at).toISOString() : null,
      errors: { ships: e instanceof Error ? e.message : String(e) },
    }
  }
})
