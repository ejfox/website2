#!/usr/bin/env node
/**
 * @file process-rides.mjs
 * @description GPX → JSON pipeline for motorcycle ride pages.
 *
 * Input:  content/rides/<slug>/track.gpx + content/rides/<slug>/ride.md
 * Output: content/processed/rides/<slug>.json + content/processed/rides/index.json
 *
 * - Privacy-trims both ends of the track (default 800m) so rides never
 *   reveal where home is. Set `privacyTrimMeters` in ride.md frontmatter.
 * - Simplifies the track (Douglas-Peucker) to keep payloads small.
 * - Resolves "moments" (photos / audio / tweet-sized notes) onto the track
 *   by timestamp or by km marker.
 */
import { readFile, writeFile, mkdir, readdir } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { resolve, join } from 'node:path'
import { XMLParser } from 'fast-xml-parser'
import { buildBasemap, fetchFuelStations } from './ride-basemap.mjs'
import bboxClip from '@turf/bbox-clip'
import simplify from '@turf/simplify'
import { lineString } from '@turf/helpers'

const ROOT = resolve(process.cwd())
const RIDES_DIR = join(ROOT, 'content/rides')
const OUT_DIR = join(ROOT, 'content/processed/rides')

const DEFAULT_PRIVACY_TRIM_METERS = 800
const SIMPLIFY_TOLERANCE_DEG = 0.00008 // ~9m; keeps curves, drops jitter
const MAX_POINTS = 2000

// ---------------------------------------------------------------- geometry

const R_EARTH = 6371000
function haversine(a, b) {
  const toRad = (d) => (d * Math.PI) / 180
  const dLat = toRad(b.lat - a.lat)
  const dLon = toRad(b.lon - a.lon)
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLon / 2) ** 2
  return 2 * R_EARTH * Math.asin(Math.sqrt(h))
}

/** Perpendicular distance in degrees-space (fine for simplification). */
function perpDist(p, a, b) {
  const dx = b.lon - a.lon
  const dy = b.lat - a.lat
  if (dx === 0 && dy === 0) {
    return Math.hypot(p.lon - a.lon, p.lat - a.lat)
  }
  const t = ((p.lon - a.lon) * dx + (p.lat - a.lat) * dy) / (dx * dx + dy * dy)
  const tc = Math.max(0, Math.min(1, t))
  return Math.hypot(p.lon - (a.lon + tc * dx), p.lat - (a.lat + tc * dy))
}

function douglasPeucker(points, tolerance) {
  if (points.length <= 2) return points
  const keep = Array.from({ length: points.length }).fill(false)
  keep[0] = keep[points.length - 1] = true
  const stack = [[0, points.length - 1]]
  while (stack.length) {
    const [start, end] = stack.pop()
    let maxDist = 0
    let maxIdx = -1
    for (let i = start + 1; i < end; i++) {
      const d = perpDist(points[i], points[start], points[end])
      if (d > maxDist) {
        maxDist = d
        maxIdx = i
      }
    }
    if (maxDist > tolerance && maxIdx > -1) {
      keep[maxIdx] = true
      stack.push([start, maxIdx], [maxIdx, end])
    }
  }
  return points.filter((_, i) => keep[i])
}

// ---------------------------------------------------------------- gpx

async function parseGpx(gpxPath) {
  const xml = await readFile(gpxPath, 'utf8')
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    parseAttributeValue: false,
  })
  const doc = parser.parse(xml)
  const tracks = [].concat(doc?.gpx?.trk ?? [])
  const points = []
  for (const trk of tracks) {
    const segs = [].concat(trk?.trkseg ?? [])
    for (const seg of segs) {
      const pts = [].concat(seg?.trkpt ?? [])
      for (const pt of pts) {
        const lat = Number.parseFloat(pt['@_lat'])
        const lon = Number.parseFloat(pt['@_lon'])
        if (!Number.isFinite(lat) || !Number.isFinite(lon)) continue
        points.push({
          lat,
          lon,
          ele: Number.isFinite(Number.parseFloat(pt.ele))
            ? Number.parseFloat(pt.ele)
            : null,
          time: pt.time ? Date.parse(pt.time) : null,
        })
      }
    }
  }
  return points
}

/**
 * Deterministic 0–1 jitter from slug+salt (FNV-1a). The trim distance must be
 * unguessable per ride — a fixed radius lets anyone walk the route back to
 * the real endpoint — but reproducible so builds don't churn.
 */
