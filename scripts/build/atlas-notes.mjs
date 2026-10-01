#!/usr/bin/env node
// Builds data/atlas/notes-places.json for the Valley Atlas notes layer: the
// roads EJ writes about riding, the towns New York City drowned for its
// reservoirs, and the hidden-history sites from his Hudson Valley book notes.
// Also validates data/atlas/story.json (story-mode chapters).
//
//   node scripts/build/atlas-notes.mjs            fetch missing roads, write, check
//   node scripts/build/atlas-notes.mjs --refresh  re-fetch every road from Overpass
//   node scripts/build/atlas-notes.mjs --check    validate the existing files only
//
// PRIVACY: this map is public. Quotes may only come from EJ's published writing
// (content/blog, not drafts/private/robots, not draft/hidden/unlisted/password).
// His Obsidian vault and agent-vault are private: use them to find places, never
// quote them. Never pin his home, neighborhood, storage, studio or mesh nodes.
import { existsSync } from 'node:fs'
import { readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const ROOT = process.cwd()
const OUT = resolve(ROOT, 'data/atlas/notes-places.json')
const STORY = resolve(ROOT, 'data/atlas/story.json')
const UA = 'ejfox-valley-atlas/0.1 (https://ejfox.com)'
const OVERPASS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.private.coffee/api/interpreter',
]
const BOUNDS = { west: -75.6, east: -72.6, south: 40.7, north: 42.9 }
// Overpass search box for roads (south, west, north, east)
const BBOX = '41.0,-74.6,41.8,-73.6'
// ~15 m at this latitude; plenty for a regional map
const TOLERANCE = 0.00015

const HOWL = 'content/blog/2025/hidden-networks-of-warmth.md'
const LAYER_KEYS = new Set([
  'rides',
  'repeaters',
  'coverage',
  'coverage-beacon',
  'records',
  'gauges',
  'tides',
  'trains',
  'water',
  'trailheads',
  'notes-roads',
  'notes-drowned',
  'notes-history',
])
const PRIVATE_PATHS = [/obsidian/i, /agent-vault/i, /Mobile Documents/i]

// Roads: an Overpass way filter, plus an optional longitude clip so a long
// state route only draws the stretch that is actually the ride
const ROADS = [
  {
    name: 'Route 9D',
    filter: 'way["highway"]["ref"~"(^|;) ?NY 9D(;|$)"]',
    note: 'The east-bank road from the Bear Mountain Bridge north through Garrison and Cold Spring to Beacon',
    quote:
      'zipping up and down 9D and up and around Bear Mountain to Perkins Lookout',
    source: HOWL,
  },
  {
    name: 'Perkins Memorial Drive',
    filter: 'way["highway"]["name"="Perkins Memorial Drive"]',
    note: 'A 1930s park road that switchbacks to the summit of Bear Mountain and the Perkins Memorial Tower',
    quote: 'up and around Bear Mountain to Perkins Lookout',
    source: HOWL,
  },
  {
    name: 'Seven Lakes Drive',
    filter: 'way["highway"]["name"="Seven Lakes Drive"]',
    note: 'A parkway threading the lakes of Harriman and Bear Mountain state parks',
  },
  {
    name: 'Storm King Highway (Route 218)',
    filter: 'way["highway"]["ref"~"(^|;) ?NY 218(;|$)"]',
    note: 'Cut into the cliff face of Storm King Mountain in the 1920s, between Cornwall-on-Hudson and West Point',
  },
  {
    name: 'Bear Mountain Bridge and Anthony’s Nose',
    filter: 'way["highway"]["name"~"^Bear Mountain Bridge( Road)?$"]',
    // stop short of the Annsville traffic circle
    west: -74.0,
    east: -73.95,
    note: 'The 1924 suspension bridge and the road carved around the flank of Anthony’s Nose on the east bank',
  },
  {
    name: 'Route 301 through Fahnestock',
    filter: 'way["highway"]["ref"~"(^|;) ?NY 301(;|$)"]',
    // Cold Spring to the Taconic: the state-park stretch
    east: -73.79,
    note: 'Climbs out of Cold Spring and through Clarence Fahnestock State Park, past Canopus Lake',
  },
  {
    name: 'Route 302',
    filter: 'way["highway"]["ref"~"(^|;) ?NY 302(;|$)"]',
    note: 'A two-lane state road through the farm country of Orange County',
  },
]

