/**
 * @file sky.get.ts
 * @description PRIVATE Valley Atlas layer: aircraft over the valley, from
 * EJ's skywatch app. Two GeoJSON collections:
 * - density: 7 days of position reports binned into ~3 km flat-top hexes
 * - notable: military / government / law-enforcement aircraft seen in the
 *   last 24h, one point per aircraft at its last known position
 * @endpoint GET /api/atlas/private/sky (404 unless the atlas is unlocked)
 *
 * Minimized on purpose. Skywatch also knows EJ's live location (OwnTracks)
 * and a list of watched POIs, one of which is his neighborhood; none of that
 * is read here, and the per-sighting `nearest_poi` and free-text `details`
 * (which can name a POI) are dropped. Only the whitelisted fields below
 * leave the server.
 *
 * Not defineCachedEventHandler: a cached handler can answer without running
 * requireAtlasPrivate. The upstream fetch is memoized in-process instead.
 */
import { requireAtlasPrivate } from '~/server/utils/atlasPrivate'
import { fetchSmallweb } from '~/server/utils/smallweb'

type Coord = [number, number]

interface Position {
  icao24: string
  callsign: string | null
  latitude: number | null
  longitude: number | null
  baro_altitude: number | null
  last_seen: string
}
interface Notable {
  icao24: string
  callsign: string | null
  reason: string
  details: string | null
  spotted_at: string
}
interface Archived {
  icao24: string
  latitude: number | null
  longitude: number | null
  baro_altitude: number | null
  last_seen: string
}

const DAY = 864e5
const CACHE_MS = 5 * 60e3

/** Notable categories this layer shows, most serious first */
const CATEGORIES = [
  'military',
  'foreign_military',
  'government',
  'law_enforcement',
  'surveillance',
] as const

/** Skywatch stores UTC as 'YYYY-MM-DD HH:MM:SS' */
const utc = (s: string) => Date.parse(`${s.replace(' ', 'T')}Z`)

const round = (n: number, d = 5) => +n.toFixed(d)

// ------------------------------------------------------------- hex binning

// Flat-top hexes ~3 km across (flat side to flat side), on a local
// equirectangular projection centred on the valley
const LAT0 = 41.5
const M_LAT = 110540
const M_LON = 111320 * Math.cos((LAT0 * Math.PI) / 180)
const ACROSS_M = 3000
const SIZE = ACROSS_M / Math.sqrt(3) // centre to corner

const hexOf = (lon: number, lat: number) => {
  const x = lon * M_LON
  const y = lat * M_LAT
  const q = ((2 / 3) * x) / SIZE
  const r = ((-1 / 3) * x + (Math.sqrt(3) / 3) * y) / SIZE
  // Cube rounding
  const s = -q - r
  let rq = Math.round(q)
  let rr = Math.round(r)
  const rs = Math.round(s)
  const dq = Math.abs(rq - q)
  const dr = Math.abs(rr - r)
  const ds = Math.abs(rs - s)
  if (dq > dr && dq > ds) rq = -rr - rs
  else if (dr > ds) rr = -rq - rs
  return [rq, rr] as const
}

const hexRing = (q: number, r: number): Coord[] => {
  const cx = SIZE * 1.5 * q
  const cy = SIZE * Math.sqrt(3) * (r + q / 2)
  const ring: Coord[] = []
  for (let i = 0; i <= 6; i++) {
    const a = (Math.PI / 3) * (i % 6)
    ring.push([
      round((cx + SIZE * Math.cos(a)) / M_LON, 4),
      round((cy + SIZE * Math.sin(a)) / M_LAT, 4),
    ])
  }
  return ring
}

export function densityGrid(positions: Position[]) {
  const cells = new Map<string, { n: number; ac: Set<string> }>()
  for (const p of positions) {
    if (typeof p.latitude !== 'number' || typeof p.longitude !== 'number')
      continue
    const [q, r] = hexOf(p.longitude, p.latitude)
    const key = `${q},${r}`
    const c = cells.get(key) ?? { n: 0, ac: new Set<string>() }
    c.n++
    c.ac.add(p.icao24)
    cells.set(key, c)
  }
  let max = 1
  for (const c of cells.values()) max = Math.max(max, c.ac.size)
  const features = [...cells.entries()].map(([key, c]) => {
    const [q = 0, r = 0] = key.split(',').map(Number)
    return {
      type: 'Feature' as const,
      geometry: { type: 'Polygon' as const, coordinates: [hexRing(q, r)] },
      properties: {
        n: c.n,
        aircraft: c.ac.size,
        // Log scale 0..1 for the fill ramp
        t: max > 1 ? round(Math.log(c.ac.size) / Math.log(max), 3) : 1,
      },
    }
  })
  return { type: 'FeatureCollection' as const, features }
}

