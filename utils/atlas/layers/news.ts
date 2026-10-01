// Local news by town: two weeks of countywatch headlines from
// /api/atlas/news, one circle per town sized by how many stories it got.
// Hollow rings are county/region-wide stories pinned to a centroid
import type { FeatureCollection, Point } from 'geojson'
import { VULPES, type AtlasLayerModule } from '../types'

interface Headline {
  title: string
  source: string
  date: string
  url: string
}
interface TownProps {
  name: string
  kind: 'town' | 'county'
  count: number
  label: string
  latest: string
  headlines: Headline[]
}
type NewsData = FeatureCollection<Point, TownProps> & { days?: number }

const WHITE = '#ffffff'

const shortDate = (d: string) =>
  new Date(`${d}T12:00:00`).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })

export const newsLayer: AtlasLayerModule = {
  toggles: [
    {
      key: 'news',
      label: 'Local news (14 days)',
      color: VULPES.ink,
      on: false,
      ids: ['news', 'news-labels'],
    },
  ],
  add: async (map, ctx) => {
    const data = await $fetch<NewsData>('/api/atlas/news').catch(() => null)
    const features = data?.features ?? []
    map.addSource('news', {
      type: 'geojson',
      data: { type: 'FeatureCollection', features },
    })
    map.addLayer({
      id: 'news',
      type: 'circle',
      source: 'news',
      layout: { visibility: 'none' },
      paint: {
        'circle-color': [
          'case',
          ['==', ['get', 'kind'], 'county'],
          'rgba(0,0,0,0)',
          VULPES.ink,
        ],
        'circle-opacity': 0.85,
        'circle-radius': ['+', 3, ['*', 3, ['sqrt', ['get', 'count']]]],
        'circle-stroke-color': [
          'case',
          ['==', ['get', 'kind'], 'county'],
          WHITE,
          VULPES.ground,
        ],
        'circle-stroke-width': 1.5,
      },
    })
    map.addLayer({
      id: 'news-labels',
      type: 'symbol',
      source: 'news',
      minzoom: 9,
      layout: {
        visibility: 'none',
        'text-field': ['get', 'label'],
        'text-size': 11,
        'text-offset': [0, 1.4],
        'text-anchor': 'top',
        'text-font': ['Noto Sans Medium'],
      },
      paint: {
        'text-color': WHITE,
        'text-halo-color': VULPES.ground,
        'text-halo-width': 1.2,
      },
    })

    // Rendered features carry arrays as JSON strings, so popups read the
    // original properties by name
    const byName = new Map(features.map((f) => [f.properties.name, f]))
    const esc = ctx.escapeHtml
    const days = data?.days ?? 14

    map.on('mouseenter', 'news', () => {
      map.getCanvas().style.cursor = 'pointer'
    })
    map.on('mouseleave', 'news', () => {
      map.getCanvas().style.cursor = ''
    })
    map.on('click', 'news', (e) => {
      const f = byName.get(e.features?.[0]?.properties?.name)
      if (!f) return
      const p = f.properties
      const items = p.headlines
        .map(
          (h) =>
            `<br><a href="${esc(h.url)}" target="_blank" rel="noopener">` +
            `${esc(h.title)}</a><br><span style="opacity:.7">` +
            `${esc(h.source)} · ${esc(shortDate(h.date))}</span>`
        )
        .join('')
      const more = p.count > p.headlines.length ? ', latest 5' : ''
      ctx.popup(
        f.geometry.coordinates as [number, number],
        `<strong>${esc(p.name)}</strong><br>${p.count} ` +
          `${p.count === 1 ? 'story' : 'stories'} in ${days} days${more}` +
          (p.kind === 'county' ? ' (county-wide)' : '') +
          items
      )
    })

    return { news: features.length }
  },
}
