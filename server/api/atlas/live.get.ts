/**
 * @file live.get.ts
 * @description Live Hudson layer for the Valley Atlas (/atlas): river gauges,
 * tides, and Metro-North Hudson Line trains, as display-ready GeoJSON.
 * @endpoint GET /api/atlas/live
 *
 * Sources (all keyless):
 * - USGS Water Data OGC API (api.waterdata.usgs.gov): stage, discharge, temp.
 *   The legacy waterservices bBox query 503s, and is being retired anyway
 * - NWS NWPS (api.water.noaa.gov): official stage + flood category
 * - NOAA CO-OPS: observed water level + predicted high/low
 * - MTA Metro-North GTFS-realtime: decoded here with a tiny protobuf reader.
 *   Some trains carry a reported position; the rest are placed along the
 *   line by interpolating their realtime stop times, and say so
 *
 * Each source fails on its own: an empty collection plus an `errors` entry.
 */
import stations from '../../../data/atlas/live-stations.json'
import { fetchWithTimeout } from '../../utils/fetch'

type Coord = [number, number]
type Props = Record<string, string | number | boolean | null>
interface Feature {
  type: 'Feature'
  geometry: { type: 'Point'; coordinates: Coord }
  properties: Props
}
const collection = (features: Feature[] = []) => ({
  type: 'FeatureCollection' as const,
  features,
})
const point = (coordinates: Coord, properties: Props): Feature => ({
  type: 'Feature',
  geometry: { type: 'Point', coordinates },
  properties,
})

const getJson = async (url: string, ms = 12000) => {
  const res = await fetchWithTimeout(
    url,
    { headers: { 'User-Agent': 'ejfox.com valley atlas' } },
    ms
  )
  if (!res.ok) throw new Error(`${res.status} from ${new URL(url).host}`)
  return res.json()
}

const clock = (t: number | string | Date) =>
  new Date(t).toLocaleTimeString('en-US', {
    timeZone: 'America/New_York',
    hour: 'numeric',
    minute: '2-digit',
  })

const fmt = (n: number, digits = 1) =>
  n.toLocaleString('en-US', { maximumFractionDigits: digits })

// Change over the last hour → rising / falling / steady (±0.05 ft deadband)
const trendOf = (series: { t: number; v: number }[]) => {
  if (series.length < 2) return null
  const last = series.at(-1)!
  const ref = series.find((s) => s.t >= last.t - 3600e3) ?? series[0]
  if (ref === last) return null
  const d = last.v - ref.v
  return d > 0.05 ? 'rising' : d < -0.05 ? 'falling' : 'steady'
}
const ARROW: Record<string, string> = {
  rising: '↑',
  falling: '↓',
  steady: '→',
}

// ---------------------------------------------------------------- gauges

const USGS = 'https://api.waterdata.usgs.gov/ogcapi/v0/collections'
const FLOOD_LABEL: Record<string, string> = {
  no_flooding: 'below flood stage',
  action: 'action stage',
  minor: 'minor flooding',
  moderate: 'moderate flooding',
  major: 'major flooding',
}
const STALE_MS = 6 * 3600e3