function seededJitter(slug, salt) {
  let h = 2166136261
  for (const c of `${slug}:${salt}`) {
    h ^= c.charCodeAt(0)
    h = Math.imul(h, 16777619)
  }
  return (h >>> 0) / 4294967296
}

/** Drop fuzzy start/end stretches so endpoints never dox anyone. */
function privacyTrim(points, startMeters, endMeters) {
  if ((startMeters <= 0 && endMeters <= 0) || points.length < 3) return points
  let startIdx = 0
  let acc = 0
  for (let i = 1; i < points.length; i++) {
    acc += haversine(points[i - 1], points[i])
    if (acc >= startMeters) {
      startIdx = i
      break
    }
  }
  let endIdx = points.length - 1
  acc = 0
  for (let i = points.length - 1; i > 0; i--) {
    acc += haversine(points[i - 1], points[i])
    if (acc >= endMeters) {
      endIdx = i - 1
      break
    }
  }
  if (endIdx - startIdx < 2) return points // trim would eat the whole ride
  return points.slice(startIdx, endIdx + 1)
}

function computeTrack(rawPoints, trimMeters, slug) {
  // each end gets an independent, unguessable trim in [base, 2×base]
  const trimmed = privacyTrim(
    rawPoints,
    trimMeters * (1 + seededJitter(slug, 'start')),
    trimMeters * (1 + seededJitter(slug, 'end'))
  )

  // cumulative distance + speed on the full-resolution trimmed track
  let cum = 0
  let movingMs = 0
  let gain = 0
  let loss = 0
  let lastEle = trimmed[0]?.ele ?? null
  const enriched = trimmed.map((p, i) => {
    if (i > 0) {
      const d = haversine(trimmed[i - 1], p)
      cum += d
      const dt =
        p.time && trimmed[i - 1].time ? p.time - trimmed[i - 1].time : 0
      const speed = dt > 0 ? d / (dt / 1000) : 0
      if (speed > 1) movingMs += dt
      if (p.ele !== null && lastEle !== null) {
        const dEle = p.ele - lastEle
        // hysteresis: only count elevation moves > 2m to filter barometric noise
        if (Math.abs(dEle) > 2) {
          if (dEle > 0) gain += dEle
          else loss -= dEle
          lastEle = p.ele
        }
      } else if (p.ele !== null) {
        lastEle = p.ele
      }
    }
    return { ...p, dist: cum }
  })

  // max speed over an ~8s trailing window; point-to-point GPS jitter fakes
  // triple-digit speeds otherwise
  let maxSpeed = 0
  let j = 0
  for (let i = 1; i < enriched.length; i++) {
    const p = enriched[i]
    if (!p.time) continue
    while (j < i && (!enriched[j].time || p.time - enriched[j].time > 8000)) j++
    const dt = enriched[j].time ? p.time - enriched[j].time : 0
    if (dt >= 4000) {
      const speed = (p.dist - enriched[j].dist) / (dt / 1000)
      if (speed > maxSpeed) maxSpeed = speed
    }
  }

  // per-point speed over a centered ~8s window on the FULL-resolution track,
  // attached before simplification so the page never re-derives speed from
  // decimated points (which dilutes peaks)
  {
    let j = 0
    let k = 0
    for (let i = 0; i < enriched.length; i++) {
      const ti = enriched[i].time
      if (!ti) continue
      while (j < i && (!enriched[j].time || ti - enriched[j].time > 4000)) j++
      if (k < i) k = i
      while (
        k < enriched.length - 1 &&
        enriched[k + 1].time &&
        enriched[k + 1].time - ti <= 4000
      ) {
        k++
      }
      const dt = enriched[k].time - enriched[j].time
      if (dt > 0) {
        enriched[i].spd = (enriched[k].dist - enriched[j].dist) / (dt / 1000)
      }
    }
  }

  let simplified = douglasPeucker(enriched, SIMPLIFY_TOLERANCE_DEG)
  // DP deletes straightaways — exactly where speed peaks live. Re-add the
  // fastest points so the wire data preserves honest maxima.
  {
    const kept = new Set(simplified)
    const peaks = [...enriched]
      .sort((a, b) => (b.spd ?? 0) - (a.spd ?? 0))
      .slice(0, 25)
    let added = false
    for (const p of peaks) {
      if (!kept.has(p)) {
        kept.add(p)
        added = true
      }
    }
    if (added) simplified = enriched.filter((p) => kept.has(p))
  }
  if (simplified.length > MAX_POINTS) {
    const step = simplified.length / MAX_POINTS
    simplified = Array.from(
      { length: MAX_POINTS },
      (_, i) => simplified[Math.floor(i * step)]
    )
  }

  const t0 = enriched.find((p) => p.time)?.time ?? null
  const tEnd = [...enriched].reverse().find((p) => p.time)?.time ?? null
  const lats = enriched.map((p) => p.lat)
  const lons = enriched.map((p) => p.lon)

  return {
    // compact wire format: [lon, lat, ele(m), tSeconds(rel), dist(m), mps]
    points: simplified.map((p) => [
      +p.lon.toFixed(5),
      +p.lat.toFixed(5),
      p.ele === null ? null : Math.round(p.ele),
      p.time && t0 ? Math.round((p.time - t0) / 1000) : null,
      Math.round(p.dist),
      +(p.spd ?? 0).toFixed(1),
    ]),
    bounds: {
      minLon: Math.min(...lons),
      maxLon: Math.max(...lons),
      minLat: Math.min(...lats),
      maxLat: Math.max(...lats),
    },
    stats: {
      distanceMeters: Math.round(cum),
      durationSeconds: t0 && tEnd ? Math.round((tEnd - t0) / 1000) : null,
      movingSeconds: Math.round(movingMs / 1000),
      elevationGainMeters: Math.round(gain),
      elevationLossMeters: Math.round(loss),
      maxSpeedMps: +maxSpeed.toFixed(1),
      avgMovingSpeedMps:
        movingMs > 0 ? +(cum / (movingMs / 1000)).toFixed(1) : null,
      pointCount: simplified.length,
    },
    startTime: t0 ? new Date(t0).toISOString() : null,
    _t0: t0,
    _enriched: enriched,
  }
}

