/**
 * @file ride-basemap.mjs
 * @description Bakes a minimalist vector basemap for a ride's bounding box.
 *
 * Fetches raw OSM geometry from Overpass once (cached in data/cache/), then
 * simplifies it into a few flat layers the ride page draws under the track:
 * water polygons (the Hudson), river centerlines, major/minor roads, rail,
 * and town labels. No tiles, no runtime map service — just coordinates.
 *
 * OSM data © OpenStreetMap contributors (ODbL) — the page shows attribution.
 */
import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { join } from 'node:path'

const OVERPASS_URLS = [
  'https://overpass.kumi.systems/api/interpreter',
  'https://overpass-api.de/api/interpreter',
  'https://overpass.osm.jp/api/interpreter',
]

// simplification tolerances in degrees (~11m per 0.0001 at this latitude)
const TOL_ROAD = 0.0002
const TOL_WATER = 0.0001

function query(bbox, coarse) {
  const bb = `${bbox.minLat},${bbox.minLon},${bbox.maxLat},${bbox.maxLon}`
  // big rides get a coarser plate: no tertiary roads, no hamlets — otherwise
  // a 150-mile bbox drowns both Overpass and the page
  const roads = coarse
    ? `way["highway"~"^(motorway|trunk|primary)$"](${bb});
  way["highway"="secondary"](${bb});`
    : `way["highway"~"^(motorway|trunk|primary)$"](${bb});
  way["highway"~"^(secondary|tertiary)$"](${bb});`
  const places = coarse ? 'city|town|village' : 'city|town|village|hamlet'
  return `[out:json][timeout:120];
(
  ${roads}
  way["railway"="rail"]["service"!~"."](${bb});
  way["waterway"="river"](${bb});
  way["natural"="water"](${bb});
  relation["natural"="water"](${bb});
  node["place"~"^(${places})$"](${bb});
);
out geom;`
}

async function fetchOverpass(bbox, cacheDir, slug, coarse) {
  const cachePath = join(cacheDir, `overpass-${slug}.json`)
  if (existsSync(cachePath)) {
    return JSON.parse(await readFile(cachePath, 'utf8'))
  }
  let lastErr = null
  for (const url of OVERPASS_URLS) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'ejfox.com ride basemap builder (ejfox@ejfox.com)',
        },
        body: 'data=' + encodeURIComponent(query(bbox, coarse)),
      })
      if (!res.ok) throw new Error(`Overpass ${res.status} (${url})`)
      const json = await res.json()
      await mkdir(cacheDir, { recursive: true })
      await writeFile(cachePath, JSON.stringify(json))
      return json
    } catch (err) {
      lastErr = err
      console.warn(`  ⚠ ${err.message}; trying next mirror`)
    }
  }
  throw lastErr
}

// ---------------------------------------------------------------- geometry

function perpDist(p, a, b) {
  const dx = b[0] - a[0]
  const dy = b[1] - a[1]
  if (dx === 0 && dy === 0) return Math.hypot(p[0] - a[0], p[1] - a[1])
  const t = Math.max(
    0,
    Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / (dx * dx + dy * dy))
  )
  return Math.hypot(p[0] - (a[0] + t * dx), p[1] - (a[1] + t * dy))
}

function simplify(coords, tol) {
  if (coords.length <= 2) return coords
  const keep = Array.from({ length: coords.length }).fill(false)
  keep[0] = keep[coords.length - 1] = true
  const stack = [[0, coords.length - 1]]
  while (stack.length) {
    const [s, e] = stack.pop()
    let maxD = 0
    let maxI = -1
    for (let i = s + 1; i < e; i++) {
      const d = perpDist(coords[i], coords[s], coords[e])
      if (d > maxD) {
        maxD = d
        maxI = i
      }
    }
    if (maxD > tol && maxI > -1) {
      keep[maxI] = true
      stack.push([s, maxI], [maxI, e])
    }
  }
  return coords.filter((_, i) => keep[i])
}

const rndTo = (coords, dp) =>
  coords.map((c) => [+c[0].toFixed(dp), +c[1].toFixed(dp)])
const wayCoords = (el) => (el.geometry ?? []).map((g) => [g.lon, g.lat])