// Reservoir towns. `precision`: 'gazetteer' = a Wikipedia/Wikidata/GNIS
// coordinate for the hamlet; 'approximate' = placed on the reservoir between
// documented neighbors, good to a couple of kilometres
const DROWNED = [
  {
    name: 'Brown’s Station',
    coordinates: [-74.20417, 41.94694],
    precision: 'gazetteer',
    reservoir: 'Ashokan Reservoir',
    year: 1915,
    note: 'An Esopus Valley hamlet on the Ulster and Delaware Railroad, submerged by the Ashokan Reservoir',
  },
  {
    name: 'Brodhead’s Bridge',
    coordinates: [-74.24722, 41.95611],
    precision: 'gazetteer',
    reservoir: 'Ashokan Reservoir',
    year: 1915,
    note: 'A railroad station and crossing of the Esopus Creek, now under the western basin of the Ashokan',
  },
  {
    name: 'Shokan (original site)',
    coordinates: [-74.225, 41.955],
    precision: 'approximate',
    reservoir: 'Ashokan Reservoir',
    year: 1915,
    note: 'The first Shokan sat in the valley floor; the hamlet was rebuilt on higher ground along Route 28',
  },
  {
    name: 'Olive City',
    coordinates: [-74.18, 41.955],
    precision: 'approximate',
    reservoir: 'Ashokan Reservoir',
    year: 1915,
    note: 'A hamlet between the original sites of Shokan and Ashton, flooded when the Ashokan filled',
  },
  {
    name: 'Ashton',
    coordinates: [-74.157, 41.971],
    precision: 'approximate',
    reservoir: 'Ashokan Reservoir',
    year: 1915,
    note: 'A hamlet in the town of Hurley, lost beneath the eastern basin of the Ashokan',
  },
  {
    name: 'Neversink (original village)',
    coordinates: [-74.645, 41.831],
    precision: 'approximate',
    reservoir: 'Neversink Reservoir',
    year: 1954,
    note: 'Condemned for the Neversink Reservoir and rebuilt a few miles away',
  },
  {
    name: 'Bittersweet',
    coordinates: [-74.645, 41.825],
    precision: 'approximate',
    reservoir: 'Neversink Reservoir',
    year: 1954,
    note: 'A small community submerged entirely by the Neversink Reservoir, never rebuilt',
  },
  {
    name: 'Arena',
    coordinates: [-74.73738, 42.11564],
    precision: 'gazetteer',
    reservoir: 'Pepacton Reservoir',
    year: 1955,
    note: 'One of four Delaware County hamlets destroyed for the Pepacton Reservoir, at its eastern end',
  },
  {
    name: 'Union Grove',
    coordinates: [-74.79, 42.1],
    precision: 'approximate',
    reservoir: 'Pepacton Reservoir',
    year: 1955,
    note: 'A Pepacton hamlet between Arena and Shavertown, flooded with the East Branch valley',
  },
  {
    name: 'Shavertown',
    coordinates: [-74.83917, 42.09278],
    precision: 'gazetteer',
    reservoir: 'Pepacton Reservoir',
    year: 1955,
    note: 'Submerged by the Pepacton Reservoir; its church and cemetery were moved before the water came',
  },
  {
    name: 'Pepacton',
    coordinates: [-74.926, 42.077],
    precision: 'approximate',
    reservoir: 'Pepacton Reservoir',
    year: 1955,
    note: 'The hamlet that named the reservoir, near today’s East Delaware Tunnel intake',
  },
  {
    name: 'Cannonsville',
    coordinates: [-75.3218, 42.0807],
    precision: 'gazetteer',
    reservoir: 'Cannonsville Reservoir',
    year: 1964,
    note: 'A town founded in the late 18th century and destroyed in 1964 for the Cannonsville Reservoir',
  },
  {
    name: 'Rock Rift',
    coordinates: [-75.19184, 42.09231],
    precision: 'gazetteer',
    reservoir: 'Cannonsville Reservoir',
    year: 1964,
    note: 'A hamlet on the West Branch of the Delaware, southwest of Walton, taken for the Cannonsville',
  },
]

