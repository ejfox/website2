#!/usr/bin/env node
/**
 * Fetch the Valley Atlas point layers from OpenStreetMap (Overpass) and write
 * a compact GeoJSON snapshot to data/atlas/places.geojson.
 *
 * Run by hand (`yarn atlas:fetch`), not on every build: Overpass is a shared
 * public service, and the snapshot is committed so the site never depends on it.
 */
import { writeFile, mkdir } from 'node:fs/promises'
import { resolve } from 'node:path'

// Hudson Valley, roughly Port Jervis → Hudson, Peekskill → Kingston and a bit beyond
const BBOX = '41.15,-74.9,42.45,-73.35'
const OUT = resolve(process.cwd(), 'data/atlas/places.geojson')

const QUERY = `[out:json][timeout:120];
(
  nwr["amenity"="drinking_water"](${BBOX});
  nwr["natural"="spring"]["drinking_water"="yes"](${BBOX});
  nwr["amenity"="shelter"](${BBOX});
  nwr["amenity"="hospital"](${BBOX});
  nwr["amenity"="fire_station"](${BBOX});
  nwr["emergency"="assembly_point"](${BBOX});
  nwr["highway"="trailhead"](${BBOX});
  nwr["tourism"="viewpoint"]["name"](${BBOX});
);
out center tags;`

const category = (t) => {
  if (t.amenity === 'drinking_water' || t.natural === 'spring') return 'water'
  if (t.amenity === 'shelter') return 'shelter'
  if (t.amenity === 'hospital') return 'hospital'
  if (t.amenity === 'fire_station') return 'fire'
  if (t.emergency === 'assembly_point') return 'assembly'
  if (t.highway === 'trailhead') return 'trailhead'
  if (t.tourism === 'viewpoint') return 'viewpoint'
  return null
}

const res = await fetch('https://overpass-api.de/api/interpreter', {
  method: 'POST',
  headers: {
    'User-Agent': 'ejfox-valley-atlas/0.1 (https://ejfox.com)',
    Accept: 'application/json',
    'Content-Type': 'application/x-www-form-urlencoded',
  },
  body: new URLSearchParams({ data: QUERY }),
})
if (!res.ok) throw new Error(`Overpass ${res.status}`)
const { elements, osm3s } = await res.json()

const features = []
for (const el of elements) {
  const t = el.tags || {}
  const cat = category(t)
  if (!cat) continue
  // Bus stops are shelters too; the atlas wants the ones you'd sleep or wait out weather in
  if (cat === 'shelter' && t.shelter_type === 'public_transport') continue
  const lon = el.lon ?? el.center?.lon
  const lat = el.lat ?? el.center?.lat
  if (lon === undefined || lat === undefined) continue
  features.push({
    type: 'Feature',
    geometry: {
      type: 'Point',
      coordinates: [+lon.toFixed(5), +lat.toFixed(5)],
    },
    properties: { cat, ...(t.name ? { name: t.name } : {}) },
  })
}

const counts = Object.groupBy(features, (f) => f.properties.cat)
await mkdir(resolve(OUT, '..'), { recursive: true })
await writeFile(
  OUT,
  JSON.stringify({
    type: 'FeatureCollection',
    source: '© OpenStreetMap contributors, ODbL',
    fetched: osm3s?.timestamp_osm_base ?? new Date().toISOString(),
    features,
  })
)
console.log(
  `✔ ${features.length} places →`,
  OUT,
  Object.fromEntries(Object.entries(counts).map(([k, v]) => [k, v.length]))
)