export async function getGauges() {
  const ids = stations.gauges.filter((g) => g.usgs).map((g) => `USGS-${g.usgs}`)
  const [usgs, nwps] = await Promise.allSettled([
    getJson(
      `${USGS}/continuous/items?f=json&limit=10000&skipGeometry=true` +
        `&monitoring_location_id=${ids.join(',')}` +
        '&parameter_code=00065,62620,00060,00010&time=PT3H' +
        '&properties=monitoring_location_id,parameter_code,value,time'
    ),
    getJson(
      'https://api.water.noaa.gov/nwps/v1/gauges?srid=EPSG_4326' +
        '&bbox.xmin=-74.4&bbox.ymin=40.9&bbox.xmax=-73.5&bbox.ymax=42.9'
    ),
  ])
  if (usgs.status === 'rejected' && nwps.status === 'rejected')
    throw usgs.reason

  // site → parameter → time-sorted series
  const series: Record<string, Record<string, { t: number; v: number }[]>> = {}
  if (usgs.status === 'fulfilled') {
    for (const f of usgs.value.features ?? []) {
      const p = f.properties
      const v = Number.parseFloat(p.value)
      if (!Number.isFinite(v)) continue
      const site = p.monitoring_location_id.replace('USGS-', '')
      ;((series[site] ??= {})[p.parameter_code] ??= []).push({
        t: Date.parse(p.time),
        v,
      })
    }
    for (const s of Object.values(series))
      for (const arr of Object.values(s)) arr.sort((a, b) => a.t - b.t)
  }
  const nws: Record<string, any> = {}
  if (nwps.status === 'fulfilled')
    for (const g of nwps.value.gauges ?? []) nws[g.lid] = g.status?.observed

  const now = Date.now()
  const fresh = (arr?: { t: number; v: number }[]) =>
    arr?.length && now - arr.at(-1)!.t < STALE_MS ? arr : undefined

  const features: Feature[] = []
  for (const g of stations.gauges) {
    const s = (g.usgs && series[g.usgs]) || {}
    const gh = fresh(s['00065'])
    const wl = fresh(s['62620'])
    const q = fresh(s['00060'])
    const temp = fresh(s['00010'])
    const obs = g.nws ? nws[g.nws] : null
    const nwsOk =
      obs && obs.primary > -999 && now - Date.parse(obs.validTime) < STALE_MS

    // NWS stage first: it's on the same datum as the flood thresholds
    let stage: number | null = null
    let stageNote = ''
    let time: number | null = null
    if (nwsOk) {
      stage = obs.primary
      stageNote = 'stage (NWS)'
      time = Date.parse(obs.validTime)
    } else if (gh) {
      stage = gh.at(-1)!.v
      stageNote = 'gage height'
      time = gh.at(-1)!.t
    } else if (wl) {
      stage = wl.at(-1)!.v
      stageNote = 'water surface, ft NAVD88'
      time = wl.at(-1)!.t
    }
    if (stage === null && !q) continue
    const readAt = time ?? q!.at(-1)!.t

    const trend = trendOf(gh ?? wl ?? [])
    const flood = g.flood as Record<string, number> | null
    const category = nwsOk ? obs.floodCategory : null
    const flow = q?.at(-1)?.v
    const c = temp?.at(-1)?.v
    const stageText = stage === null ? null : `${fmt(stage, 2)} ft`

    features.push(
      point(g.coord as Coord, {
        id: g.usgs ?? g.nws,
        name: g.name,
        kind: g.kind,
        stage,
        stageText,
        stageNote,
        trend,
        flowText: flow === undefined ? null : `${fmt(flow, 0)} cfs`,
        tempText:
          c === undefined
            ? null
            : `${fmt(c)} °C / ${fmt((c * 9) / 5 + 32, 0)} °F`,
        floodCategory: category,
        floodText: (category && FLOOD_LABEL[category]) || null,
        floodStageText: flood?.minor
          ? `flood stage ${fmt(flood.minor)} ft`
          : null,
        time: new Date(readAt).toISOString(),
        timeText: clock(readAt),
        label:
          (stageText ?? `${fmt(flow!, 0)} cfs`) +
          (trend ? ` ${ARROW[trend]}` : ''),
        url: g.usgs
          ? `https://waterdata.usgs.gov/monitoring-location/USGS-${g.usgs}/`
          : `https://water.noaa.gov/gauges/${g.nws!.toLowerCase()}`,
        floodUrl: g.nws
          ? `https://water.noaa.gov/gauges/${g.nws.toLowerCase()}`
          : null,
      })
    )
  }
  return collection(features)
}

// ----------------------------------------------------------------- tides

const COOPS =
  'https://api.tidesandcurrents.noaa.gov/api/prod/datagetter' +
  '?application=ejfox_valley_atlas&datum=MLLW&units=english&time_zone=gmt&format=json'
const coopsTime = (t: string) => Date.parse(`${t.replace(' ', 'T')}:00Z`)
const ymdhm = (d: Date) =>
  d.toISOString().slice(0, 16).replace(/-/g, '').replace('T', ' ')

