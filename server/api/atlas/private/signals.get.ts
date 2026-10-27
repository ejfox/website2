/**
 * @file atlas/private/signals.get.ts
 * @description GET /api/atlas/private/signals. PRIVATE Valley Atlas layer: the
 *   last 7 days of geolocated signals from EJ's anomalywatch smallweb app:
 *   { signals: FeatureCollection, excluded, fetched }. 404 unless the atlas is
 *   unlocked (server/utils/atlasPrivate.ts). Upstream memoized in-process 5 min.
 *   Throws 502 if anomalywatch fails or ATLAS_HOME_EXCLUDE is unset.
 *
 * Minimized: only title, a short plain-text summary, source, type, time and
 * an http(s) link leave the server. raw_data (which can hold names and
 * addresses from public records), entity ids and scoring rationale stay.
 *
 * Home-area exclusion: any signal within HOME_RADIUS_KM of a point in the
 * ATLAS_HOME_EXCLUDE env var ("lat,lon;lat,lon"), or whose text mentions
 * EJ's neighborhood (env ATLAS_HOME_TERMS) / home / location tracking, is
 * dropped. The points live in env, not here, because this repo is public.
 * Without them the route fails closed and returns nothing.
 *
 * Not defineCachedEventHandler: a cached handler can answer without running
 * requireAtlasPrivate. The upstream fetch is memoized in-process instead.
 */
import { requireAtlasPrivate } from '~/server/utils/atlasPrivate'
import { serverEnv } from '~/server/utils/serverEnv'
import { fetchSmallweb } from '~/server/utils/smallweb'

interface Signal {
  id: string
  source: string
  signal_type: string | null
  timestamp: string
  latitude: number | null
  longitude: number | null
  title: string | null
  details: string | null
  raw_data: string | null
}

// ── Home-area exclusion ──────────────────────────────────
const DAY = 864e5
const CACHE_MS = 5 * 60e3
const HOME_RADIUS_KM = 2
// Generic words only: the place names that mean "home" live in the
// ATLAS_HOME_TERMS env var (comma-separated), never in this public repo
const HOME_WORDS = [
  '\\bhome\\b',
  'owntracks',
  'user[\\s_-]?location',
  'my location',
]
const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
const homeText = () =>
  new RegExp(
    [
      ...HOME_WORDS,
      ...serverEnv('ATLAS_HOME_TERMS')
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean)
        .map((t) => escapeRe(t).replace(/\s+/g, '\\s*')),
    ].join('|'),
    'i'
  )

export const parseHomes = (env: string): [number, number][] =>
  env
    .split(';')
    .map((p) => p.split(',').map(Number))
    .filter(
      (p): p is [number, number] =>
        p.length === 2 && p.every((n) => Number.isFinite(n))
    )

const km = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const r = Math.PI / 180
  const a =
    Math.sin(((lat2 - lat1) * r) / 2) ** 2 +
    Math.cos(lat1 * r) *
      Math.cos(lat2 * r) *
      Math.sin(((lon2 - lon1) * r) / 2) ** 2
  return 12742 * Math.asin(Math.sqrt(a))
}

// ── Minimizing a signal ──────────────────────────────────
const isHttp = (s: unknown): s is string =>
  typeof s === 'string' && /^https?:\/\/[^\s"'<>]+$/i.test(s)

/** The signal's own link: a known raw_data key, else the first URL in it */
const linkOf = (s: Signal) => {
  let raw: Record<string, unknown> = {}
  try {
    raw = JSON.parse(s.raw_data || '{}') ?? {}
  } catch {
    // Unparseable raw_data: fall back to the details text
  }
  for (const k of ['url', 'article_url', 'filing_url', 'link', 'permalink'])
    if (isHttp(raw[k])) return raw[k] as string
  const m = (s.details ?? '').match(/https?:\/\/[^\s"'<>)\]|]+/)
  return m && isHttp(m[0]) ? m[0] : null
}

/** First few plain lines of the markdown details, no URLs, ≤ 240 chars */
const summaryOf = (details: string | null) => {
  const text = (details ?? '')
    .split('\n')
    .map((l) => l.trim())
    .filter(
      (l) =>
        l &&
        !l.startsWith('#') &&
        !/^(?:entity context|raw|history|track):/i.test(l)
    )
    .slice(0, 3)
    .join(' ')
    .replace(/https?:\/\/\S+/g, '')
    .replace(/[*`]+/g, '')
    .replace(/\s+/g, ' ')
    .trim()
  return text.length > 240 ? `${text.slice(0, 239)}…` : text || null
}

export function signalsToGeojson(
  signals: Signal[],
  homes: [number, number][],
  now = Date.now()
) {
  const since = now - 7 * DAY
  let excluded = 0
  const features = []
  for (const s of signals) {
    const lat = Number(s.latitude)
    const lon = Number(s.longitude)
    if (s.latitude === null || s.longitude === null) continue
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) continue
    const t = Date.parse(s.timestamp)
    if (!(t >= since)) continue
    if (
      homes.some(([hl, ho]) => km(hl, ho, lat, lon) < HOME_RADIUS_KM) ||
      homeText().test(`${s.title} ${s.details} ${s.raw_data}`)
    ) {
      excluded++
      continue
    }
    features.push({
      type: 'Feature' as const,
      geometry: {
        type: 'Point' as const,
        coordinates: [+lon.toFixed(5), +lat.toFixed(5)],
      },
      properties: {
        source: s.source,
        type: s.signal_type,
        title: (s.title ?? '').slice(0, 200) || s.source,
        summary: summaryOf(s.details),
        time: new Date(t).toISOString(),
        url: linkOf(s),
      },
    })
  }
  return {
    collection: { type: 'FeatureCollection' as const, features },
    excluded,
  }
}

// ── Loading + handler ────────────────────────────────────
async function load() {
  const homes = parseHomes(serverEnv('ATLAS_HOME_EXCLUDE'))
  // Fail closed: no home reference, no signals
  if (!homes.length) throw new Error('ATLAS_HOME_EXCLUDE is not set')
  const now = Date.now()
  const since = new Date(now - 7 * DAY).toISOString()
  const { signals } = await fetchSmallweb<{ signals: Signal[] }>(
    'anomalywatch',
    `/api/signals?since=${encodeURIComponent(since)}&limit=20000`,
    20000
  )
  const { collection, excluded } = signalsToGeojson(signals ?? [], homes, now)
  return {
    signals: collection,
    excluded,
    fetched: new Date(now).toISOString(),
  }
}

let cached: {
  at: number
  value: Promise<Awaited<ReturnType<typeof load>>>
} | null = null

export default defineEventHandler(async (event) => {
  // Must run first, before any cache read: the gate is the whole point.
  requireAtlasPrivate(event)
  if (!cached || Date.now() - cached.at > CACHE_MS) {
    const value = load()
    cached = { at: Date.now(), value }
    // Don't memoize a failure; the next request retries.
    value.catch(() => {
      cached = null
    })
  }
  try {
    return await cached.value
  } catch (err) {
    throw createError({
      statusCode: 502,
      statusMessage: err instanceof Error ? err.message : 'anomalywatch failed',
    })
  }
})
