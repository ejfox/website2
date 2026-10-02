/**
 * @file remediation.get.ts
 * @description NYS DEC environmental remediation sites (State Superfund,
 * Brownfield Cleanup, etc.) inside the Valley Atlas bbox.
 * @endpoint GET /api/atlas/remediation
 *
 * Source: NY Open Data "Environmental Remediation Sites" (data.ny.gov
 * c6ci-rzpg), the dataset anomalywatch's socrata:nys-remediation-sites
 * signals come from. Anomalywatch only holds the ~20 sites it has flagged,
 * so the map reads the full public dataset directly. The dataset has one row
 * per contaminant per operable unit; this collapses it to one point per site
 * and drops owner/operator names and addresses. Labels and the DEC record
 * link are built client-side to keep the ~2,700-site payload small.
 */
import { fetchWithTimeout } from '../../utils/fetch'

// The valley proper: north of the Bronx line, so NYC and Long Island drop out
const BBOX = { west: -75.6, east: -72.6, south: 40.92, north: 42.9 }
const CACHE_MS = 24 * 3600e3

// DEC site classes still open (the rest are closed out or need no action);
// the layer module holds the readable labels
const OPEN = new Set(['01', '02', 'A', 'P', 'PR'])

interface Row {
  site?: string
  name?: string
  program?: string
  class?: string
  town?: string
  lat?: string
  lon?: string
}

const SOQL = new URLSearchParams({
  $select:
    'program_number as site, max(program_facility_name) as name, ' +
    'max(program_type) as program, max(siteclass) as class, ' +
    'max(locality) as town, max(latitude) as lat, max(longitude) as lon',
  $where: `within_box(georeference, ${BBOX.north}, ${BBOX.west}, ${BBOX.south}, ${BBOX.east})`,
  $group: 'program_number',
  $limit: '50000',
})
const URL_ = `https://data.ny.gov/resource/c6ci-rzpg.json?${SOQL}`

const clean = (s: unknown, max = 80) =>
  typeof s === 'string' && s.trim() ? s.trim().slice(0, max) : null

export function toSites(rows: Row[]) {
  const features = []
  for (const r of rows) {
    const site = clean(r.site, 20)
    const lon = Number(r.lon)
    const lat = Number(r.lat)
    if (!site || !Number.isFinite(lon) || !Number.isFinite(lat)) continue
    const cls = clean(r.class, 4) ?? ''
    features.push({
      type: 'Feature' as const,
      geometry: {
        type: 'Point' as const,
        coordinates: [+lon.toFixed(5), +lat.toFixed(5)],
      },
      properties: {
        name: clean(r.name) ?? `Site ${site}`,
        program: clean(r.program, 10),
        class: cls,
        open: OPEN.has(cls),
        siteCode: site,
        town: clean(r.town, 40),
      },
    })
  }
  return { type: 'FeatureCollection' as const, features }
}

type Sites = ReturnType<typeof toSites>
let cache: { at: number; data: Sites } | null = null
let pending: Promise<Sites> | null = null

const load = async () => {
  const res = await fetchWithTimeout(
    URL_,
    { headers: { 'User-Agent': 'ejfox.com valley atlas' } },
    20000
  )
  if (!res.ok) throw new Error(`${res.status} from data.ny.gov`)
  return toSites((await res.json()) as Row[])
}

export default defineEventHandler(async () => {
  if (cache && Date.now() - cache.at < CACHE_MS)
    return { sites: cache.data, fetched: new Date(cache.at).toISOString() }
  pending ??= load().finally(() => (pending = null))
  try {
    const data = await pending
    cache = { at: Date.now(), data }
    return { sites: data, fetched: new Date(cache.at).toISOString() }
  } catch (e) {
    return {
      sites: cache?.data ?? { type: 'FeatureCollection', features: [] },
      fetched: cache ? new Date(cache.at).toISOString() : null,
      errors: { remediation: e instanceof Error ? e.message : String(e) },
    }
  }
})