export async function getTides() {
  const begin = encodeURIComponent(ymdhm(new Date(Date.now() - 3600e3)))
  const results = await Promise.allSettled(
    stations.tides.map(async (st) => {
      const [pred, wl] = await Promise.all([
        getJson(
          `${COOPS}&station=${st.id}&product=predictions&interval=hilo` +
            `&begin_date=${begin}&range=36`
        ),
        st.live
          ? getJson(
              `${COOPS}&station=${st.id}&product=water_level&range=1`
            ).catch(() => null)
          : null,
      ])
      const now = Date.now()
      const next = (pred.predictions ?? [])
        .map((p: any) => ({ t: coopsTime(p.t), v: +p.v, type: p.type }))
        .filter((p: any) => p.t > now)
        .slice(0, 2)
      const obs = (wl?.data ?? [])
        .map((d: any) => ({ t: coopsTime(d.t), v: Number.parseFloat(d.v) }))
        .filter((d: any) => Number.isFinite(d.v))
      const latest = obs.at(-1)
      const trend = trendOf(obs)
      // Without an observation, the next turn tells you which way it's going
      const tideDir =
        trend ??
        (next[0] ? (next[0].type === 'H' ? 'rising' : 'falling') : null)
      const nextText = next
        .map(
          (p: any) =>
            `${p.type === 'H' ? 'high' : 'low'} ${clock(p.t)} (${fmt(p.v)} ft)`
        )
        .join(', ')
      return point(st.coord as Coord, {
        id: st.id,
        name: st.name,
        live: Boolean(latest),
        levelText: latest ? `${fmt(latest.v, 2)} ft MLLW` : null,
        trend: tideDir,
        nextText: nextText || null,
        nextHigh: next.find((p: any) => p.type === 'H')
          ? new Date(next.find((p: any) => p.type === 'H').t).toISOString()
          : null,
        nextLow: next.find((p: any) => p.type === 'L')
          ? new Date(next.find((p: any) => p.type === 'L').t).toISOString()
          : null,
        time: latest ? new Date(latest.t).toISOString() : null,
        timeText: latest ? clock(latest.t) : null,
        label: latest
          ? `${fmt(latest.v, 1)} ft${tideDir ? ` ${ARROW[tideDir]}` : ''}`
          : next[0]
            ? `${next[0].type === 'H' ? 'high' : 'low'} ${clock(next[0].t)}`
            : st.name,
        url: `https://tidesandcurrents.noaa.gov/stationhome.html?id=${st.id}`,
      })
    })
  )
  const features = results.flatMap((r) =>
    r.status === 'fulfilled' ? [r.value] : []
  )
  if (!features.length && results[0]?.status === 'rejected')
    throw results[0].reason
  return collection(features)
}

// ---------------------------------------------------------------- trains

// Minimal protobuf reader: field number → list of raw values. Enough for
// GTFS-realtime without a dependency (wire types 0, 1, 2, 5)
type PbValue = bigint | number | Uint8Array
const pb = (buf: Uint8Array) => {
  const out: Record<number, PbValue[]> = {}
  let i = 0
  const varint = () => {
    let r = 0n
    let shift = 0n
    let b: number
    do {
      b = buf[i++]
      r |= BigInt(b & 0x7f) << shift
      shift += 7n
    } while (b & 0x80 && i < buf.length)
    return r
  }
  const view = new DataView(buf.buffer, buf.byteOffset, buf.byteLength)
  while (i < buf.length) {
    const key = Number(varint())
    const wire = key & 7
    let v: PbValue
    if (wire === 0) v = varint()
    else if (wire === 1) {
      v = view.getFloat64(i, true)
      i += 8
    } else if (wire === 2) {
      const n = Number(varint())
      v = buf.subarray(i, i + n)
      i += n
    } else if (wire === 5) {
      v = view.getFloat32(i, true)
      i += 4
    } else throw new Error(`unsupported protobuf wire type ${wire}`)
    ;(out[key >>> 3] ??= []).push(v)
  }
  return out
}
const td = new TextDecoder()
const msgAt = (m: Record<number, PbValue[]>, f: number) =>
  m[f]?.[0] instanceof Uint8Array ? pb(m[f][0] as Uint8Array) : null