// ---------------------------------------------------------------- notable

const stripHtml = (s: string) =>
  s
    .replace(/<[^>]*>/g, '')
    .replace(/\s+/g, ' ')
    .trim()

/** Aircraft model from plane-alert-db, e.g. "USAF (Boeing C-17A) [USAF]" */
const typeOf = (details: string) =>
  details.match(/plane-alert-db:[^(]*\(([^)]+)\)/)?.[1]?.trim() ?? null

/** Who flies it, from a callsign-prefix match: "Prefix 'RCH' → Air Mobility…" */
const operatorOf = (details: string) => {
  const m = stripHtml(details).match(/Prefix '[^']+' → ([^[|]+)/)
  return m?.[1] ? m[1].trim().slice(0, 80) : null
}

export function notableAircraft(
  notable: Notable[],
  positions: Position[],
  archived: Archived[],
  now = Date.now()
) {
  const since = now - DAY
  const byAircraft = new Map<
    string,
    {
      callsign: string
      reasons: Set<string>
      type: string | null
      operator: string | null
      spotted: number
    }
  >()
  for (const n of notable) {
    const spotted = utc(n.spotted_at)
    if (!(spotted >= since)) continue
    const reasons = n.reason.split(',').map((r) => r.trim())
    if (!reasons.some((r) => (CATEGORIES as readonly string[]).includes(r)))
      continue
    const a = byAircraft.get(n.icao24) ?? {
      callsign: '',
      reasons: new Set<string>(),
      type: null,
      operator: null,
      spotted: 0,
    }
    for (const r of reasons) a.reasons.add(r)
    const details = n.details ?? ''
    a.type ??= typeOf(details)
    a.operator ??= operatorOf(details)
    if (spotted >= a.spotted) {
      a.spotted = spotted
      a.callsign = (n.callsign ?? '').trim() || a.callsign
    }
    byAircraft.set(n.icao24, a)
  }

  // Latest known position per aircraft: the position log, then the archive
  const last = new Map<
    string,
    { coord: Coord; alt: number | null; time: number }
  >()
  const consider = (
    icao: string,
    lat: number | null,
    lon: number | null,
    alt: number | null,
    seen: string
  ) => {
    if (
      !byAircraft.has(icao) ||
      typeof lat !== 'number' ||
      typeof lon !== 'number'
    )
      return
    const time = utc(seen)
    if (!(time >= since)) return
    const prev = last.get(icao)
    if (!prev || time > prev.time)
      last.set(icao, { coord: [round(lon), round(lat)], alt, time })
  }
  for (const p of positions)
    consider(p.icao24, p.latitude, p.longitude, p.baro_altitude, p.last_seen)
  for (const p of archived)
    consider(p.icao24, p.latitude, p.longitude, p.baro_altitude, p.last_seen)

  const features = []
  for (const [icao, a] of byAircraft) {
    const pos = last.get(icao)
    if (!pos) continue
    const category = CATEGORIES.find((c) => a.reasons.has(c)) ?? 'military'
    const hex = icao.replace(/^~/, '')
    features.push({
      type: 'Feature' as const,
      geometry: { type: 'Point' as const, coordinates: pos.coord },
      properties: {
        icao24: icao,
        callsign: a.callsign || null,
        category,
        type: a.type,
        operator: a.operator,
        altitudeFt: typeof pos.alt !== 'number' ? null : Math.round(pos.alt),
        time: new Date(pos.time).toISOString(),
        url: /^[0-9a-f]{6}$/i.test(hex)
          ? `https://globe.adsbexchange.com/?icao=${hex.toLowerCase()}`
          : null,
      },
    })
  }
  features.sort((a, b) => (a.properties.time < b.properties.time ? 1 : -1))
  return { type: 'FeatureCollection' as const, features }
}

// ---------------------------------------------------------------- handler

async function load() {
  const now = Date.now()
  const start = new Date(now - 7 * DAY).toISOString()
  const [pos, notable, archive] = await Promise.all([
    fetchSmallweb<{ positions: Position[] }>(
      'skywatch',
      `/api/positions?start=${encodeURIComponent(start)}&limit=500000`,
      45000
    ),
    fetchSmallweb<{ notable: Notable[] }>(
      'skywatch',
      '/api/notable?limit=1000'
    ),
    fetchSmallweb<{ archive: Archived[] }>(
      'skywatch',
      '/api/archive?days=2&limit=1000'
    ).catch(() => ({ archive: [] as Archived[] })),
  ])
  const positions = pos.positions ?? []
  return {
    density: densityGrid(positions),
    notable: notableAircraft(
      notable.notable ?? [],
      positions,
      archive.archive ?? [],
      now
    ),
    positions: positions.length,
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
      statusMessage: err instanceof Error ? err.message : 'skywatch failed',
    })
  }
})
