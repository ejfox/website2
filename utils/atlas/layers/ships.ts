// Ships on the Hudson: commercial and government AIS positions from
// /api/atlas/ships (riverwatch), as arrows pointed along their course
import type { GeoJSONSource, Map as MaplibreMap } from 'maplibre-gl'
import { VULPES, type AtlasContext, type AtlasLayerModule } from '../types'

type FC = { type: 'FeatureCollection'; features: any[] }

// Sea-green: reads as "on the water" without matching the gauges' teal
const SHIP = '#3fc1a5'
const REFRESH_MS = 60_000
const ARROW = 'atlas-ship-arrow'
const DOT = 'atlas-ship-dot'
const empty = (): FC => ({ type: 'FeatureCollection', features: [] })

let timer: ReturnType<typeof setInterval> | null = null
const stop = () => {
  if (timer) clearInterval(timer)
  timer = null
}

// Canvas-drawn icons at 2x: a dart for vessels with a course, a dot without
const icon = (draw: (c: CanvasRenderingContext2D) => void) => {
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = 32
  const c = canvas.getContext('2d')!
  c.fillStyle = SHIP
  c.strokeStyle = VULPES.ground
  c.lineWidth = 3
  c.lineJoin = 'round'
  draw(c)
  return c.getImageData(0, 0, 32, 32)
}
const addIcons = (map: MaplibreMap) => {
  if (!map.hasImage(ARROW))
    map.addImage(
      ARROW,
      icon((c) => {
        c.beginPath()
        c.moveTo(16, 3)
        c.lineTo(26, 28)
        c.lineTo(16, 22)
        c.lineTo(6, 28)
        c.closePath()
        c.stroke()
        c.fill()
      }),
      { pixelRatio: 2 }
    )
  if (!map.hasImage(DOT))
    map.addImage(
      DOT,
      icon((c) => {
        c.beginPath()
        c.arc(16, 16, 7, 0, Math.PI * 2)
        c.stroke()
        c.fill()
      }),
      { pixelRatio: 2 }
    )
}

const ago = (iso: string) => {
  const min = Math.round((Date.now() - Date.parse(iso)) / 60e3)
  if (!Number.isFinite(min)) return null
  return min < 1
    ? 'just now'
    : min < 60
      ? `${min} min ago`
      : `${Math.round(min / 60)} h ago`
}

const popupHtml = (p: Record<string, any>, esc: AtlasContext['escapeHtml']) => {
  const rows: string[] = [esc(p.type)]
  const motion = [
    typeof p.speed === 'number' ? `${p.speed} kn` : null,
    p.directed ? `course ${p.course}°` : null,
  ].filter(Boolean)
  if (motion.length) rows.push(esc(motion.join(' · ')))
  if (p.destination) rows.push(`to ${esc(p.destination)}`)
  const seen = p.lastSeen && ago(p.lastSeen)
  if (seen) rows.push(`seen ${esc(seen)}`)
  rows.push(
    `MMSI ${esc(p.mmsi)} · <a href="${esc(p.url)}" target="_blank" rel="noopener">MarineTraffic</a>`
  )
  return `<strong>${esc(p.name)}</strong><br>${rows.join('<br>')}`
}

export const shipsLayer: AtlasLayerModule = {
  toggles: [
    {
      key: 'ships',
      label: 'Ships on the Hudson (AIS)',
      color: SHIP,
      on: true,
      ids: ['ships', 'ships-labels'],
    },
  ],

  async add(map: MaplibreMap, ctx: AtlasContext) {
    const load = () =>
      $fetch<{ ships: FC }>('/api/atlas/ships').then((r) => r.ships)
    const data = await load().catch(() => null)
    addIcons(map)
    map.addSource('ships', { type: 'geojson', data: data ?? empty() })

    map.addLayer({
      id: 'ships',
      type: 'symbol',
      source: 'ships',
      layout: {
        'icon-image': ['case', ['get', 'directed'], ARROW, DOT],
        'icon-rotate': ['coalesce', ['get', 'course'], 0],
        'icon-rotation-alignment': 'map',
        'icon-size': ['interpolate', ['linear'], ['zoom'], 8, 0.7, 13, 1.2],
        'icon-allow-overlap': true,
        'icon-ignore-placement': true,
      },
    })
    map.addLayer({
      id: 'ships-labels',
      type: 'symbol',
      source: 'ships',
      minzoom: 11,
      layout: {
        'text-field': ['get', 'name'],
        'text-size': 10,
        'text-offset': [0, 1.3],
        'text-anchor': 'top',
        'text-font': ['Noto Sans Italic'],
      },
      paint: {
        'text-color': SHIP,
        'text-halo-color': VULPES.ground,
        'text-halo-width': 1.2,
      },
    })

    map.on(
      'mouseenter',
      'ships',
      () => (map.getCanvas().style.cursor = 'pointer')
    )
    map.on('mouseleave', 'ships', () => (map.getCanvas().style.cursor = ''))
    map.on('click', 'ships', (e) => {
      const f = e.features?.[0]
      if (f) ctx.popup(e.lngLat, popupHtml(f.properties, ctx.escapeHtml))
    })

    stop()
    timer = setInterval(async () => {
      const next = await load().catch(() => null)
      if (!next) return
      try {
        ;(map.getSource('ships') as GeoJSONSource).setData(next)
      } catch {
        // Map torn down without dispose(): stop on our own
        stop()
      }
    }, REFRESH_MS)

    return { ships: data?.features.length ?? 0 }
  },

  dispose: stop,
}