// ---------------------------------------------------------------- frontmatter

function parseFrontmatter(md) {
  const match = md.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/)
  if (!match) return { data: {}, body: md.trim() }
  // minimal YAML: scalars + one level of `moments:` list items
  const data = {}
  const lines = match[1].split('\n')
  let currentList = null
  let currentItem = null
  for (const line of lines) {
    if (/^\S[^:]*:\s*$/.test(line) && !line.startsWith('-')) {
      currentList = []
      data[line.replace(/:\s*$/, '').trim()] = currentList
      currentItem = null
      continue
    }
    const itemStart = line.match(/^\s+-\s+(\w+):(.*)$/)
    if (itemStart && currentList) {
      currentItem = { [itemStart[1]]: parseScalar(itemStart[2]) }
      currentList.push(currentItem)
      continue
    }
    const itemField = line.match(/^\s+(\w+):(.*)$/)
    if (itemField && currentItem) {
      currentItem[itemField[1]] = parseScalar(itemField[2])
      continue
    }
    const kv = line.match(/^(\w[\w-]*):(.+)$/)
    if (kv) {
      data[kv[1]] = parseScalar(kv[2])
      currentList = null
      currentItem = null
    }
  }
  return { data, body: match[2].trim() }
}

function parseScalar(raw) {
  const v = raw.trim().replace(/^["']|["']$/g, '')
  if (v === 'true') return true
  if (v === 'false') return false
  if (v !== '' && !Number.isNaN(Number(v)) && !/^0\d/.test(v)) return Number(v)
  return v
}

// ---------------------------------------------------------------- moments

function nearestIndexByTime(enriched, t0, isoTime) {
  const target = Date.parse(isoTime)
  if (!Number.isFinite(target) || !t0) return null
  let best = null
  let bestDelta = Infinity
  enriched.forEach((p, i) => {
    if (!p.time) return
    const delta = Math.abs(p.time - target)
    if (delta < bestDelta) {
      bestDelta = delta
      best = i
    }
  })
  return best
}

function nearestIndexByKm(enriched, km) {
  const target = km * 1000
  let best = 0
  let bestDelta = Infinity
  enriched.forEach((p, i) => {
    const delta = Math.abs(p.dist - target)
    if (delta < bestDelta) {
      bestDelta = delta
      best = i
    }
  })
  return best
}

/**
 * Refuel detection: a stop (≥180s dwelling within ~50m of path distance)
 * within 120m of an OSM fuel station resets the tank. Needs timestamps —
 * recovered tracks without clocks get none (the page wraps the gauge).
 */
function detectRefuels(enriched, fuelNodes) {
  if (!fuelNodes?.length) return []
  const refuels = []
  let a = 0
  for (let i = 1; i < enriched.length; i++) {
    const moved = enriched[i].dist - enriched[a].dist
    if (moved < 50) continue
    const t0 = enriched[a].time
    const t1 = enriched[i - 1].time
    if (t0 && t1 && t1 - t0 >= 180000) {
      const stop = enriched[a]
      let best = null
      for (const fnode of fuelNodes) {
        const d = haversine(stop, fnode)
        if (d <= 120 && (!best || d < best.d)) best = { d, fnode }
      }
      if (best) {
        refuels.push({
          dist: Math.round(stop.dist),
          lon: +stop.lon.toFixed(5),
          lat: +stop.lat.toFixed(5),
        })
      }
    }
    a = i
  }
  return refuels
}

function resolveMoments(moments, track) {
  const { _enriched: enriched, _t0: t0 } = track
  return moments.map((m, i) => {
    let idx = null
    if (m.time !== undefined) {
      idx = nearestIndexByTime(enriched, t0, String(m.time))
    }
    if (idx === null && m.km !== undefined) {
      idx = nearestIndexByKm(enriched, m.km)
    }
    const p = idx === null ? null : enriched[idx]
    return {
      id: i,
      type: m.type || (m.photo ? 'photo' : m.audio ? 'audio' : 'note'),
      text: m.text || '',
      photo: m.photo || null,
      audio: m.audio || null,
      lon: p ? +p.lon.toFixed(5) : null,
      lat: p ? +p.lat.toFixed(5) : null,
      distMeters: p ? Math.round(p.dist) : null,
      tSeconds: p?.time && t0 ? Math.round((p.time - t0) / 1000) : null,
    }
  })
}

// ---------------------------------------------------------------- main

async function processRide(slug, states) {
  const dir = join(RIDES_DIR, slug)
  const gpxPath = join(dir, 'track.gpx')
  const mdPath = join(dir, 'ride.md')

  const { data, body } = existsSync(mdPath)
    ? parseFrontmatter(await readFile(mdPath, 'utf8'))
    : { data: {}, body: '' }

  let track = null
  let basemap = null
  if (existsSync(gpxPath)) {
    const rawPoints = await parseGpx(gpxPath)
    const trim = data.privacyTrimMeters ?? DEFAULT_PRIVACY_TRIM_METERS
    track = computeTrack(rawPoints, trim, slug)
    try {
      basemap = await buildBasemap(
        padBounds(track.bounds, 0.12),
        join(ROOT, 'data/cache'),
        slug
      )
    } catch (err) {
      console.warn(`  ⚠ basemap skipped for ${slug}: ${err.message}`)
    }
    try {
      const fuelNodes = await fetchFuelStations(
        padBounds(track.bounds, 0.02),
        join(ROOT, 'data/cache'),
        slug
      )
      track.refuels = detectRefuels(track._enriched, fuelNodes)
    } catch (err) {
      console.warn(`  ⚠ fuel stations skipped for ${slug}: ${err.message}`)
    }
  }

  const moments = Array.isArray(data.moments)
    ? track
      ? resolveMoments(data.moments, track)
      : data.moments.map((m, i) => ({ id: i, ...m }))
    : []

  const ride = {
    slug,
    title: data.title || slug,
    date: data.date ? String(data.date) : (track?.startTime ?? null),
    region: data.region || null,
    hue: data.hue ?? 25,
    draft: data.draft === true,
    intro: body,
    stats: track?.stats ?? null,
    bounds: track?.bounds ?? null,
    startTime: track?.startTime ?? null,
    points: track?.points ?? [],
    basemap,
    // state boundary segments, clipped to the plate — drawn as a distinct
    // cartographic layer on the ride page
    states: track ? clipStates(track.bounds, states, 0.15, 900) : null,
    refuels: track?.refuels ?? [],
    moments,
  }

  await writeFile(join(OUT_DIR, `${slug}.json`), JSON.stringify(ride))
  return ride
}

function padBounds(b, frac) {
  const dLon = (b.maxLon - b.minLon) * frac
  const dLat = (b.maxLat - b.minLat) * frac
  return {
    minLon: b.minLon - dLon,
    maxLon: b.maxLon + dLon,
    minLat: b.minLat - dLat,
    maxLat: b.maxLat + dLat,
  }
}

async function main() {
  if (!existsSync(RIDES_DIR)) {
    console.log('No content/rides directory; nothing to do.')
    return
  }
  await mkdir(OUT_DIR, { recursive: true })
  let states = null
  try {
    states = await loadStates(join(ROOT, 'data/cache'))
  } catch (err) {
    console.warn(`⚠ state boundaries unavailable: ${err.message}`)
  }
  const entries = await readdir(RIDES_DIR, { withFileTypes: true })
  const slugs = entries.filter((e) => e.isDirectory()).map((e) => e.name)

  const index = []
  const allBounds = []
  let totalMeters = 0
  for (const slug of slugs) {
    const ride = await processRide(slug, states)
    if (!ride.draft && ride.bounds) {
      allBounds.push(ride.bounds)
      totalMeters += ride.stats?.distanceMeters ?? 0
    }
    const km = ride.stats ? (ride.stats.distanceMeters / 1000).toFixed(1) : '?'
    console.log(
      `✓ ${slug} — ${km}km, ${ride.points.length} pts, ${ride.moments.length} moments${ride.draft ? ' (draft)' : ''}`
    )
    if (ride.draft) continue
    index.push({
      slug: ride.slug,
      title: ride.title,
      date: ride.date,
      region: ride.region,
      hue: ride.hue,
      stats: ride.stats,
      momentCount: ride.moments.length,
      // thumbnail polyline: ~80 pts normalized to a 0–1 box (y flipped for SVG)
      thumb: thumbPolyline(ride),
      // true footprint size in meters — lets the index draw every ride at the
      // same geographic scale (honest small multiples)
      extentMeters: extentMeters(ride),
      // elevation strip: 48 samples normalized 0–1 over the ride's own range
      elev: elevStrip(ride),
      // speed histogram: 16 bins 0→max, heights normalized 0–1
      spdHist: speedHistogram(ride),
      startTime: ride.startTime,
      // coarse lon/lat trace for ghost overlays on other rides' maps
      ghost: ghostTrace(ride),
      // state boundary segments in thumb space — geographic grounding
      outlines: stateOutlines(ride, states),
    })
  }
  index.sort((a, b) => String(b.date).localeCompare(String(a.date)))

  // the atlas: every ride on one plate — total-trip distillation
  if (allBounds.length) {
    const combined = {
      minLon: Math.min(...allBounds.map((b) => b.minLon)),
      maxLon: Math.max(...allBounds.map((b) => b.maxLon)),
      minLat: Math.min(...allBounds.map((b) => b.minLat)),
      maxLat: Math.max(...allBounds.map((b) => b.maxLat)),
    }
    const atlas = {
      bounds: combined,
      totalMeters: Math.round(totalMeters),
      rideCount: index.length,
      states: clipStates(combined, states, 0.06, 1800),
      rides: index.map((r) => ({
        slug: r.slug,
        title: r.title,
        ghost: r.ghost,
      })),
    }
    await writeFile(join(OUT_DIR, 'atlas.json'), JSON.stringify(atlas))
  }
  await writeFile(join(OUT_DIR, 'index.json'), JSON.stringify(index))
  console.log(`Wrote ${index.length} ride(s) to content/processed/rides/`)
}

function thumbPolyline(ride) {
  if (!ride.points.length || !ride.bounds) return null
  const xf = thumbTransform(ride)
  const step = Math.max(1, Math.floor(ride.points.length / 80))
  const pts = []
  for (let i = 0; i < ride.points.length; i += step) {
    pts.push(xf(ride.points[i]))
  }
  return pts
}

/** Longest side of the ride's bounding box, in meters. */
function extentMeters(ride) {
  const b = ride.bounds
  if (!b) return null
  const midLat = (b.minLat + b.maxLat) / 2
  const wM = haversine(
    { lat: midLat, lon: b.minLon },
    { lat: midLat, lon: b.maxLon }
  )
  const hM = haversine(
    { lat: b.minLat, lon: b.minLon },
    { lat: b.maxLat, lon: b.minLon }
  )
  return Math.round(Math.max(wM, hM))
}

// ------------------------------------------------------- state outlines

const STATES_URL =
  'https://cdn.jsdelivr.net/gh/PublicaMundi/MappingAPI@master/data/geojson/us-states.json'
let statesCache = null

/** US state boundaries (Census, public domain) — fetched once, cached. */
async function loadStates(cacheDir) {
  if (statesCache) return statesCache
  const cachePath = join(cacheDir, 'us-states.json')
  if (existsSync(cachePath)) {
    statesCache = JSON.parse(await readFile(cachePath, 'utf8'))
    return statesCache
  }
  const res = await fetch(STATES_URL)
  if (!res.ok) throw new Error(`states fetch ${res.status}`)
  statesCache = await res.json()
  await mkdir(cacheDir, { recursive: true })
  await writeFile(cachePath, JSON.stringify(statesCache))
  return statesCache
}

/**
 * State-boundary segments crossing the ride's (padded) bbox, transformed
 * into the same normalized thumb space — vague geographic grounding for
 * the small multiples.
 */
function clipStates(bounds, states, padFrac, maxPts) {
  if (!bounds || !states) return null
  const b = padBounds(bounds, padFrac)
  const bbox = [b.minLon, b.minLat, b.maxLon, b.maxLat]
  // simplify tolerance scales with plate size; keep boundaries recognizable
  const tol = Math.max(b.maxLon - b.minLon, b.maxLat - b.minLat) / 600
  const segs = []
  let budget = maxPts
  const pushLine = (coords) => {
    if (coords.length < 2 || budget <= 0) return
    const slim = simplify(lineString(coords), {
      tolerance: tol,
      highQuality: false,
    }).geometry.coordinates.map((c) => [+c[0].toFixed(4), +c[1].toFixed(4)])
    if (slim.length < 2) return
    budget -= slim.length
    segs.push(slim)
  }
  for (const feat of states.features ?? []) {
    const geom = feat.geometry
    const polys =
      geom.type === 'Polygon'
        ? [geom.coordinates]
        : geom.type === 'MultiPolygon'
          ? geom.coordinates
          : []
    for (const poly of polys) {
      for (const ring of poly) {
        // true bbox clipping: boundaries run to the plate edge, no gaps
        const clipped = bboxClip(lineString(ring), bbox).geometry
        if (clipped.type === 'LineString') {
          pushLine(clipped.coordinates)
        } else {
          clipped.coordinates.forEach(pushLine)
        }
      }
    }
  }
  return segs.length ? segs : null
}

function stateOutlines(ride, states) {
  const segs = clipStates(ride.bounds, states, 0.35, 500)
  if (!segs) return null
  const xf = thumbTransform(ride)
  return segs.map((seg) => seg.map(xf))
}

/** lon/lat → normalized 0–1 thumb space (aspect-true, y flipped). */
function thumbTransform(ride) {
  const { minLon, maxLon, minLat, maxLat } = ride.bounds
  const cosLat = Math.cos((((minLat + maxLat) / 2) * Math.PI) / 180)
  const w = (maxLon - minLon) * cosLat || 1e-9
  const h = maxLat - minLat || 1e-9
  const scale = 1 / Math.max(w, h)
  const xPad = (1 - w * scale) / 2
  const yPad = (1 - h * scale) / 2
  return (c) => [
    +(xPad + (c[0] - minLon) * cosLat * scale).toFixed(3),
    +(1 - yPad - (c[1] - minLat) * scale).toFixed(3),
  ]
}

/** Coarse trace (~150 pts, 4dp) for "where else I've been" ghost overlays. */
function ghostTrace(ride) {
  const pts = ride.points
  if (pts.length < 2) return null
  const step = Math.max(1, Math.floor(pts.length / 150))
  const out = []
  for (let i = 0; i < pts.length; i += step) {
    out.push([+pts[i][0].toFixed(4), +pts[i][1].toFixed(4)])
  }
  return out
}

/** 16-bin speed histogram (m/s bins to max), heights normalized 0–1. */
function speedHistogram(ride) {
  const spds = ride.points.map((p) => p[5] ?? 0).filter((s) => s > 0.5)
  if (spds.length < 8) return null
  const max = Math.max(...spds)
  const bins = Array.from({ length: 16 }).fill(0)
  for (const s of spds) {
    bins[Math.min(15, Math.floor((s / max) * 16))]++
  }
  const peak = Math.max(...bins) || 1
  return bins.map((b) => +(b / peak).toFixed(2))
}

/** 48 elevation samples by distance, normalized 0–1 over the ride's range. */
function elevStrip(ride) {
  const pts = ride.points
  if (!pts.length) return null
  const eles = pts.map((p) => p[2]).filter((e) => e !== null)
  if (!eles.length) return null
  const minE = Math.min(...eles)
  const span = Math.max(...eles) - minE || 1
  const total = pts[pts.length - 1][4] || 1
  const out = []
  let j = 0
  for (let i = 0; i < 48; i++) {
    const target = (i / 47) * total
    while (j < pts.length - 1 && pts[j][4] < target) j++
    out.push(+(((pts[j][2] ?? minE) - minE) / span).toFixed(2))
  }
  return out
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