/** Stitch relation member ways into closed outer rings by matching endpoints. */
function stitchRings(members) {
  const segs = members
    .filter((m) => m.role === 'outer' && m.geometry?.length > 1)
    .map((m) => m.geometry.map((g) => [g.lon, g.lat]))
  const rings = []
  const key = (p) => `${p[0].toFixed(6)},${p[1].toFixed(6)}`
  while (segs.length) {
    let ring = segs.pop()
    let grew = true
    while (grew && key(ring[0]) !== key(ring[ring.length - 1])) {
      grew = false
      const tail = key(ring[ring.length - 1])
      for (let i = 0; i < segs.length; i++) {
        const s = segs[i]
        if (key(s[0]) === tail) {
          ring = ring.concat(s.slice(1))
        } else if (key(s[s.length - 1]) === tail) {
          ring = ring.concat(s.slice(0, -1).reverse())
        } else {
          continue
        }
        segs.splice(i, 1)
        grew = true
        break
      }
    }
    if (ring.length > 3) rings.push(ring)
  }
  return rings
}

// ---------------------------------------------------------------- build

export async function buildBasemap(bbox, cacheDir, slug) {
  // > ~0.8° of extent (~55mi) → coarse plate + heavier simplification
  const coarse =
    Math.max(bbox.maxLat - bbox.minLat, bbox.maxLon - bbox.minLon) > 0.8
  const tolRoad = coarse ? TOL_ROAD * 4 : TOL_ROAD
  const tolWater = coarse ? TOL_WATER * 4 : TOL_WATER
  const dp = coarse ? 4 : 5 // ~11m precision is invisible at 100mi scale
  const raw = await fetchOverpass(bbox, cacheDir, slug, coarse)
  const layers = {
    waterPolys: [],
    rivers: [],
    roadsMajor: [],
    roadsMinor: [],
    rail: [],
    places: [],
  }

  for (const el of raw.elements ?? []) {
    if (el.type === 'node' && el.tags?.place) {
      layers.places.push({
        name: el.tags.name ?? '',
        kind: el.tags.place,
        lon: +el.lon.toFixed(5),
        lat: +el.lat.toFixed(5),
      })
      continue
    }
    if (el.type === 'relation' && el.tags?.natural === 'water') {
      for (const ring of stitchRings(el.members ?? [])) {
        layers.waterPolys.push(rndTo(simplify(ring, tolWater), dp))
      }
      continue
    }
    if (el.type !== 'way') continue
    const coords = wayCoords(el)
    if (coords.length < 2) continue
    const t = el.tags ?? {}
    if (t.natural === 'water') {
      layers.waterPolys.push(rndTo(simplify(coords, tolWater), dp))
    } else if (t.waterway === 'river') {
      layers.rivers.push(rndTo(simplify(coords, tolWater), dp))
    } else if (/^(?:motorway|trunk|primary)$/.test(t.highway ?? '')) {
      layers.roadsMajor.push(rndTo(simplify(coords, tolRoad), dp))
    } else if (/^(?:secondary|tertiary)$/.test(t.highway ?? '')) {
      layers.roadsMinor.push(rndTo(simplify(coords, tolRoad), dp))
    } else if (t.railway === 'rail') {
      layers.rail.push(rndTo(simplify(coords, tolRoad), dp))
    }
  }

  // drop tiny ponds — they read as noise at ride scale
  layers.waterPolys = layers.waterPolys.filter(
    (ring) => ring.length >= (coarse ? 16 : 12)
  )
  if (coarse) {
    // at 100+ mile extents: primary roads only, big towns only, no junction
    // stubs (ways shorter than ~300m read as dust)
    const roughLen = (seg) => {
      let l = 0
      for (let i = 1; i < seg.length; i++) {
        l += Math.hypot(seg[i][0] - seg[i - 1][0], seg[i][1] - seg[i - 1][1])
      }
      return l
    }
    layers.roadsMinor = []
    layers.roadsMajor = layers.roadsMajor.filter((s) => roughLen(s) > 0.003)
    layers.rail = layers.rail.filter((s) => roughLen(s) > 0.003)
    layers.places = layers.places.filter(
      (p) => p.kind === 'city' || p.kind === 'town'
    )
  }
  // dedupe place names (OSM sometimes doubles hamlets), keep the bigger kind
  const rank = { city: 0, town: 1, village: 2, hamlet: 3 }
  const seen = new Map()
  for (const p of layers.places) {
    const prev = seen.get(p.name)
    if (!prev || rank[p.kind] < rank[prev.kind]) seen.set(p.name, p)
  }
  layers.places = [...seen.values()].filter((p) => p.name)

  return layers
}