const strAt = (m: Record<number, PbValue[]> | null, f: number) =>
  m?.[f]?.[0] instanceof Uint8Array ? td.decode(m[f][0] as Uint8Array) : null
const numAt = (m: Record<number, PbValue[]> | null, f: number) => {
  const v = m?.[f]?.[0]
  return typeof v === 'bigint'
    ? Number(BigInt.asIntN(64, v))
    : typeof v === 'number'
      ? v
      : null
}

// Hudson Line geometry: the GTFS shape, with each stop pinned to its
// distance along it, so estimated trains ride the rails, not the river
const line = stations.hudsonLine
const M_PER_DEG_LAT = 110540
const M_PER_DEG_LON = 111320 * Math.cos((41.2 * Math.PI) / 180)
const xy = (c: number[]) => [c[0] * M_PER_DEG_LON, c[1] * M_PER_DEG_LAT]
const cum = [0]
for (let i = 1; i < line.shape.length; i++) {
  const [ax, ay] = xy(line.shape[i - 1])
  const [bx, by] = xy(line.shape[i])
  cum.push(cum[i - 1] + Math.hypot(bx - ax, by - ay))
}
const project = (c: number[]) => {
  const [px, py] = xy(c)
  let best = Infinity
  let at = 0
  for (let i = 1; i < line.shape.length; i++) {
    const [ax, ay] = xy(line.shape[i - 1])
    const [bx, by] = xy(line.shape[i])
    const dx = bx - ax
    const dy = by - ay
    const len = dx * dx + dy * dy
    const t = len
      ? Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / len))
      : 0
    const d = Math.hypot(px - ax - t * dx, py - ay - t * dy)
    if (d < best) {
      best = d
      at = cum[i - 1] + t * Math.sqrt(len)
    }
  }
  return at
}
const stopAt: Record<string, number> = Object.fromEntries(
  Object.entries(line.stops).map(([id, s]) => [id, project(s.coord)])
)
const pointAt = (d: number): Coord => {
  const i = cum.findIndex((c) => c >= d)
  if (i <= 0) return line.shape[i === 0 ? 0 : line.shape.length - 1] as Coord
  const t = (d - cum[i - 1]) / (cum[i] - cum[i - 1] || 1)
  const a = line.shape[i - 1]
  const b = line.shape[i]
  return [
    +(a[0] + (b[0] - a[0]) * t).toFixed(5),
    +(a[1] + (b[1] - a[1]) * t).toFixed(5),
  ]
}

const MNR_FEED =
  'https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/mnr%2Fgtfs-mnr'
const HUDSON_ROUTE = '1'

