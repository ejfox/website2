// Regenerates data/atlas/live-stations.json (Hudson Line stops + track shape
// from Metro-North static GTFS, plus the curated gauges/tides).
// Usage: node scripts/build/atlas-live-stations.mjs <unzipped-mnr-gtfs-dir> data/atlas/live-stations.json
// MNR static GTFS: https://rrgtfsfeeds.s3.amazonaws.com/gtfsmnr.zip
import { readFileSync, writeFileSync } from 'node:fs'
const G = process.argv[2]
const csv = (f) => {
  const [h, ...rows] = readFileSync(`${G}/${f}`, 'utf8').trim().split(/\r?\n/)
  const k = h.split(',')
  return rows.map((r) =>
    Object.fromEntries(r.split(',').map((v, i) => [k[i], v]))
  )
}
const ids =
  '1 10 11 14 16 17 18 184 19 20 22 23 24 25 27 29 30 31 33 37 39 4 40 42 43 44 46 49 51 622 9'.split(
    ' '
  )
const stops = {}
for (const s of csv('stops.txt'))
  if (ids.includes(s.stop_id))
    stops[s.stop_id] = {
      name: s.stop_name,
      coord: [+(+s.stop_lon).toFixed(5), +(+s.stop_lat).toFixed(5)],
    }
const pts = csv('shapes.txt')
  .filter((r) => r.shape_id === '12')
  .sort((a, b) => a.shape_pt_sequence - b.shape_pt_sequence)
  .map((r) => [+r.shape_pt_lon, +r.shape_pt_lat])
// Douglas-Peucker in a local equirectangular frame (~meters)
const k = Math.cos((41.2 * Math.PI) / 180)
const xy = (p) => [p[0] * 111320 * k, p[1] * 110540]
const segDist = (p, a, b) => {
  const [px, py] = xy(p),
    [ax, ay] = xy(a),
    [bx, by] = xy(b)
  const dx = bx - ax,
    dy = by - ay,
    l = dx * dx + dy * dy
  const t = l
    ? Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / l))
    : 0
  return Math.hypot(px - ax - t * dx, py - ay - t * dy)
}
const dp = (p, tol) => {
  if (p.length < 3) return p
  let max = 0,
    idx = 0
  for (let i = 1; i < p.length - 1; i++) {
    const d = segDist(p[i], p[0], p.at(-1))
    if (d > max) {
      max = d
      idx = i
    }
  }
  return max > tol
    ? [...dp(p.slice(0, idx + 1), tol).slice(0, -1), ...dp(p.slice(idx), tol)]
    : [p[0], p.at(-1)]
}
const shape = dp(pts, 15).map((p) => [+p[0].toFixed(5), +p[1].toFixed(5)])
const gauges = [
  ['01335754', 'WTFN6', 'Hudson River at Waterford (Lock 1)', 'main'],
  ['01358000', 'TRYN6', 'Hudson River at Troy', 'main'],
  ['01359139', 'ALBN6', 'Hudson River at Albany', 'main'],
  [null, 'CXHN6', 'Hudson River near Coxsackie', 'main', [-73.795, 42.353]],
  [
    null,
    'TKPN6',
    'Hudson River near Turkey Point',
    'main',
    [-73.9392, 42.0142],
  ],
  ['01372043', 'PKMN6', 'Hudson River near Poughkeepsie', 'main'],
  ['01376269', 'PMTN6', 'Hudson River at Piermont', 'main'],
  ['01357500', 'COHN6', 'Mohawk River at Cohoes', 'trib'],
  ['01361000', 'RSSN6', 'Kinderhook Creek at Rossman', 'trib'],
  ['01362500', 'MTRN6', 'Esopus Creek at Coldbrook', 'trib'],
  ['01364500', 'MRNN6', 'Esopus Creek at Mount Marion', 'trib'],
  ['01367500', 'ROSN6', 'Rondout Creek at Rosendale', 'trib'],
  ['01372007', 'RDTN6', 'Rondout Creek at Rondout (Kingston)', 'trib'],
  ['01371500', 'GRDN6', 'Wallkill River at Gardiner', 'trib'],
  ['01372500', 'WAPN6', 'Wappinger Creek near Wappingers Falls', 'trib'],
  ['01375000', null, 'Croton River at New Croton Dam', 'trib'],
]
const out = { gauges: [], tides: [], hudsonLine: { stops, shape } }
for (const [usgs, nws, name, kind, coord] of gauges) {
  const g = { usgs, nws, name, kind, coord, flood: null }
  if (nws) {
    const r = await (
      await fetch(`https://api.water.noaa.gov/nwps/v1/gauges/${nws}`)
    ).json()
    g.coord ??= [+r.longitude.toFixed(5), +r.latitude.toFixed(5)]
    const c = r.flood?.categories ?? {}
    const f = Object.fromEntries(
      Object.entries(c)
        .filter(([, v]) => v.stage > -999)
        .map(([k2, v]) => [k2, v.stage])
    )
    if (Object.keys(f).length) g.flood = f
  }
  if (!g.coord) {
    const r = await (
      await fetch(
        `https://api.waterdata.usgs.gov/ogcapi/v0/collections/monitoring-locations/items/USGS-${usgs}?f=json`
      )
    ).json()
    g.coord = r.geometry.coordinates.map((x) => +x.toFixed(5))
  }
  out.gauges.push(g)
}
// CO-OPS: `live` stations report observed water level; all have hi/lo predictions
const tides = [
  ['8518995', 'Albany', [-73.7467, 42.65], false],
  ['8518989', 'Castleton', [-73.7667, 42.5333], false],
  ['8518979', 'Coxsackie', [-73.79486, 42.35264], true],
  ['8518974', 'Hudson', [-73.8, 42.25], false],
  ['8518962', 'Turkey Point', [-73.9392, 42.0139], true],
  ['8518993', 'Kingston', [-73.9833, 41.9183], false],
  ['8518951', 'Hyde Park', [-73.95, 41.7833], false],
  ['8518945', 'Poughkeepsie', [-73.9333, 41.7], false],
  ['8518935', 'Newburgh', [-74.0067, 41.5], false],
  ['8518949', 'Peekskill', [-73.9317, 41.2883], false],
  ['8518924', 'Haverstraw', [-73.9633, 41.2183], false],
  ['8518919', 'Tarrytown', [-73.87, 41.0783], false],
  ['8518750', 'The Battery', [-74.01417, 40.70055], true],
]
out.tides = tides.map(([id, name, coord, live]) => ({ id, name, coord, live }))
writeFileSync(process.argv[3], JSON.stringify(out, null, 1) + '\n')
console.log(
  pts.length,
  '->',
  shape.length,
  'shape pts;',
  Object.keys(stops).length,
  'stops'
)