const HISTORY = [
  {
    name: 'Grand Central Terminal',
    coordinates: [-73.9772, 40.7528],
    year: 1913,
    note: 'The terminal at the southern end of the Hudson Line, dug out of a pit four times the volume of the Empire State Building',
    quote:
      'I found myself spending a lot of time at various MTA and NJT stations, learning the times when the trains run express',
    source: HOWL,
  },
  {
    name: 'High Bridge (Croton Aqueduct)',
    coordinates: [-73.9302, 40.8423],
    year: 1848,
    note: 'The Old Croton Aqueduct’s crossing of the Harlem River, carrying upstate water into Manhattan by gravity',
  },
  {
    name: 'Spuyten Duyvil curve',
    coordinates: [-73.9228, 40.8796],
    year: 1882,
    note: 'Site of the 1882 Pacific Express wreck, and of the 2013 Metro-North derailment on the same curve that killed four',
  },
  {
    name: 'Sunnyside',
    coordinates: [-73.86988, 41.04756],
    year: 1835,
    note: 'Washington Irving’s riverside cottage, a prototype of the New Yorker’s country retreat',
  },
  {
    name: 'Lyndhurst',
    coordinates: [-73.86728, 41.05397],
    year: 1880,
    note: 'Jay Gould’s Gothic Revival estate, bought as an escape from his New York City business',
  },
  {
    name: 'Kykuit',
    coordinates: [-73.84444, 41.08961],
    year: 1893,
    note: 'The Rockefeller estate in Pocantico Hills; the name is Dutch for lookout',
  },
  {
    name: 'Peekskill riots',
    coordinates: [-73.892, 41.3244],
    year: 1949,
    note: 'Approximate site of the Paul Robeson concert at which concertgoers were attacked by mobs as they left',
  },
  {
    name: 'Storm King Mountain',
    coordinates: [-73.99458, 41.43287],
    year: 1962,
    note: 'Con Edison’s plan for a pumped-storage plant here set off an 18-year fight that helped create modern environmental law',
  },
  {
    name: 'Bannerman’s Castle',
    coordinates: [-73.98887, 41.45531],
    year: 1901,
    note: 'A military-surplus dealer’s arsenal on Pollepel Island, ruined by an explosion and fire',
  },
  {
    name: 'Mount Beacon Incline Railway',
    coordinates: [-73.95556, 41.49083],
    year: 1902,
    note: 'Billed as the steepest incline railway in the world, it ran tourists to the summit until 1978',
  },
  {
    name: 'Dia Beacon',
    coordinates: [-73.98248, 41.49971],
    year: 2003,
    note: 'A 1929 Nabisco box-printing plant, Beacon’s largest employer, reopened as a museum of modern art',
  },
  {
    name: 'Pete and Toshi Seeger Riverfront Park',
    coordinates: [-73.98647, 41.50818],
    year: 1969,
    note: 'Beacon’s riverfront, home port of the sloop Clearwater that Pete Seeger launched to clean up the Hudson',
  },
  {
    name: 'Vanderbilt Mansion',
    coordinates: [-73.94194, 41.79611],
    year: 1899,
    note: 'A 54-room Hyde Park house the Vanderbilts used only in spring and fall',
  },
  {
    name: 'Val-Kill',
    coordinates: [-73.89889, 41.76306],
    year: 1924,
    note: 'Eleanor Roosevelt’s cottage and furniture factory, the only property she ever owned',
  },
  {
    name: 'Olana',
    coordinates: [-73.82944, 42.21778],
    year: 1872,
    note: 'Frederic Church’s hilltop house, sited and planted to frame the Hudson and the Catskills',
  },
  {
    name: 'Thomas Cole House (Cedar Grove)',
    coordinates: [-73.86194, 42.22583],
    year: 1836,
    note: 'Home and studio of the founder of the Hudson River School',
  },
  {
    name: 'Catskill Mountain House site',
    coordinates: [-74.03472, 42.195],
    year: 1824,
    note: 'Site of a grand hotel on the Catskill escarpment, visible from the valley floor, where steamboat tourists came to look back at the river',
  },
  {
    name: 'Grossinger’s',
    coordinates: [-74.723, 41.7898],
    year: 1986,
    note: 'The best-known Borscht Belt resort in Liberty, closed in 1986 and left to ruin',
  },
  {
    name: 'The Concord',
    coordinates: [-74.65464, 41.67885],
    year: 1998,
    note: 'The largest Borscht Belt hotel at Kiamesha Lake, closed in 1998',
  },
]

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const round = (c) => [+c[0].toFixed(5), +c[1].toFixed(5)]

