// Live Hudson layer: river gauges, tides, and Hudson Line trains from
// /api/atlas/live, refreshed every minute while the map is open
import type {
  GeoJSONSource,
  Map as MaplibreMap,
  SymbolLayerSpecification,
} from 'maplibre-gl'
import { VULPES, type AtlasContext, type AtlasLayerModule } from '../types'

type FC = { type: 'FeatureCollection'; features: any[] }
interface LiveData {
  gauges: FC
  tides: FC
  trains: FC
  fetched: string
  errors?: Record<string, string>
}

const KEYS = ['gauges', 'tides', 'trains'] as const
const REFRESH_MS = 60_000
const FLOODING = ['action', 'minor', 'moderate', 'major']
const empty = (): FC => ({ type: 'FeatureCollection', features: [] })

let timer: ReturnType<typeof setInterval> | null = null

/** Stop the 60s refresh (call when the map is torn down) */
export const stopLive = () => {
  if (timer) clearInterval(timer)
  timer = null
}

const label = (
  source: string,
  color: string,
  offset = 1.3
): SymbolLayerSpecification => ({
  id: `live-${source}-labels`,
  type: 'symbol',
  source: `live-${source}`,
  minzoom: 10,
  layout: {
    'text-field': ['get', 'label'],
    'text-size': 10,
    'text-offset': [0, offset],
    'text-anchor': 'top',
    'text-font': ['Noto Sans Medium'],
  },
  paint: {
    'text-color': color,
    'text-halo-color': VULPES.ground,
    'text-halo-width': 1.2,
  },
})

const popupHtml = (
  key: (typeof KEYS)[number],
  p: Record<string, any>,
  esc: AtlasContext['escapeHtml']
) => {
  const rows: string[] = []
  const row = (s?: string | null) => s && rows.push(esc(s))
  const link = (url: string, text: string) =>
    `<a href="${esc(url)}" target="_blank" rel="noopener">${esc(text)}</a>`

  if (key === 'gauges') {
    row(
      p.stageText &&
        `${p.stageText} ${p.stageNote}${p.trend ? `, ${p.trend}` : ''}`
    )
    row(p.flowText && `flow ${p.flowText}`)
    row(p.tempText && `water ${p.tempText}`)
    row([p.floodText, p.floodStageText].filter(Boolean).join(' · '))
    row(`as of ${p.timeText}`)
    rows.push(
      link(p.url, 'USGS') +
        (p.floodUrl ? ` · ${link(p.floodUrl, 'NWS forecast')}` : '')
    )
  } else if (key === 'tides') {
    row(
      p.live
        ? `${p.levelText}${p.trend ? `, ${p.trend}` : ''} at ${p.timeText}`
        : p.trend && `tide ${p.trend} (predicted)`
    )
    row(p.nextText && `next ${p.nextText}`)
    rows.push(link(p.url, 'NOAA tides'))
  } else {
    row(`to ${p.headsign} · ${p.status}`)
    row(p.nextText && `next ${p.nextText}`)
    row(p.positionNote)
    rows.push(link(p.url, 'Metro-North'))
  }
  const title =
    key === 'trains' ? `Hudson Line train ${p.train}` : String(p.name)
  return `<strong>${esc(title)}</strong><br>${rows.join('<br>')}`
}

export const liveLayer: AtlasLayerModule = {
  toggles: [
    {
      key: 'gauges',
      label: 'River gauges (live)',
      color: VULPES.teal,
      on: true,
      ids: ['live-gauges', 'live-gauges-labels'],
    },
    {
      key: 'tides',
      label: 'Tides (live + predicted)',
      color: VULPES.teal,
      on: false,
      ids: ['live-tides', 'live-tides-labels'],
    },
    {
      key: 'trains',
      label: 'Hudson Line trains (live)',
      color: VULPES.ink,
      on: true,
      ids: ['live-trains', 'live-trains-labels'],
    },
  ],

  async add(map: MaplibreMap, ctx: AtlasContext) {
    const load = () => $fetch<LiveData>('/api/atlas/live')
    const data = await load().catch(() => null)
    for (const k of KEYS)
      map.addSource(`live-${k}`, {
        type: 'geojson',
        data: data?.[k] ?? empty(),
      })

    // Gauges: filled teal dots, magenta once a gauge reaches action stage
    map.addLayer({
      id: 'live-gauges',
      type: 'circle',
      source: 'live-gauges',
      paint: {
        'circle-color': [
          'case',
          ['in', ['get', 'floodCategory'], ['literal', FLOODING]],
          VULPES.magenta,
          VULPES.teal,
        ],
        'circle-radius': [
          'interpolate',
          ['linear'],
          ['zoom'],
          8,
          ['case', ['==', ['get', 'kind'], 'main'], 4.5, 3],
          13,
          ['case', ['==', ['get', 'kind'], 'main'], 8, 6],
        ],
        'circle-stroke-color': VULPES.ground,
        'circle-stroke-width': 1.5,
      },
    })
    map.addLayer(label('gauges', VULPES.teal))

    // Tides: hollow teal rings; solid centre where there's a live reading
    map.addLayer({
      id: 'live-tides',
      type: 'circle',
      source: 'live-tides',
      paint: {
        'circle-color': ['case', ['get', 'live'], VULPES.teal, VULPES.ground],
        'circle-radius': ['interpolate', ['linear'], ['zoom'], 8, 3.5, 13, 7],
        'circle-stroke-color': VULPES.teal,
        'circle-stroke-width': 2,
      },
    })
    map.addLayer(label('tides', VULPES.teal))

    // Trains: solid ink for reported positions, hollow ink for estimates
    map.addLayer({
      id: 'live-trains',
      type: 'circle',
      source: 'live-trains',
      paint: {
        'circle-color': [
          'case',
          ['get', 'estimated'],
          VULPES.ground,
          VULPES.ink,
        ],
        'circle-radius': ['interpolate', ['linear'], ['zoom'], 8, 4, 13, 7],
        'circle-stroke-color': [
          'case',
          ['get', 'estimated'],
          VULPES.ink,
          VULPES.ground,
        ],
        'circle-stroke-width': 2,
      },
    })
    map.addLayer(label('trains', VULPES.ink, 1.4))

    for (const k of KEYS) {
      const id = `live-${k}`
      map.on('mouseenter', id, () => (map.getCanvas().style.cursor = 'pointer'))
      map.on('mouseleave', id, () => (map.getCanvas().style.cursor = ''))
      map.on('click', id, (e) => {
        const f = e.features?.[0]
        if (f) ctx.popup(e.lngLat, popupHtml(k, f.properties, ctx.escapeHtml))
      })
    }

    stopLive()
    timer = setInterval(async () => {
      const next = await load().catch(() => null)
      if (!next) return
      try {
        for (const k of KEYS)
          (map.getSource(`live-${k}`) as GeoJSONSource).setData(next[k])
      } catch {
        // Map torn down without calling stopLive(): stop on our own
        stopLive()
      }
    }, REFRESH_MS)

    return Object.fromEntries(
      KEYS.map((k) => [k, data?.[k].features.length ?? 0])
    )
  },
}
