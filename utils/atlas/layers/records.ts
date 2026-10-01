// Public-records sites: agencies and facilities from the FOIL docket on
// archive.ejfox.com, baked by scripts/build/atlas-records.mjs
import type { FeatureCollection, Point } from 'geojson'
import records from '~/data/atlas/records.json'
import { VULPES, type AtlasLayerModule } from '../types'

const GOLD = '#f5d76e'

interface RecordProps {
  name: string
  kind: string
  summary: string
  wiki: string
  foil: string[]
  precision: string
}

const data = records as FeatureCollection<Point, RecordProps>

const wikiHref = (title: string) =>
  `https://archive.ejfox.com/wiki/${encodeURIComponent(title.replaceAll(' ', '_'))}`

export const recordsLayer: AtlasLayerModule = {
  toggles: [
    {
      key: 'records',
      label: 'Records',
      color: GOLD,
      on: true,
      ids: ['records', 'records-labels'],
    },
  ],
  add: async (map, ctx) => {
    map.addSource('records', { type: 'geojson', data })
    map.addLayer({
      id: 'records',
      type: 'circle',
      source: 'records',
      paint: {
        'circle-color': GOLD,
        'circle-radius': ['interpolate', ['linear'], ['zoom'], 8, 4, 14, 7],
        'circle-stroke-color': VULPES.ground,
        'circle-stroke-width': 2,
      },
    })
    map.addLayer({
      id: 'records-labels',
      type: 'symbol',
      source: 'records',
      minzoom: 9,
      layout: {
        'text-field': ['get', 'name'],
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

    // Rendered features carry arrays as JSON strings, so popups read the
    // original properties by name
    const byName = new Map(data.features.map((f) => [f.properties.name, f]))
    const esc = ctx.escapeHtml
    const link = (href: string, text: string) =>
      `<a href="${esc(href)}" target="_blank" rel="noopener">${esc(text)}</a>`

    map.on('mouseenter', 'records', () => {
      map.getCanvas().style.cursor = 'pointer'
    })
    map.on('mouseleave', 'records', () => {
      map.getCanvas().style.cursor = ''
    })
    map.on('click', 'records', (e) => {
      const f = byName.get(e.features?.[0]?.properties?.name)
      if (!f) return
      const p = f.properties
      const foil = p.foil.map((t) => `<br>${link(wikiHref(t), t)}`).join('')
      ctx.popup(
        f.geometry.coordinates as [number, number],
        `<strong>${esc(p.name)}</strong><br>${esc(p.kind)} · ${esc(p.precision)}` +
          `<br>${esc(p.summary)}<br>${link(p.wiki, 'wiki →')}${foil}`
      )
    })

    return { records: data.features.length }
  },
}