const overpass = async (filter) => {
  const query = `[out:json][timeout:90];${filter}(${BBOX});out geom;`
  for (let attempt = 0; attempt < 6; attempt++) {
    const url = OVERPASS[attempt % OVERPASS.length]
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'User-Agent': UA,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({ data: query }),
        signal: AbortSignal.timeout(120_000),
      })
      if (res.ok) {
        await sleep(1500)
        return (await res.json()).elements
      }
    } catch {
      // network error: fall through to the next mirror
    }
    await sleep(5000 * (attempt + 1))
  }
  throw new Error(`Overpass failed for ${filter}`)
}

// Douglas-Peucker in degrees
const simplify = (pts) => {
  if (pts.length < 3) return pts
  const [ax, ay] = pts[0]
  const [bx, by] = pts[pts.length - 1]
  const len = Math.hypot(bx - ax, by - ay) || 1e-12
  let max = 0
  let idx = 0
  for (let i = 1; i < pts.length - 1; i++) {
    const [px, py] = pts[i]
    const d = Math.abs((bx - ax) * (ay - py) - (ax - px) * (by - ay)) / len
    if (d > max) {
      max = d
      idx = i
    }
  }
  if (max <= TOLERANCE) return [pts[0], pts[pts.length - 1]]
  return [
    ...simplify(pts.slice(0, idx + 1)).slice(0, -1),
    ...simplify(pts.slice(idx)),
  ]
}

const key = (c) => `${c[0].toFixed(6)},${c[1].toFixed(6)}`

// Greedily chain ways that share endpoints into longer lines
const chain = (lines) => {
  const pool = lines.map((l) => [...l])
  const out = []
  while (pool.length) {
    let line = pool.pop()
    let grew = true
    while (grew) {
      grew = false
      for (let i = 0; i < pool.length; i++) {
        const l = pool[i]
        const head = key(line[0])
        const tail = key(line[line.length - 1])
        if (key(l[0]) === tail) line = [...line, ...l.slice(1)]
        else if (key(l[l.length - 1]) === tail)
          line = [...line, ...[...l].reverse().slice(1)]
        else if (key(l[l.length - 1]) === head) line = [...l, ...line.slice(1)]
        else if (key(l[0]) === head)
          line = [...[...l].reverse(), ...line.slice(1)]
        else continue
        pool.splice(i, 1)
        grew = true
        break
      }
    }
    out.push(line)
  }
  return out
}

const clip = (line, { west = -180, east = 180 }) => {
  const parts = []
  let cur = []
  for (const c of line) {
    if (c[0] >= west && c[0] <= east) cur.push(c)
    else if (cur.length) {
      parts.push(cur)
      cur = []
    }
  }
  if (cur.length) parts.push(cur)
  return parts.filter((p) => p.length > 1)
}

const fetchRoad = async (road) => {
  const ways = (await overpass(road.filter)).filter((e) => e.geometry)
  if (!ways.length) throw new Error(`No ways for ${road.name}`)
  const lines = chain(ways.map((w) => w.geometry.map((g) => [g.lon, g.lat])))
    .flatMap((l) => clip(l, road))
    .map((l) => simplify(l).map(round))
    .filter((l) => l.length > 1)
  return lines.length === 1
    ? { type: 'LineString', coordinates: lines[0] }
    : { type: 'MultiLineString', coordinates: lines }
}

const props = (s, kind) => {
  const p = { name: s.name, kind, note: s.note }
  if (s.year) p.year = s.year
  if (s.precision) p.precision = s.precision
  if (s.reservoir) p.reservoir = s.reservoir
  if (s.quote) {
    p.quote = s.quote
    p.source = s.source
  }
  return p
}

const build = async (refresh) => {
  const cached = new Map()
  if (!refresh) {
    const prev = JSON.parse(await readFile(OUT, 'utf8').catch(() => '{}'))
    for (const f of prev.features ?? [])
      if (f.properties.kind === 'road')
        cached.set(f.properties.name, f.geometry)
  }
  const features = []
  for (const r of ROADS) {
    const geometry = cached.get(r.name) ?? (await fetchRoad(r))
    features.push({ type: 'Feature', geometry, properties: props(r, 'road') })
  }
  for (const [list, kind] of [
    [DROWNED, 'drowned'],
    [HISTORY, 'history'],
  ])
    for (const s of list)
      features.push({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: s.coordinates },
        properties: props(s, kind),
      })
  await writeFile(
    OUT,
    JSON.stringify({ type: 'FeatureCollection', features }) + '\n'
  )
  console.log(`wrote ${features.length} features → ${OUT}`)
}

