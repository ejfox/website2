// NYS DEC environmental remediation sites (State Superfund, Brownfield,
// etc.) from /api/atlas/remediation: amber while open, olive once closed out
import type { Map as MaplibreMap } from 'maplibre-gl'
import { VULPES, type AtlasContext, type AtlasLayerModule } from '../types'

type FC = { type: 'FeatureCollection'; features: any[] }

const AMBER = '#e0a526'
const OLIVE = '#8d8f45'
const empty = (): FC => ({ type: 'FeatureCollection', features: [] })

const PROGRAMS: Record<string, string> = {
  HW: 'State Superfund',
  BCP: 'Brownfield Cleanup',
  VCP: 'Voluntary Cleanup',
  ERP: 'Environmental Restoration',
  RCRA: 'RCRA Corrective Action',
}
const CLASSES: Record<string, string> = {
  '01': 'Class 1: imminent danger',
  '02': 'Class 2: significant threat',
  '03': 'Class 3: not a significant threat',
  '04': 'Class 4: closed, needs continued management',
  '05': 'Class 5: no further action',
  A: 'active cleanup',
  C: 'cleanup completed',
  N: 'no further action',
  P: 'potential site',
  PR: 'potentially subject to RCRA corrective action',
}
const decRecord = (site: string) =>
  `https://appfactory.dec.ny.gov/DERExternalSearch/ERDDetails?siteCodeIn=${encodeURIComponent(site)}`

const popupHtml = (p: Record<string, any>, esc: AtlasContext['escapeHtml']) => {
  const program = p.program && (PROGRAMS[p.program] ?? p.program)
  const cls = p.class && (CLASSES[p.class] ?? `class ${p.class}`)
  const rows = [
    esc([program, cls].filter(Boolean).join(' · ')),
    esc([`site ${p.siteCode}`, p.town].filter(Boolean).join(' · ')),
    `<a href="${esc(decRecord(String(p.siteCode)))}" target="_blank" rel="noopener">DEC record</a>`,
  ]
  return `<strong>${esc(p.name)}</strong><br>${rows.join('<br>')}`
}

export const remediationLayer: AtlasLayerModule = {
  toggles: [
    {
      key: 'remediation',
      label: 'Remediation sites (NYS DEC)',
      color: AMBER,
      on: false,
      ids: ['remediation', 'remediation-labels'],
    },
  ],

  async add(map: MaplibreMap, ctx: AtlasContext) {
    const data = await $fetch<{ sites: FC }>('/api/atlas/remediation')
      .then((r) => r.sites)
      .catch(() => null)
    map.addSource('remediation', { type: 'geojson', data: data ?? empty() })
    map.addLayer({
      id: 'remediation',
      type: 'circle',
      source: 'remediation',
      layout: { visibility: 'none' },
      paint: {
        'circle-color': ['case', ['get', 'open'], AMBER, OLIVE],
        'circle-radius': [
          'interpolate',
          ['linear'],
          ['zoom'],
          8,
          ['case', ['get', 'open'], 3, 2],
          14,
          ['case', ['get', 'open'], 7, 5],
        ],
        'circle-stroke-color': VULPES.ground,
        'circle-stroke-width': 1,
      },
    })
    map.addLayer({
      id: 'remediation-labels',
      type: 'symbol',
      source: 'remediation',
      minzoom: 13,
      layout: {
        visibility: 'none',
        'text-field': ['get', 'name'],
        'text-size': 10,
        'text-offset': [0, 1.1],
        'text-anchor': 'top',
        'text-max-width': 10,
        'text-font': ['Noto Sans Regular'],
      },
      paint: {
        'text-color': ['case', ['get', 'open'], AMBER, OLIVE],
        'text-halo-color': VULPES.ground,
        'text-halo-width': 1.2,
      },
    })

    map.on(
      'mouseenter',
      'remediation',
      () => (map.getCanvas().style.cursor = 'pointer')
    )
    map.on(
      'mouseleave',
      'remediation',
      () => (map.getCanvas().style.cursor = '')
    )
    map.on('click', 'remediation', (e) => {
      const f = e.features?.[0]
      if (f) ctx.popup(e.lngLat, popupHtml(f.properties, ctx.escapeHtml))
    })

    return { remediation: data?.features.length ?? 0 }
  },
}
