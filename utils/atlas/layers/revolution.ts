// The Revolution in the valley: battles, forts and positions, troop and
// courier routes, and NPS battlefield study areas, from EJ's hudsonmaps app
// via /api/atlas/history. hudsonmaps has no georeferenced period maps to
// tile (its "historical" layers are modern basemaps), so this is vector only
import type { Feature, FeatureCollection } from 'geojson'
import { VULPES, type AtlasLayerModule } from '../types'

const PARCHMENT = '#d6c59a'
const GOLD = '#c9a23f'

type FC = FeatureCollection
interface HistoryData {
  battles: FC
  positions: FC
  routes: FC
  fields: FC
}
const KEYS = ['fields', 'routes', 'positions', 'battles'] as const
const empty = (): FC => ({ type: 'FeatureCollection', features: [] })

// Topmost first: one popup per click, for the most specific thing hit
const CLICKABLE = ['rev-battles', 'rev-positions', 'rev-routes', 'rev-fields']

export const revolutionLayer: AtlasLayerModule = {
  toggles: [
    {
      key: 'revolution',
      label: 'The Revolution, 1775–83',
      color: GOLD,
      on: false,
      ids: [
        'rev-fields',
        'rev-fields-line',
        'rev-routes',
        'rev-positions',
        'rev-positions-labels',
        'rev-battles',
        'rev-battles-labels',
      ],
    },
  ],
  add: async (map, ctx) => {
    const data = await $fetch<HistoryData>('/api/atlas/history').catch(
      () => null
    )
    for (const k of KEYS)
      map.addSource(`rev-${k}`, { type: 'geojson', data: data?.[k] ?? empty() })
    const hidden = { visibility: 'none' } as const

    // Battlefield study areas: a faint wash under the labels
    map.addLayer(
      {
        id: 'rev-fields',
        type: 'fill',
        source: 'rev-fields',
        layout: hidden,
        paint: { 'fill-color': GOLD, 'fill-opacity': 0.08 },
      },
      ctx.beforeLabels
    )
    map.addLayer(
      {
        id: 'rev-fields-line',
        type: 'line',
        source: 'rev-fields',
        layout: hidden,
        paint: { 'line-color': GOLD, 'line-opacity': 0.4, 'line-width': 1 },
      },
      ctx.beforeLabels
    )

    // Routes: long dashes for the Continentals, short for the British
    map.addLayer({
      id: 'rev-routes',
      type: 'line',
      source: 'rev-routes',
      layout: { ...hidden, 'line-cap': 'round' },
      paint: {
        'line-color': PARCHMENT,
        'line-opacity': 0.75,
        'line-width': ['interpolate', ['linear'], ['zoom'], 8, 1.2, 13, 2.5],
        'line-dasharray': [
          'case',
          ['==', ['get', 'side'], 'british'],
          ['literal', [1, 2]],
          ['literal', [4, 2]],
        ],
      },
    })

    // Positions: filled for the Continentals, hollow for the British
    map.addLayer({
      id: 'rev-positions',
      type: 'circle',
      source: 'rev-positions',
      layout: hidden,
      paint: {
        'circle-color': [
          'case',
          ['==', ['get', 'side'], 'british'],
          VULPES.ground,
          PARCHMENT,
        ],
        'circle-radius': ['interpolate', ['linear'], ['zoom'], 8, 2.5, 14, 5],
        'circle-stroke-color': [
          'case',
          ['==', ['get', 'side'], 'british'],
          PARCHMENT,
          VULPES.ground,
        ],
        'circle-stroke-width': 1.2,
      },
    })
    map.addLayer({
      id: 'rev-positions-labels',
      type: 'symbol',
      source: 'rev-positions',
      minzoom: 12,
      layout: {
        ...hidden,
        'text-field': ['get', 'name'],
        'text-size': 10,
        'text-offset': [0, 1],
        'text-anchor': 'top',
        'text-max-width': 9,
        'text-font': ['Noto Sans Italic'],
      },
      paint: {
        'text-color': PARCHMENT,
        'text-halo-color': VULPES.ground,
        'text-halo-width': 1.2,
      },
    })

    // Battles: gold, larger, labelled with the year
    map.addLayer({
      id: 'rev-battles',
      type: 'circle',
      source: 'rev-battles',
      layout: hidden,
      paint: {
        'circle-color': GOLD,
        'circle-radius': ['interpolate', ['linear'], ['zoom'], 8, 4.5, 14, 8],
        'circle-stroke-color': VULPES.ground,
        'circle-stroke-width': 2,
      },
    })
    map.addLayer({
      id: 'rev-battles-labels',
      type: 'symbol',
      source: 'rev-battles',
      minzoom: 9,
      layout: {
        ...hidden,
        'text-field': [
          'concat',
          ['get', 'name'],
          ' ',
          ['to-string', ['coalesce', ['get', 'year'], '']],
        ],
        'text-size': 11,
        'text-offset': [0, 1.2],
        'text-anchor': 'top',
        'text-max-width': 10,
        'text-font': ['Noto Sans Medium'],
      },
      paint: {
        'text-color': GOLD,
        'text-halo-color': VULPES.ground,
        'text-halo-width': 1.2,
      },
    })

    // Positions carry a letters array, which rendered features flatten to a
    // JSON string, so popups read the original properties by id
    const byId = new Map<string, Feature>(
      (data?.positions.features ?? []).map((f) => [String(f.properties?.id), f])
    )
    const esc = ctx.escapeHtml
    const link = (href: string, text: string) =>
      `<a href="${esc(href)}" target="_blank" rel="noopener">${esc(text)}</a>`
    const lines = (...xs: (string | null | undefined)[]) =>
      xs
        .filter(Boolean)
        .map((x) => `<br>${esc(x!)}`)
        .join('')

    const html = (layer: string, p: Record<string, any>) => {
      if (layer === 'rev-battles')
        return (
          `<strong>${esc(p.name)}</strong>` +
          lines([p.date, p.result].filter(Boolean).join(' · '), p.notes) +
          (p.wiki ? `<br>${link(p.wiki, 'Wikipedia →')}` : '')
        )
      if (layer === 'rev-positions') {
        const q = byId.get(String(p.id))?.properties ?? p
        const letters = Array.isArray(q.letters) ? q.letters : []
        return (
          `<strong>${esc(q.name)}</strong>` +
          lines(
            [q.side === 'british' ? 'British' : 'Continental', q.type, q.date]
              .filter(Boolean)
              .join(' · '),
            q.commander && `Commander: ${q.commander}`,
            q.garrison && `Garrison: ${q.garrison}`,
            q.notes
          ) +
          letters
            .map(
              (l: { title: string; date: string; url: string }) =>
                `<br>${link(l.url, l.title || 'letter')}` +
                (l.date
                  ? ` <span style="opacity:.7">${esc(l.date)}</span>`
                  : '')
            )
            .join('')
        )
      }
      if (layer === 'rev-routes')
        return `<strong>${esc(p.name)}</strong>` + lines(p.description)
      return (
        `<strong>${esc(p.name)}</strong>` +
        lines('Battlefield study area (NPS ABPP)')
      )
    }

    for (const id of CLICKABLE) {
      map.on('mouseenter', id, () => (map.getCanvas().style.cursor = 'pointer'))
      map.on('mouseleave', id, () => (map.getCanvas().style.cursor = ''))
    }
    map.on('click', (e) => {
      const layers = CLICKABLE.filter((id) => map.getLayer(id))
      if (!layers.length) return
      const hits = map.queryRenderedFeatures(e.point, { layers })
      for (const id of CLICKABLE) {
        const f = hits.find((h) => h.layer.id === id)
        if (f) return ctx.popup(e.lngLat, html(id, f.properties))
      }
    })

    return {
      revolution:
        (data?.battles.features.length ?? 0) +
        (data?.positions.features.length ?? 0) +
        (data?.routes.features.length ?? 0),
    }
  },
}