const inBounds = ([lon, lat]) =>
  lon >= BOUNDS.west &&
  lon <= BOUNDS.east &&
  lat >= BOUNDS.south &&
  lat <= BOUNDS.north

const coordsOf = (g) =>
  g.type === 'Point'
    ? [g.coordinates]
    : g.type === 'LineString'
      ? g.coordinates
      : g.coordinates.flat()

// A quote must come verbatim from a published post in content/blog
const sourceCache = new Map()
const checkQuote = async (quote, source) => {
  if (!quote && !source) return []
  if (!quote || !source) return ['quote without source (or vice versa)']
  if (PRIVATE_PATHS.some((re) => re.test(source)))
    return [`private source ${source}`]
  if (
    !/^content\/blog\/.+\.md$/.test(source) ||
    /\/(?:drafts|private|robots|backup)\//.test(source)
  )
    return [`source not a public post: ${source}`]
  const path = resolve(ROOT, source)
  if (!existsSync(path)) return [`missing source ${source}`]
  if (!sourceCache.has(path))
    sourceCache.set(path, await readFile(path, 'utf8'))
  const text = sourceCache.get(path)
  const front = text.match(/^---\n([\s\S]*?)\n---/)?.[1] ?? ''
  if (/^draft:\s*true/m.test(front)) return [`draft source ${source}`]
  if (/^(?:hidden|unlisted|password|passwordHash):\s*(?!false)\S/m.test(front))
    return [`protected source ${source}`]
  return text.includes(quote) ? [] : [`quote not verbatim in ${source}`]
}

const checkPlaces = async () => {
  const { features } = JSON.parse(await readFile(OUT, 'utf8'))
  const kinds = { road: 0, drowned: 0, history: 0 }
  const rows = []
  let bad = 0
  for (const f of features) {
    const p = f.properties
    const problems = []
    if (!(p.kind in kinds)) problems.push(`kind ${p.kind}`)
    else kinds[p.kind]++
    const want = p.kind === 'road' ? /LineString$/ : /^Point$/
    if (!want.test(f.geometry.type))
      problems.push(`geometry ${f.geometry.type}`)
    const coords = coordsOf(f.geometry)
    if (!coords.length || !coords.every(inBounds))
      problems.push('out of bounds')
    if (!p.name || !p.note || p.note.endsWith('.')) problems.push('name/note')
    if (
      p.kind === 'drowned' &&
      !['gazetteer', 'approximate'].includes(p.precision)
    )
      problems.push(`precision ${p.precision}`)
    problems.push(...(await checkQuote(p.quote, p.source)))
    if (problems.length) bad++
    rows.push({
      name: p.name,
      kind: p.kind,
      points: coords.length,
      year: p.year ?? '',
      quote: p.quote ? 'yes' : '',
      ok: problems.join('; ') || 'ok',
    })
  }
  console.table(rows)
  console.log(kinds)
  return bad
}

const checkStory = async () => {
  const { chapters } = JSON.parse(await readFile(STORY, 'utf8'))
  const ids = new Set()
  const rows = []
  let bad = 0
  for (const c of chapters) {
    const problems = []
    if (!c.id || ids.has(c.id)) problems.push('id')
    ids.add(c.id)
    if (!c.title || !c.body) problems.push('title/body')
    const cam = c.camera ?? {}
    if (!Array.isArray(cam.center) || !inBounds(cam.center))
      problems.push('camera center')
    if (!(cam.zoom >= 5 && cam.zoom <= 17)) problems.push('zoom')
    if (!(cam.pitch >= 0 && cam.pitch <= 85)) problems.push('pitch')
    if (typeof cam.bearing !== 'number') problems.push('bearing')
    for (const l of c.layers ?? [])
      if (!LAYER_KEYS.has(l)) problems.push(`layer ${l}`)
    if (!c.quote) problems.push('no quote')
    problems.push(...(await checkQuote(c.quote, c.source)))
    if (problems.length) bad++
    rows.push({
      id: c.id,
      layers: (c.layers ?? []).join(','),
      ok: problems.join('; ') || 'ok',
    })
  }
  if (chapters.length < 6 || chapters.length > 8) {
    console.error(`story has ${chapters.length} chapters (want 6-8)`)
    bad++
  }
  console.table(rows)
  return bad
}

const args = process.argv.slice(2)
if (!args.includes('--check')) await build(args.includes('--refresh'))
const bad = (await checkPlaces()) + (await checkStory())
if (bad) {
  console.error(`${bad} item(s) failed validation`)
  process.exit(1)
}
