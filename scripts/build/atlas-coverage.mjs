#!/usr/bin/env node
/**
 * Valley Atlas: terrain line-of-sight coverage for the valley's emergency
 * (ARES/RACES + SKYWARN primary) repeaters.
 *
 * For each repeater: a radial sweep over AWS Terrarium elevation (z11, ~57 m/px)
 * from the antenna (site ground + mast) with 4/3-earth curvature. Two tiers:
 * "handheld" = clear line of sight to a radio 2 m off the ground, "base" = clear
 * to an antenna 10 m up (base station or mobile mast); handheld ⊂ base. Writes
 * transparent palette PNGs in Web Mercator (for a MapLibre `image` source) +
 * coverage.json to public/atlas/coverage/.
 *
 * Only repeaters whose antenna site a source actually names are modeled; ones
 * we only have town-center coordinates for are listed under `excluded`, since a
 * valley-floor guess at a hilltop antenna draws a confidently wrong map.
 *
 * Run by hand: `node scripts/build/atlas-coverage.mjs`. Tiles are cached in the
 * OS temp dir; the output is deterministic for a given set of tiles.
 *
 * This is terrain line-of-sight, not RF propagation.
 */
import { readFile, writeFile, mkdir, stat, readdir, rm } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { resolve, join } from 'node:path'
import { tmpdir } from 'node:os'
import { inflateSync, deflateSync, crc32 } from 'node:zlib'

const CSV = resolve(process.cwd(), 'data/atlas/repeaters.csv')
const OUT = resolve(process.cwd(), 'public/atlas/coverage')
const CACHE = join(tmpdir(), 'atlas-terrarium')
const TILE_URL = 'https://s3.amazonaws.com/elevation-tiles-prod/terrarium'

// Same as the map's maxBounds
const BOUNDS = { west: -75.6, south: 40.7, east: -72.6, north: 42.9 }
const Z = 11
const OUT_WIDTH = 1400

const MAST_M = 30 // default when the club doesn't publish antenna height
const RX_HANDHELD_M = 2
const RX_BASE_M = 10
const K = 4 / 3
const EARTH_R = 6371000
const RE = K * EARTH_R
const MAX_RANGE_M = 80000
const STEP_M = 60 // ≈ one DEM cell
const RADIALS = 2880 // 0.125°: arc spacing at 80 km ≈ 175 m, under one output cell

// ARES/RACES + SKYWARN primaries (per the CSV notes), keyed by freq + location.
// `site` overrides the CSV's approximate coords where a source names the site.
const PICKS = [
  { freq: '146.970', loc: 'Mt. Beacon' },
  { freq: '147.045', loc: 'Illinois Mountain, Highland' },
  {
    freq: '146.805',
    loc: 'Woodstock',
    site: {
      lat: 42.0765,
      lon: -74.1072,
      note: 'Overlook Mountain (RepeaterBook site + coords)',
      sources: [
        'https://www.repeaterbook.com/repeaters/details.php?state_id=36&ID=11855',
      ],
    },
  },
  { freq: '147.105', loc: 'Schunnemunk Mountain' },
  { freq: '145.130', loc: 'Mt. Ninham, Carmel' },
  {
    freq: '147.060',
    loc: 'Valhalla',
    site: {
      lat: 41.080464,
      lon: -73.778207,
      note: 'Westchester County radio tower, Valhalla; antenna 470 ft AGL per WECA, coords per artscipub',
      sources: [
        'https://www.weca.org/facilities/repeatertones',
        'http://www.artscipub.com/repeaters/detail.asp?rid=26199',
      ],
    },
    mastM: Math.round(470 * 0.3048),
  },
]

const UNKNOWN = 'site unknown: town-center coordinates only'
const EXCLUDED = [
  {
    freq: '146.895',
    loc: 'Millbrook',
    reason: UNKNOWN,
    detail:
      'Club page lists "Millbrook" only; RepeaterBook marks its coords approximate',
  },
  {
    freq: '147.165',
    loc: 'Orangetown',
    reason: UNKNOWN,
    detail:
      'No named tower or peak in RepeaterBook, artscipub (Nyack) or ENY ARES pages',
  },
  {
    freq: '147.150',
    loc: 'Hudson',
    reason: UNKNOWN,
    detail:
      'Greene ARES primary; RepeaterBook says East Windham but coordinates not known',
  },
  {
    freq: '147.210',
    loc: 'Martindale',
    reason: UNKNOWN,
    detail:
      'Columbia ARES primary; Martindale vs Hudson conflict, no named site',
  },
]