export async function getTrains() {
  const res = await fetchWithTimeout(MNR_FEED, {}, 12000)
  if (!res.ok) throw new Error(`${res.status} from MTA`)
  const feed = pb(new Uint8Array(await res.arrayBuffer()))
  const now = Date.now() / 1000
  const features: Feature[] = []

  for (const raw of feed[2] ?? []) {
    const ent = pb(raw as Uint8Array)
    const tu = msgAt(ent, 3)
    if (!tu) continue
    const trip = msgAt(tu, 1)
    if (strAt(trip, 5) !== HUDSON_ROUTE) continue
    const vp = msgAt(ent, 4)

    const stus = (tu[2] ?? [])
      .map((s) => {
        const st = pb(s as Uint8Array)
        const arr = msgAt(st, 2)
        const dep = msgAt(st, 3)
        const ext = msgAt(st, 1005)
        const a = numAt(arr, 2) ?? numAt(dep, 2)
        return {
          stop: strAt(st, 4) ?? '',
          arr: a,
          dep: numAt(dep, 2) ?? a,
          delay: numAt(arr, 1) ?? numAt(dep, 1) ?? 0,
          track: strAt(ext, 1),
          status: strAt(ext, 2),
        }
      })
      .filter((s) => s.arr !== null && s.stop in stopAt)
    if (stus.length < 2) continue
    // Only trains actually on the line right now
    if (now < stus[0].dep! - 60 || now > stus.at(-1)!.arr! + 120) continue

    const train =
      strAt(msgAt(vp ?? {}, 8), 2) ?? strAt(msgAt(tu, 3), 2) ?? strAt(trip, 1)
    const north = stopAt[stus.at(-1)!.stop] > stopAt[stus[0].stop]
    const nextIdx = stus.findIndex((s) => s.dep! > now)
    const next = stus[Math.max(0, nextIdx)]
    const prev = nextIdx > 0 ? stus[nextIdx - 1] : null

    let coord: Coord
    let estimated = true
    const pos = msgAt(vp ?? {}, 2)
    const lat = numAt(pos, 1)
    const lon = numAt(pos, 2)
    if (lat && lon) {
      coord = [+lon.toFixed(5), +lat.toFixed(5)]
      estimated = false
    } else if (!prev || now >= next.arr!) {
      // Dwelling at (or not yet left) a station
      coord = line.stops[next.stop as keyof typeof line.stops].coord as Coord
    } else {
      const t = (now - prev.dep!) / (next.arr! - prev.dep! || 1)
      const a = stopAt[prev.stop]
      const b = stopAt[next.stop]
      coord = pointAt(a + (b - a) * Math.max(0, Math.min(1, t)))
    }

    const stopName = (id: string) =>
      line.stops[id as keyof typeof line.stops]?.name ?? id
    const late = Math.round(next.delay / 60)
    const headsign = stopName(stus.at(-1)!.stop)
    features.push(
      point(coord, {
        id: strAt(trip, 1),
        train,
        headsign,
        direction: north ? 'north' : 'south',
        estimated,
        positionNote: estimated
          ? 'position estimated from realtime stop times'
          : 'reported position (MTA)',
        prevStop: prev ? stopName(prev.stop) : null,
        nextStop: stopName(next.stop),
        nextText: `${stopName(next.stop)} ${clock(next.arr! * 1000)}${
          next.track ? `, track ${next.track}` : ''
        }`,
        status:
          late > 0
            ? `${late} min late`
            : next.status && next.status !== 'On-Time'
              ? next.status
              : 'on time',
        label: `${train} ${north ? '↑' : '↓'}`,
        time: new Date(now * 1000).toISOString(),
        url: 'https://new.mta.info/agency/metro-north',
      })
    )
  }
  return collection(features)
}

// --------------------------------------------------------------- handler

// Per-source memo, so slow-moving water data isn't refetched every time the
// whole response (cached 30s for the trains) expires. Failures aren't kept
const memo = <T>(fn: () => Promise<T>, maxAgeMs: number) => {
  let at = 0
  let value: Promise<T> | null = null
  return () => {
    if (!value || Date.now() - at > maxAgeMs) {
      at = Date.now()
      value = fn().catch((e) => {
        value = null
        throw e
      })
    }
    return value
  }
}
const gauges = memo(getGauges, 5 * 60e3)
const tides = memo(getTides, 5 * 60e3)
const trains = memo(getTrains, 30e3)

export default defineCachedEventHandler(
  async () => {
    const sources = { gauges, tides, trains }
    const keys = Object.keys(sources) as (keyof typeof sources)[]
    const settled = await Promise.allSettled(keys.map((k) => sources[k]()))
    const errors: Record<string, string> = {}
    const out: Record<string, ReturnType<typeof collection>> = {}
    settled.forEach((r, i) => {
      if (r.status === 'fulfilled') out[keys[i]] = r.value
      else {
        out[keys[i]] = collection()
        errors[keys[i]] =
          r.reason instanceof Error ? r.reason.message : String(r.reason)
      }
    })
    return {
      ...out,
      fetched: new Date().toISOString(),
      ...(Object.keys(errors).length ? { errors } : {}),
    }
  },
  { name: 'atlas-live', maxAge: 30, swr: true }
)
