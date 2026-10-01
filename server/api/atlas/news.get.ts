/**
 * @file news.get.ts
 * @description Local news by town for the Valley Atlas (/atlas): the last two
 * weeks of countywatch headlines, grouped by the town they were geocoded to.
 * @endpoint GET /api/atlas/news
 *
 * Source: countywatch.tools.ejfox.com/api/news/geo, which pins each item to a
 * town or county centroid and says why (`geo_reason`, e.g. `hv:kingston`).
 * Only whitelisted fields leave this route. Stale data is served on failure.
 */
import { fetchSmallweb } from '~/server/utils/smallweb'

const DAYS = 14
const HEADLINES = 5
const CACHE_MS = 15 * 60e3
const BOUNDS = { west: -75.6, east: -72.6, south: 40.7, north: 42.9 }
// Places countywatch knows that are a whole county or region, not a town
const REGIONS = new Set(['westchester', 'rockland', 'putnam', 'catskills'])

interface Item {
  source?: unknown
  title?: unknown
  url?: unknown
  date?: unknown
  latitude?: unknown
  longitude?: unknown
  geo_reason?: unknown
}

const ENTITIES: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
  hellip: '…',
  mdash: '—',
  ndash: '–',
  lsquo: '‘',
  rsquo: '’',
  ldquo: '“',
  rdquo: '”',
}

// Feeds arrive HTML-escaped; decode to plain text (the client escapes again)
const plain = (s: unknown, max = 200) =>
  String(s ?? '')
    .replace(/<[^>]*>/g, '')
    .replace(/&(#x[\da-f]+|#\d+|[a-z]+);/gi, (m, e: string) => {
      if (e[0] !== '#') return ENTITIES[e.toLowerCase()] ?? m
      const code = e[1] === 'x' ? Number.parseInt(e.slice(2), 16) : +e.slice(1)
      return code > 0 && code < 0x110000 ? String.fromCodePoint(code) : ''
    })
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max)

const httpUrl = (u: unknown) => {
  try {
    const url = new URL(String(u))
    return /^https?:$/.test(url.protocol) ? url.href : null
  } catch {
    return null
  }
}

const titleCase = (s: string) => s.replace(/\b\w/g, (c) => c.toUpperCase())

export function newsByTown(items: Item[], now = Date.now()) {
  const since = new Date(now - DAYS * 86400e3).toISOString().slice(0, 10)
  const towns = new Map<
    string,
    {
      coord: [number, number]
      kind: string
      headlines: { title: string; source: string; date: string; url: string }[]
    }
  >()

  for (const it of items) {
    const reason = String(it.geo_reason ?? '').replace(/^hv:/, '')
    // countywatch's gazetteer hits are lowercase; capitalised reasons are
    // free-text geocoder guesses ("Park Avenue" → the Bronx), so skip them
    if (!reason || reason !== reason.toLowerCase()) continue
    const lon = Number(it.longitude)
    const lat = Number(it.latitude)
    if (
      !(lon >= BOUNDS.west && lon <= BOUNDS.east) ||
      !(lat >= BOUNDS.south && lat <= BOUNDS.north)
    )
      continue
    const date = String(it.date ?? '').slice(0, 10)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || date < since) continue
    const url = httpUrl(it.url)
    const title = plain(it.title)
    if (!url || !title) continue

    const name = titleCase(reason)
    const town = towns.get(name) ?? {
      coord: [+lon.toFixed(4), +lat.toFixed(4)] as [number, number],
      kind:
        reason.endsWith(' county') || REGIONS.has(reason) ? 'county' : 'town',
      headlines: [],
    }
    town.headlines.push({ title, source: plain(it.source, 60), date, url })
    towns.set(name, town)
  }

  const features = [...towns].map(([name, t]) => {
    const recent = t.headlines.sort((a, b) => b.date.localeCompare(a.date))
    return {
      type: 'Feature' as const,
      geometry: { type: 'Point' as const, coordinates: t.coord },
      properties: {
        name,
        kind: t.kind,
        count: recent.length,
        label: `${name} ${recent.length}`,
        latest: recent[0].date,
        headlines: recent.slice(0, HEADLINES),
      },
    }
  })
  features.sort((a, b) => b.properties.count - a.properties.count)
  return { type: 'FeatureCollection' as const, features }
}

let last: { at: number; data: ReturnType<typeof newsByTown> } | null = null

export default defineCachedEventHandler(
  async () => {
    if (!last || Date.now() - last.at > CACHE_MS) {
      try {
        const res = await fetchSmallweb<{ news?: Item[] }>(
          'countywatch',
          `/api/news/geo?days=${DAYS}&limit=200&exclude_generic=true`,
          15000
        )
        last = { at: Date.now(), data: newsByTown(res.news ?? []) }
      } catch (e) {
        const error = e instanceof Error ? e.message : String(e)
        return {
          ...(last?.data ?? newsByTown([])),
          days: DAYS,
          fetched: last ? new Date(last.at).toISOString() : null,
          error,
        }
      }
    }
    return {
      ...last.data,
      days: DAYS,
      fetched: new Date(last.at).toISOString(),
    }
  },
  { name: 'atlas-news', maxAge: 5 * 60, swr: true }
)