const COLORS = {
  coverage: [0x6e, 0xed, 0xf7], // vulpes teal
  beacon: [0xe6, 0x00, 0x67], // vulpes magenta
}
// alpha per tier: 0 none, 1 base (10 m), 2 handheld (2 m)
const TIER_ALPHA = [0, 100, 220]

// --- CSV ---------------------------------------------------------------------

const parseCsv = (text) => {
  const rows = []
  let row = []
  let field = ''
  let q = false
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (q) {
      if (c === '"' && text[i + 1] === '"') ((field += '"'), i++)
      else if (c === '"') q = false
      else field += c
    } else if (c === '"') q = true
    else if (c === ',') (row.push(field), (field = ''))
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++
      ;(row.push(field), rows.push(row), (row = []), (field = ''))
    } else field += c
  }
  if (field || row.length) (row.push(field), rows.push(row))
  const [head, ...body] = rows.filter((r) => r.length > 1)
  return body.map((r) =>
    Object.fromEntries(head.map((h, i) => [h, r[i] ?? '']))
  )
}

// --- PNG (8-bit RGB/RGBA decode, palette encode) --------------------------------

const decodePng = (buf) => {
  let pos = 8
  let width, height, colorType
  const idat = []
  while (pos < buf.length) {
    const len = buf.readUInt32BE(pos)
    const type = buf.toString('ascii', pos + 4, pos + 8)
    const data = buf.subarray(pos + 8, pos + 8 + len)
    if (type === 'IHDR') {
      width = data.readUInt32BE(0)
      height = data.readUInt32BE(4)
      colorType = data[9]
      if (
        data[8] !== 8 ||
        data[12] !== 0 ||
        (colorType !== 2 && colorType !== 6)
      )
        throw new Error(`unsupported PNG (depth ${data[8]}, type ${colorType})`)
    } else if (type === 'IDAT') idat.push(data)
    else if (type === 'IEND') break
    pos += 12 + len
  }
  const bpp = colorType === 6 ? 4 : 3
  const stride = width * bpp
  const raw = inflateSync(Buffer.concat(idat))
  const px = Buffer.alloc(stride * height)
  for (let y = 0; y < height; y++) {
    const f = raw[y * (stride + 1)]
    const src = y * (stride + 1) + 1
    const dst = y * stride
    for (let x = 0; x < stride; x++) {
      const a = x >= bpp ? px[dst + x - bpp] : 0
      const b = y > 0 ? px[dst + x - stride] : 0
      const c = x >= bpp && y > 0 ? px[dst + x - stride - bpp] : 0
      let p = raw[src + x]
      if (f === 1) p += a
      else if (f === 2) p += b
      else if (f === 3) p += (a + b) >> 1
      else if (f === 4) {
        const pa = Math.abs(b - c)
        const pb = Math.abs(a - c)
        const pc = Math.abs(a + b - 2 * c)
        p += pa <= pb && pa <= pc ? a : pb <= pc ? b : c
      }
      px[dst + x] = p & 255
    }
  }
  return { width, height, bpp, px }
}

const chunk = (type, data) => {
  const out = Buffer.alloc(12 + data.length)
  out.writeUInt32BE(data.length, 0)
  out.write(type, 4, 'ascii')
  data.copy(out, 8)
  out.writeUInt32BE(crc32(out.subarray(4, 8 + data.length)), 8 + data.length)
  return out
}

// Indexed PNG: index = tier, one hue with per-tier alpha
const encodeTierPng = (tiers, w, h, rgb) => {
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(w, 0)
  ihdr.writeUInt32BE(h, 4)
  ihdr[8] = 8
  ihdr[9] = 3
  const plte = Buffer.from(TIER_ALPHA.flatMap(() => rgb))
  const trns = Buffer.from(TIER_ALPHA)
  const raw = Buffer.alloc((w + 1) * h)
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) raw[y * (w + 1) + 1 + x] = tiers[y * w + x]
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('PLTE', plte),
    chunk('tRNS', trns),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

