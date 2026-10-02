// PRIVATE layers (EJ only, after unlocking the atlas): aircraft density and
// notable aircraft from skywatch, geolocated anomalywatch signals, and a
// coarse "where I've been" heat from travels. Everything comes from the
// /api/atlas/private/* routes, which 404 for anyone else and already strip
// home-area data; this module only draws what they return.
import type { Map as MaplibreMap } from 'maplibre-gl'
import { VULPES, type AtlasContext, type AtlasLayerModule } from '../types'

type FC = { type: 'FeatureCollection'; features: any[] }
const empty = (): FC => ({ type: 'FeatureCollection', features: [] })

const NOTABLE_COLORS: Record<string, string> = {
  military: VULPES.magenta,
  foreign_military: '#ff7a3d',
  government: '#f2c94c',
  law_enforcement: '#5b8cff',
  surveillance: '#b98cff',
}
const NOTABLE_LABEL: Record<string, string> = {
  military: 'military',
  foreign_military: 'foreign military',
  government: 'government',
  law_enforcement: 'law enforcement',
  surveillance: 'surveillance',
}
// One color per anomalywatch source, assigned in order of first appearance
const SOURCE_PALETTE = [
  VULPES.teal,
  '#f2c94c',
  '#ff7a3d',
  '#b98cff',
  '#7bd88f',
  '#5b8cff',
  '#ff9ec7',
  VULPES.ink,
]

const when = (iso: string) =>
  new Date(iso).toLocaleString('en-US', {
    timeZone: 'America/New_York',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })

const safeLink = (
  url: unknown,
  text: string,
  esc: AtlasContext['escapeHtml']
) =>
  typeof url === 'string' && /^https?:\/\//i.test(url)
    ? `<a href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(text)}</a>`
    : ''

const hover = (map: MaplibreMap, id: string) => {
  map.on('mouseenter', id, () => (map.getCanvas().style.cursor = 'pointer'))
  map.on('mouseleave', id, () => (map.getCanvas().style.cursor = ''))
}

const hidden = { visibility: 'none' as const }

