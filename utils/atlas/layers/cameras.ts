// NYSDOT / 511NY traffic cameras from /api/atlas/cameras (camwatch)
import type { Map as MaplibreMap } from 'maplibre-gl'
import { VULPES, type AtlasContext, type AtlasLayerModule } from '../types'

type FC = { type: 'FeatureCollection'; features: any[] }

const GREY = '#9a9298'
const empty = (): FC => ({ type: 'FeatureCollection', features: [] })

// Same allowlist as the server route: the popup only ever embeds an https
// image from a public DOT/511 host, even if the route were to slip
const SNAPSHOT_HOSTS = [
  '511ny.org',
  '511nj.org',
  'dot.ny.gov',
  'nysdot.skyvdn.com',
]
const safeSnapshot = (url: unknown) => {
  if (typeof url !== 'string') return null
  try {
    const u = new URL(url)
    const ok =
      u.protocol === 'https:' &&
      SNAPSHOT_HOSTS.some(
        (h) => u.hostname === h || u.hostname.endsWith(`.${h}`)
      )
    return ok ? u.href : null
  } catch {
    return null
  }
}

const popupHtml = (p: Record<string, any>, esc: AtlasContext['escapeHtml']) => {
  const rows: string[] = []
  const where = [p.road, p.direction].filter(Boolean).join(' · ')
  if (where && p.road !== p.name) rows.push(esc(where))
  else if (p.direction) rows.push(esc(p.direction))
  const img = safeSnapshot(p.snapshot)
  if (img)
    rows.push(
      `<img src="${esc(img)}" alt="${esc(`Camera view: ${p.name}`)}" ` +
        'loading="lazy" referrerpolicy="no-referrer" style="max-width:240px;display:block">'
    )
  else rows.push('<em>no public snapshot</em>')
  if (p.lastChecked)
    rows.push(
      `checked ${esc(
        new Date(p.lastChecked).toLocaleString('en-US', {
          timeZone: 'America/New_York',
          month: 'short',
          day: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
        })
      )}`
    )
  rows.push(
    `${esc(p.source)} · <a href="https://511ny.org/" target="_blank" rel="noopener">511NY</a>`
  )
  return `<strong>${esc(p.name)}</strong><br>${rows.join('<br>')}`
}

export const camerasLayer: AtlasLayerModule = {
  toggles: [
    {
      key: 'cameras',
      label: 'DOT traffic cameras',
      color: GREY,
      on: false,
      ids: ['cameras'],
    },
  ],

  async add(map: MaplibreMap, ctx: AtlasContext) {
    const data = await $fetch<{ cameras: FC }>('/api/atlas/cameras')
      .then((r) => r.cameras)
      .catch(() => null)
    map.addSource('cameras', { type: 'geojson', data: data ?? empty() })
    map.addLayer({
      id: 'cameras',
      type: 'circle',
      source: 'cameras',
      layout: { visibility: 'none' },
      paint: {
        'circle-color': GREY,
        'circle-radius': ['interpolate', ['linear'], ['zoom'], 8, 2, 13, 4.5],
        'circle-stroke-color': VULPES.ground,
        'circle-stroke-width': 1,
      },
    })

    map.on(
      'mouseenter',
      'cameras',
      () => (map.getCanvas().style.cursor = 'pointer')
    )
    map.on('mouseleave', 'cameras', () => (map.getCanvas().style.cursor = ''))
    map.on('click', 'cameras', (e) => {
      const f = e.features?.[0]
      if (f) ctx.popup(e.lngLat, popupHtml(f.properties, ctx.escapeHtml))
    })

    return { cameras: data?.features.length ?? 0 }
  },
}