// --- Web Mercator, global pixel coords at zoom Z ---------------------------------

const WORLD = 256 * 2 ** Z
const lonToX = (lon) => ((lon + 180) / 360) * WORLD
const latToY = (lat) => {
  const r = (lat * Math.PI) / 180
  return ((1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2) * WORLD
}
const xToLon = (x) => (x / WORLD) * 360 - 180
const yToLat = (y) =>
  (Math.atan(Math.sinh(Math.PI * (1 - (2 * y) / WORLD))) * 180) / Math.PI

// --- Terrain mosaic --------------------------------------------------------------

const tx0 = Math.floor(lonToX(BOUNDS.west) / 256)
const tx1 = Math.floor(lonToX(BOUNDS.east) / 256)
const ty0 = Math.floor(latToY(BOUNDS.north) / 256)
const ty1 = Math.floor(latToY(BOUNDS.south) / 256)
const MW = (tx1 - tx0 + 1) * 256
const MH = (ty1 - ty0 + 1) * 256
const OX = tx0 * 256
const OY = ty0 * 256

const getTile = async (x, y) => {
  const file = join(CACHE, `${Z}-${x}-${y}.png`)
  if (existsSync(file) && (await stat(file)).size > 0) return readFile(file)
  for (let attempt = 0; ; attempt++) {
    try {
      const res = await fetch(`${TILE_URL}/${Z}/${x}/${y}.png`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const buf = Buffer.from(await res.arrayBuffer())
      await writeFile(file, buf)
      return buf
    } catch (e) {
      if (attempt >= 3) throw new Error(`tile ${Z}/${x}/${y}: ${e.message}`)
    }
  }
}

const loadMosaic = async () => {
  await mkdir(CACHE, { recursive: true })
  const elev = new Float32Array(MW * MH)
  const jobs = []
  for (let ty = ty0; ty <= ty1; ty++)
    for (let tx = tx0; tx <= tx1; tx++) jobs.push([tx, ty])
  let done = 0
  const worker = async () => {
    while (jobs.length) {
      const [tx, ty] = jobs.shift()
      const { width, bpp, px } = decodePng(await getTile(tx, ty))
      const bx = (tx - tx0) * 256
      const by = (ty - ty0) * 256
      for (let y = 0; y < 256; y++) {
        for (let x = 0; x < 256; x++) {
          const i = (y * width + x) * bpp
          // Terrarium carries bathymetry; the tidal Hudson's surface is ~sea level
          elev[(by + y) * MW + bx + x] = Math.max(
            0,
            px[i] * 256 + px[i + 1] + px[i + 2] / 256 - 32768
          )
        }
      }
      if (++done % 50 === 0) process.stdout.write(`  ${done} tiles\r`)
    }
  }
  await Promise.all(Array.from({ length: 8 }, worker))
  console.log(`terrain: ${done} tiles, ${MW}×${MH} px`)
  return elev
}

// Bilinear elevation at a lon/lat; NaN off the mosaic
const sampler = (elev) => (lon, lat) => {
  const x = lonToX(lon) - OX - 0.5
  const y = latToY(lat) - OY - 0.5
  const ix = Math.floor(x)
  const iy = Math.floor(y)
  if (ix < 0 || iy < 0 || ix >= MW - 1 || iy >= MH - 1) return Number.NaN
  const fx = x - ix
  const fy = y - iy
  const i = iy * MW + ix
  const top = elev[i] * (1 - fx) + elev[i + 1] * fx
  const bot = elev[i + MW] * (1 - fx) + elev[i + MW + 1] * fx
  return top * (1 - fy) + bot * fy
}

// --- Viewshed --------------------------------------------------------------------

const NSTEPS = Math.floor(MAX_RANGE_M / STEP_M)
const M_PER_DEG_LAT = 110540

// Per radial: tier at each step (2 handheld, 1 base only, 0 neither)
const sweep = (elevAt, site, mastM) => {
  const mLon = 111320 * Math.cos((site.lat * Math.PI) / 180)
  const ground = elevAt(site.lon, site.lat)
  const hAnt = ground + mastM
  const tiers = new Uint8Array(RADIALS * NSTEPS)
  for (let r = 0; r < RADIALS; r++) {
    const az = (r / RADIALS) * 2 * Math.PI
    const sx = Math.sin(az)
    const cy = Math.cos(az)
    let horizon = -Infinity // steepest terrain slope seen so far from the antenna
    for (let s = 1; s <= NSTEPS; s++) {
      const d = s * STEP_M
      const e = elevAt(
        site.lon + (d * sx) / mLon,
        site.lat + (d * cy) / M_PER_DEG_LAT
      )
      if (Number.isNaN(e)) break
      const rel = e - (d * d) / (2 * RE) - hAnt // curvature-corrected
      if ((rel + RX_HANDHELD_M) / d >= horizon) tiers[r * NSTEPS + s - 1] = 2
      else if ((rel + RX_BASE_M) / d >= horizon) tiers[r * NSTEPS + s - 1] = 1
      if (rel / d > horizon) horizon = rel / d
    }
  }
  return { tiers, ground, hAnt, mLon }
}

// --- Output grid -----------------------------------------------------------------

const X0 = lonToX(BOUNDS.west)
const X1 = lonToX(BOUNDS.east)
const Y0 = latToY(BOUNDS.north)
const Y1 = latToY(BOUNDS.south)
const OW = OUT_WIDTH
const OH = Math.round((OW * (Y1 - Y0)) / (X1 - X0))
const cellLon = new Float64Array(OW)
const cellLat = new Float64Array(OH)
const rowWeight = new Float64Array(OH) // ground area of a mercator cell ∝ cos²(lat)
for (let i = 0; i < OW; i++)
  cellLon[i] = xToLon(X0 + ((i + 0.5) * (X1 - X0)) / OW)
for (let j = 0; j < OH; j++) {
  cellLat[j] = yToLat(Y0 + ((j + 0.5) * (Y1 - Y0)) / OH)
  rowWeight[j] = Math.cos((cellLat[j] * Math.PI) / 180) ** 2
}
const totalWeight = rowWeight.reduce((a, b) => a + b, 0) * OW

const rasterize = (site, { tiers, mLon }) => {
  const out = new Uint8Array(OW * OH)
  for (let j = 0; j < OH; j++) {
    const dy = (cellLat[j] - site.lat) * M_PER_DEG_LAT
    if (Math.abs(dy) > MAX_RANGE_M) continue
    for (let i = 0; i < OW; i++) {
      const dx = (cellLon[i] - site.lon) * mLon
      const d = Math.hypot(dx, dy)
      const s = Math.round(d / STEP_M)
      if (s < 1 || s > NSTEPS) continue
      let az = Math.atan2(dx, dy)
      if (az < 0) az += 2 * Math.PI
      const r = Math.round((az / (2 * Math.PI)) * RADIALS) % RADIALS
      out[j * OW + i] = tiers[r * NSTEPS + s - 1]
    }
  }
  return out
}

const share = (tiers, min) => {
  let w = 0
  for (let j = 0; j < OH; j++)
    for (let i = 0; i < OW; i++) if (tiers[j * OW + i] >= min) w += rowWeight[j]
  return Math.round((w / totalWeight) * 1000) / 10
}

const slug = (s) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

// --- Main ------------------------------------------------------------------------

const rows = parseCsv(await readFile(CSV, 'utf8'))
const findRow = ({ freq, loc }) => {
  const row = rows.find((r) => r.Frequency === freq && r.Location === loc)
  if (!row) throw new Error(`repeater ${freq} @ ${loc} not in CSV`)
  return row
}

const elevAt = sampler(await loadMosaic())
await mkdir(OUT, { recursive: true })
// Clear stale overlays (e.g. a repeater that moved to `excluded`)
for (const f of await readdir(OUT))
  if (f.endsWith('.png')) await rm(join(OUT, f))

const combined = new Uint8Array(OW * OH)
const repeaters = []
for (const pick of PICKS) {
  const row = findRow(pick)
  const t0 = Date.now()
  const site = pick.site
    ? { lat: pick.site.lat, lon: pick.site.lon }
    : { lat: +row.Lat, lon: +row.Lon }
  const mastM = pick.mastM ?? MAST_M
  const sw = sweep(elevAt, site, mastM)
  const tiers = rasterize(site, sw)
  for (let k = 0; k < tiers.length; k++)
    if (tiers[k] > combined[k]) combined[k] = tiers[k]
  const file = `${row.Frequency.replace('.', '')}-${slug(row.Location)}.png`
  const isBeacon = row.Location === 'Mt. Beacon'
  await writeFile(
    join(OUT, file),
    encodeTierPng(tiers, OW, OH, isBeacon ? COLORS.beacon : COLORS.coverage)
  )
  const rec = {
    id: slug(`${row.Frequency} ${row.Location}`),
    name: row.Name,
    location: row.Location,
    freq: row.Frequency,
    duplex: row.Duplex,
    offset: row.Offset,
    tone: row.Tone || null,
    role:
      row.Notes.match(/[^.;]*(primary|SKYWARN)[^.;]*/gi)?.map((s) =>
        s.trim()
      ) ?? [],
    site: {
      ...site,
      basis: pick.site?.note ?? row.Notes.split(/approx:/i)[1]?.trim() ?? null,
      sources: pick.site?.sources ?? [row.Source],
      groundM: Math.round(sw.ground),
      mastM,
      mastKnown: pick.mastM !== undefined,
      antennaM: Math.round(sw.hAnt),
    },
    image: file,
    handheldPct: share(tiers, 2),
    basePct: share(tiers, 1),
  }
  repeaters.push(rec)
  console.log(
    `${rec.freq} ${rec.location}: ground ${rec.site.groundM} m + ${mastM} m mast, handheld ${rec.handheldPct}%, base ${rec.basePct}% (${Date.now() - t0} ms)`
  )
}

await writeFile(
  join(OUT, 'combined.png'),
  encodeTierPng(combined, OW, OH, COLORS.coverage)
)

const excluded = EXCLUDED.map((x) => {
  const row = findRow(x)
  return {
    name: row.Name,
    location: row.Location,
    freq: row.Frequency,
    reason: x.reason,
    detail: x.detail,
  }
})

const meta = {
  generated: new Date().toISOString(),
  caveat:
    'Terrain line-of-sight only, not an RF propagation model: no foliage, buildings, knife-edge diffraction, ducting, real antenna patterns or ERP. Repeater sites are approximate (summit or tower coordinates from public listings), so treat this as a sketch of where terrain gets in the way.',
  assumptions: {
    defaultMastM: MAST_M,
    handheldHeightM: RX_HANDHELD_M,
    baseHeightM: RX_BASE_M,
    kFactor: +K.toFixed(4),
    maxRangeKm: MAX_RANGE_M / 1000,
    stepM: STEP_M,
    radials: RADIALS,
    terrain: `AWS Terrarium z${Z} (~${Math.round(((40075016 * Math.cos((41.8 * Math.PI) / 180)) / WORLD) * 10) / 10} m/px at 41.8°N), bathymetry clamped to sea level`,
    sitesApproximate: true,
  },
  tiers: {
    handheld: `clear 4/3-earth line of sight to a radio ${RX_HANDHELD_M} m off the ground`,
    base: `clear line of sight to an antenna ${RX_BASE_M} m up (base station or mobile mast); includes the handheld area`,
  },
  bounds: BOUNDS,
  // MapLibre image-source corners: TL, TR, BR, BL
  coordinates: [
    [BOUNDS.west, BOUNDS.north],
    [BOUNDS.east, BOUNDS.north],
    [BOUNDS.east, BOUNDS.south],
    [BOUNDS.west, BOUNDS.south],
  ],
  size: [OW, OH],
  combined: {
    image: 'combined.png',
    handheldPct: share(combined, 2),
    basePct: share(combined, 1),
  },
  repeaters,
  excluded,
}
await writeFile(
  join(OUT, 'coverage.json'),
  JSON.stringify(meta, null, 2) + '\n'
)
console.log(
  `combined: handheld ${meta.combined.handheldPct}%, base ${meta.combined.basePct}% → ${OUT}`
)