export const privateLayer: AtlasLayerModule = {
  private: true,
  toggles: [
    {
      key: 'sky-density',
      label: 'Air traffic, 7 days (private)',
      color: VULPES.teal,
      on: false,
      ids: ['private-sky-density'],
    },
    {
      key: 'sky-notable',
      label: 'Notable aircraft, 24h (private)',
      color: VULPES.magenta,
      on: false,
      ids: ['private-sky-notable', 'private-sky-notable-labels'],
    },
    {
      key: 'signals',
      label: 'Anomalywatch signals, 7 days (private)',
      color: '#f2c94c',
      on: false,
      ids: ['private-signals'],
    },
    {
      key: 'travels',
      label: "Where I've been (private)",
      color: '#ff7a3d',
      on: false,
      ids: ['private-travels'],
    },
  ],

  async add(map: MaplibreMap, ctx: AtlasContext) {
    const esc = ctx.escapeHtml
    const [sky, signals, travels] = await Promise.all([
      $fetch<{ density: FC; notable: FC }>('/api/atlas/private/sky').catch(
        () => null
      ),
      $fetch<{ signals: FC }>('/api/atlas/private/signals').catch(() => null),
      $fetch<{ travels: FC }>('/api/atlas/private/travels').catch(() => null),
    ])

    // ------------------------------------------------- travels heat (lowest)
    map.addSource('private-travels', {
      type: 'geojson',
      data: travels?.travels ?? empty(),
    })
    map.addLayer(
      {
        id: 'private-travels',
        type: 'heatmap',
        source: 'private-travels',
        layout: hidden,
        paint: {
          'heatmap-weight': [
            'interpolate',
            ['linear'],
            ['ln', ['+', 1, ['get', 'minutes']]],
            0,
            0,
            8,
            1,
          ],
          'heatmap-intensity': [
            'interpolate',
            ['linear'],
            ['zoom'],
            4,
            0.6,
            12,
            2,
          ],
          'heatmap-radius': [
            'interpolate',
            ['linear'],
            ['zoom'],
            4,
            6,
            9,
            18,
            13,
            40,
          ],
          'heatmap-opacity': 0.75,
          'heatmap-color': [
            'interpolate',
            ['linear'],
            ['heatmap-density'],
            0,
            'rgba(0,0,0,0)',
            0.2,
            '#5a1530',
            0.5,
            VULPES.magenta,
            0.8,
            '#ff7a3d',
            1,
            '#ffe2b8',
          ],
        },
      },
      ctx.beforeLabels
    )

    // ---------------------------------------------------- air traffic hexes
    map.addSource('private-sky-density', {
      type: 'geojson',
      data: sky?.density ?? empty(),
    })
    map.addLayer(
      {
        id: 'private-sky-density',
        type: 'fill',
        source: 'private-sky-density',
        layout: hidden,
        paint: {
          'fill-color': [
            'interpolate',
            ['linear'],
            ['get', 't'],
            0,
            '#12343a',
            0.6,
            '#2f8f99',
            1,
            VULPES.teal,
          ],
          'fill-opacity': [
            'interpolate',
            ['linear'],
            ['get', 't'],
            0,
            0.15,
            1,
            0.55,
          ],
          'fill-outline-color': 'rgba(0,0,0,0)',
        },
      },
      ctx.beforeLabels
    )
    map.on('click', 'private-sky-density', (e) => {
      const p = e.features?.[0]?.properties
      if (!p) return
      // Points drawn above the hexes get their own popup instead
      const above = ['private-signals', 'private-sky-notable'].filter(
        (id) => map.getLayoutProperty(id, 'visibility') === 'visible'
      )
      if (
        above.length &&
        map.queryRenderedFeatures(e.point, { layers: above }).length
      )
        return
      ctx.popup(
        e.lngLat,
        `<strong>Air traffic, last 7 days</strong><br>` +
          `${esc(String(p.aircraft))} aircraft · ${esc(String(p.n))} position reports` +
          `<br>~3 km hex`
      )
    })

    // ------------------------------------------------------------- signals
    const sigData = signals?.signals ?? empty()
    const sources: string[] = []
    for (const f of sigData.features)
      if (!sources.includes(f.properties.source))
        sources.push(f.properties.source)
    const sourceColor = (s: string) =>
      SOURCE_PALETTE[sources.indexOf(s) % SOURCE_PALETTE.length] ?? VULPES.ink
    map.addSource('private-signals', { type: 'geojson', data: sigData })
    map.addLayer({
      id: 'private-signals',
      type: 'circle',
      source: 'private-signals',
      layout: hidden,
      paint: {
        'circle-color': sources.length
          ? ([
              'match',
              ['get', 'source'],
              ...sources.flatMap((s) => [s, sourceColor(s)]),
              VULPES.ink,
            ] as any)
          : VULPES.ink,
        'circle-radius': ['interpolate', ['linear'], ['zoom'], 7, 3.5, 13, 7],
        'circle-stroke-color': VULPES.ground,
        'circle-stroke-width': 1.5,
      },
    })
    map.on('click', 'private-signals', (e) => {
      const p = e.features?.[0]?.properties
      if (!p) return
      const link = safeLink(p.url, 'source link', esc)
      ctx.popup(
        e.lngLat,
        `<strong>${esc(String(p.title))}</strong>` +
          (p.summary ? `<br>${esc(String(p.summary))}` : '') +
          `<br><span style="color:${sourceColor(p.source)}">●</span> ` +
          `${esc(String(p.source))} · ${esc(when(p.time))}` +
          (link ? `<br>${link}` : '')
      )
    })

    // ---------------------------------------------------- notable aircraft
    map.addSource('private-sky-notable', {
      type: 'geojson',
      data: sky?.notable ?? empty(),
    })
    map.addLayer({
      id: 'private-sky-notable',
      type: 'circle',
      source: 'private-sky-notable',
      layout: hidden,
      paint: {
        'circle-color': [
          'match',
          ['get', 'category'],
          ...Object.entries(NOTABLE_COLORS).flat(),
          VULPES.magenta,
        ] as any,
        'circle-radius': ['interpolate', ['linear'], ['zoom'], 7, 4.5, 13, 8],
        'circle-stroke-color': VULPES.ground,
        'circle-stroke-width': 1.5,
      },
    })
    map.addLayer({
      id: 'private-sky-notable-labels',
      type: 'symbol',
      source: 'private-sky-notable',
      minzoom: 9,
      layout: {
        ...hidden,
        'text-field': ['coalesce', ['get', 'callsign'], ''],
        'text-size': 10,
        'text-offset': [0, 1.3],
        'text-anchor': 'top',
        'text-font': ['Noto Sans Medium'],
      },
      paint: {
        'text-color': VULPES.ink,
        'text-halo-color': VULPES.ground,
        'text-halo-width': 1.2,
      },
    })
    map.on('click', 'private-sky-notable', (e) => {
      const p = e.features?.[0]?.properties
      if (!p) return
      const rows = [
        [
          NOTABLE_LABEL[p.category] ?? p.category,
          p.operator && p.operator !== 'null' ? p.operator : '',
        ]
          .filter(Boolean)
          .join(' · '),
        p.type && p.type !== 'null' ? p.type : '',
        [
          Number.isFinite(Number(p.altitudeFt)) && p.altitudeFt !== null
            ? `${Number(p.altitudeFt).toLocaleString('en-US')} ft`
            : '',
          `last seen ${when(p.time)}`,
        ]
          .filter(Boolean)
          .join(' · '),
      ]
        .filter(Boolean)
        .map((r) => esc(String(r)))
      const link = safeLink(p.url, 'ADS-B Exchange', esc)
      const name = p.callsign && p.callsign !== 'null' ? p.callsign : p.icao24
      ctx.popup(
        e.lngLat,
        `<strong>${esc(String(name))}</strong><br>${rows.join('<br>')}` +
          (link ? `<br>${link}` : '')
      )
    })

    for (const id of [
      'private-sky-density',
      'private-signals',
      'private-sky-notable',
    ])
      hover(map, id)

    return {
      'sky-density': sky?.density.features.length ?? 0,
      'sky-notable': sky?.notable.features.length ?? 0,
      signals: sigData.features.length,
      travels: travels?.travels.features.length ?? 0,
    }
  },
}
