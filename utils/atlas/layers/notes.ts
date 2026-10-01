// Notes: places from EJ's own writing, baked by scripts/build/atlas-notes.mjs.
// Roads he writes about riding, the towns New York City drowned for its
// reservoirs, and hidden-history sites from his Hudson Valley book notes.
// Quotes come only from his published posts on ejfox.com. pages/atlas.vue
// applies each toggle's initial visibility
import type {
  FeatureCollection,
  LineString,
  MultiLineString,
  Point,
} from 'geojson'
import type { MapLayerMouseEvent } from 'maplibre-gl'
import places from '~/data/atlas/notes-places.json'
import { VULPES, type AtlasLayerModule } from '../types'

const EMBER = '#ff9a76'
const GHOST = '#a7c7e7'
const PARCHMENT = '#efe0c0'

interface NoteProps {
  name: string
  kind: 'road' | 'drowned' | 'history'
  note: string
  year?: number
  precision?: string
  reservoir?: string
  quote?: string
  source?: string
}

const data = places as FeatureCollection<
  Point | LineString | MultiLineString,
  NoteProps
>

const byKind = (kind: NoteProps['kind']) => ({
  type: 'FeatureCollection' as const,
  features: data.features.filter((f) => f.properties.kind === kind),
})

// content/blog/2025/foo.md → https://ejfox.com/blog/2025/foo
const postUrl = (source: string) =>
  `https://ejfox.com/blog/${source.replace(/^content\/blog\//, '').replace(/\.md$/, '')}`

const label = (id: string, source: string, color: string, minzoom: number) => ({
  id,
  type: 'symbol' as const,
  source,
  minzoom,
  layout: {
    'text-field': ['get', 'name'] as ['get', string],
    'text-size': 11,
    'text-offset': [0, 1.2] as [number, number],
    'text-anchor': 'top' as const,
    'text-max-width': 10,
    'text-font': ['Noto Sans Italic'],
  },
  paint: {
    'text-color': color,
    'text-halo-color': VULPES.ground,
    'text-halo-width': 1.2,
  },
})

export const notesLayer: AtlasLayerModule = {
  toggles: [
    {
      key: 'notes-roads',
      label: 'Roads EJ rides',
      color: EMBER,
      on: true,
      ids: ['notes-roads', 'notes-roads-labels'],
    },
    {
      key: 'notes-drowned',
      label: 'Drowned towns',
      color: GHOST,
      on: false,
      ids: ['notes-drowned', 'notes-drowned-labels'],
    },
    {
      key: 'notes-history',
      label: 'Hidden history',
      color: PARCHMENT,
      on: false,
      ids: ['notes-history', 'notes-history-labels'],
    },
  ],
  add: async (map, ctx) => {
    const roads = byKind('road')
    const drowned = byKind('drowned')
    const history = byKind('history')
    map.addSource('notes-roads', { type: 'geojson', data: roads })
    map.addSource('notes-drowned', { type: 'geojson', data: drowned })
    map.addSource('notes-history', { type: 'geojson', data: history })

    map.addLayer(
      {
        id: 'notes-roads',
        type: 'line',
        source: 'notes-roads',
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: {
          'line-color': EMBER,
          'line-width': ['interpolate', ['linear'], ['zoom'], 8, 1.5, 14, 4],
          'line-opacity': 0.85,
        },
      },
      ctx.beforeLabels
    )
    map.addLayer({
      id: 'notes-roads-labels',
      type: 'symbol',
      source: 'notes-roads',
      minzoom: 10,
      layout: {
        'symbol-placement': 'line',
        'text-field': ['get', 'name'],
        'text-size': 11,
        'text-font': ['Noto Sans Italic'],
      },
      paint: {
        'text-color': EMBER,
        'text-halo-color': VULPES.ground,
        'text-halo-width': 1.2,
      },
    })

    // Drowned towns: hollow rings, a town that is no longer there
    map.addLayer({
      id: 'notes-drowned',
      type: 'circle',
      source: 'notes-drowned',
      paint: {
        'circle-color': 'rgba(0,0,0,0)',
        'circle-radius': ['interpolate', ['linear'], ['zoom'], 8, 4, 14, 8],
        'circle-stroke-color': GHOST,
        'circle-stroke-width': 1.5,
        'circle-stroke-opacity': [
          'case',
          ['==', ['get', 'precision'], 'approximate'],
          0.6,
          1,
        ],
      },
    })
    map.addLayer(label('notes-drowned-labels', 'notes-drowned', GHOST, 9))

    map.addLayer({
      id: 'notes-history',
      type: 'circle',
      source: 'notes-history',
      paint: {
        'circle-color': PARCHMENT,
        'circle-radius': ['interpolate', ['linear'], ['zoom'], 8, 3.5, 14, 6],
        'circle-stroke-color': VULPES.ground,
        'circle-stroke-width': 1.5,
      },
    })
    map.addLayer(label('notes-history-labels', 'notes-history', PARCHMENT, 9))

    const esc = ctx.escapeHtml
    const byName = new Map(data.features.map((f) => [f.properties.name, f]))
    const html = (p: NoteProps) => {
      const meta = [
        p.year ? String(p.year) : '',
        p.reservoir ?? '',
        p.precision === 'approximate' ? 'approximate location' : '',
      ]
        .filter(Boolean)
        .join(' · ')
      const quote =
        p.quote && p.source
          ? `<br><em>“${esc(p.quote)}”</em> <a href="${esc(postUrl(p.source))}" target="_blank" rel="noopener">EJ →</a>`
          : ''
      return (
        `<strong>${esc(p.name)}</strong>` +
        (meta ? `<br>${esc(meta)}` : '') +
        `<br>${esc(p.note)}${quote}`
      )
    }

    for (const id of ['notes-roads', 'notes-drowned', 'notes-history']) {
      map.on('mouseenter', id, () => {
        map.getCanvas().style.cursor = 'pointer'
      })
      map.on('mouseleave', id, () => {
        map.getCanvas().style.cursor = ''
      })
      map.on('click', id, (e: MapLayerMouseEvent) => {
        const f = byName.get(e.features?.[0]?.properties?.name)
        if (!f) return
        const at =
          f.geometry.type === 'Point'
            ? (f.geometry.coordinates as [number, number])
            : e.lngLat
        ctx.popup(at, html(f.properties))
      })
    }

    return {
      'notes-roads': roads.features.length,
      'notes-drowned': drowned.features.length,
      'notes-history': history.features.length,
    }
  },
}
