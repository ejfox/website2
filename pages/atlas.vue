<script setup lang="ts">
// Valley Atlas v0 — one map of the Hudson Valley, layered from things already
// built: terrain, the published rides, OSM water/shelter/emergency points, and
// the repeater list. Hidden like /kitchen-sink until EJ signs off.
import * as maplibregl from 'maplibre-gl'
import mlcontour from 'maplibre-contour'
import { Protocol } from 'pmtiles'
import { layers as basemapLayers, namedFlavor } from '@protomaps/basemaps'
import 'maplibre-gl/dist/maplibre-gl.css'

definePageMeta({ layout: false })
useHead({
  title: 'Valley Atlas',
  meta: [{ name: 'robots', content: 'noindex, nofollow' }],
})

// No API keys anywhere. Basemap: a Hudson Valley extract of the Protomaps
// planet build (zoom 0–14, overzoomed past that), served from R2 with HTTP
// range requests. Terrain: the open AWS Terrarium elevation tiles.
const BASEMAP_URL =
  'https://pub-d198c0af42af471bb2e755ad4a268050.r2.dev/basemap/hudson-valley-20260930.pmtiles'
const TERRAIN_URL =
  'https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png'
// Fonts + sprites mirrored from protomaps/basemaps-assets into the same
// bucket. Only the Latin glyph ranges are mirrored (labels are English),
// so a rare non-Latin glyph renders blank rather than breaking the map.
const ASSETS = 'https://pub-d198c0af42af471bb2e755ad4a268050.r2.dev/assets'

const VULPES = {
  ground: '#0c0a0d',
  magenta: '#e60067',
  teal: '#6eedf7',
  ink: '#e9e4e7',
  muted: '#80767d',
}

// Each toggle names the map layers it controls; `count` fills in once data loads
const LAYERS = reactive([
  {
    key: 'terrain',
    label: 'Terrain',
    color: VULPES.muted,
    on: true,
    ids: ['hillshade', 'contour-lines', 'contour-labels'],
    count: null as number | null,
  },
  {
    key: 'rides',
    label: 'Rides',
    color: VULPES.magenta,
    on: true,
    ids: ['rides'],
    count: null as number | null,
  },
  {
    key: 'water',
    label: 'Drinking water',
    color: VULPES.teal,
    on: true,
    ids: ['place-water'],
    count: null as number | null,
  },
  {
    key: 'shelter',
    label: 'Shelters',
    color: '#b89cff',
    on: false,
    ids: ['place-shelter'],
    count: null as number | null,
  },
  {
    key: 'hospital',
    label: 'Hospitals',
    color: '#ffffff',
    on: true,
    ids: ['place-hospital'],
    count: null as number | null,
  },
  {
    key: 'fire',
    label: 'Fire stations',
    color: '#ffb547',
    on: false,
    ids: ['place-fire'],
    count: null as number | null,
  },
  {
    key: 'trailhead',
    label: 'Trailheads',
    color: '#8fe388',
    on: true,
    ids: ['place-trailhead'],
    count: null as number | null,
  },
  {
    key: 'viewpoint',
    label: 'Viewpoints',
    color: '#c9c2c6',
    on: false,
    ids: ['place-viewpoint'],
    count: null as number | null,
  },
  {
    key: 'repeaters',
    label: 'Repeaters',
    color: VULPES.magenta,
    on: true,
    ids: ['repeaters', 'repeater-labels'],
    count: null as number | null,
  },
])

const mapEl = ref<HTMLDivElement | null>(null)
let map: maplibregl.Map | null = null
const error = ref('')

const escapeHtml = (s: string) =>
  s.replace(
    /[&<>"']/g,
    (c) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[
        c
      ]!
  )

const applyVisibility = () => {
  if (!map) return
  for (const l of LAYERS)
    for (const id of l.ids)
      if (map.getLayer(id))
        map.setLayoutProperty(id, 'visibility', l.on ? 'visible' : 'none')
}
watch(() => LAYERS.map((l) => l.on), applyVisibility)

// The Protomaps dark flavor, pulled toward the vulpes palette
const vulpesFlavor = {
  ...namedFlavor('dark'),
  background: VULPES.ground,
  earth: '#110e12',
  water: '#0f2a30',
  wood_a: '#121512',
  wood_b: '#121512',
  park_a: '#131613',
  park_b: '#131613',
}

onMounted(async () => {
  const pmtiles = new Protocol()
  maplibregl.addProtocol('pmtiles', pmtiles.tile)
  const dem = new mlcontour.DemSource({
    url: TERRAIN_URL,
    encoding: 'terrarium',
    maxzoom: 13,
    worker: true,
  })
  dem.setupMaplibre(maplibregl)

  map = new maplibregl.Map({
    container: mapEl.value!,
    style: {
      version: 8,
      glyphs: `${ASSETS}/fonts/{fontstack}/{range}.pbf`,
      sprite: `${ASSETS}/sprites/v4/dark`,
      sources: {
        protomaps: {
          type: 'vector',
          url: `pmtiles://${BASEMAP_URL}`,
          attribution:
            '<a href="https://protomaps.com">Protomaps</a> © <a href="https://openstreetmap.org">OpenStreetMap</a>',
        },
      },
      layers: basemapLayers('protomaps', vulpesFlavor, { lang: 'en' }),
    },
    maxZoom: 17,
    center: [-73.97, 41.6],
    zoom: 9.2,
    hash: true, // position lives in the URL, so a view can be shared
    maxBounds: [
      [-75.6, 40.7],
      [-72.6, 42.9],
    ],
    attributionControl: {
      compact: true,
      customAttribution: 'Terrain: Mapzen/AWS Terrarium',
    },
  })
  // Dev only: lets a console or headless test query the live map
  if (import.meta.dev) {
    ;(window as unknown as { __atlas: maplibregl.Map }).__atlas = map
  }
  map.addControl(
    new maplibregl.NavigationControl({ visualizePitch: false }),
    'top-right'
  )
  map.addControl(
    new maplibregl.ScaleControl({ unit: 'imperial' }),
    'bottom-right'
  )

  const data = await $fetch<any>('/api/atlas').catch(() => null)

  map.on('load', () => {
    const m = map!
    const beforeLabels = m
      .getStyle()
      .layers.find((l) => l.type === 'symbol')?.id

    m.addSource('dem', {
      type: 'raster-dem',
      tiles: [TERRAIN_URL],
      tileSize: 256,
      maxzoom: 15,
      encoding: 'terrarium',
    })
    m.addLayer(
      {
        id: 'hillshade',
        type: 'hillshade',
        source: 'dem',
        paint: {
          'hillshade-shadow-color': '#000000',
          'hillshade-highlight-color': '#3a2a35',
          'hillshade-accent-color': '#1a1218',
          'hillshade-exaggeration': 0.45,
        },
      },
      beforeLabels
    )

    m.addSource('contours', {
      type: 'vector',
      tiles: [
        dem.contourProtocolUrl({
          multiplier: 3.28084, // feet
          thresholds: {
            10: [500, 1000],
            11: [200, 1000],
            12: [100, 500],
            14: [50, 200],
            15: [20, 100],
          },
          elevationKey: 'ele',
          levelKey: 'level',
          contourLayer: 'contours',
        }),
      ],
      maxzoom: 15,
    })
    m.addLayer(
      {
        id: 'contour-lines',
        type: 'line',
        source: 'contours',
        'source-layer': 'contours',
        // Terrarium includes river bathymetry; skip sea level and below
        filter: ['>', ['get', 'ele'], 0],
        paint: {
          'line-color': VULPES.teal,
          'line-opacity': ['case', ['==', ['get', 'level'], 1], 0.42, 0.16],
          'line-width': ['case', ['==', ['get', 'level'], 1], 0.9, 0.5],
        },
      },
      beforeLabels
    )
    m.addLayer({
      id: 'contour-labels',
      type: 'symbol',
      source: 'contours',
      'source-layer': 'contours',
      filter: ['all', ['>', ['get', 'level'], 0], ['>', ['get', 'ele'], 0]],
      layout: {
        'symbol-placement': 'line',
        'text-size': 10,
        'text-field': ['concat', ['number-format', ['get', 'ele'], {}], ' ft'],
        'text-font': ['Noto Sans Medium'],
      },
      paint: {
        'text-color': VULPES.teal,
        'text-opacity': 0.8,
        'text-halo-color': VULPES.ground,
        'text-halo-width': 1,
      },
    })

    if (data) {
      m.addSource('rides', { type: 'geojson', data: data.rides })
      m.addLayer({
        id: 'rides',
        type: 'line',
        source: 'rides',
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: {
          'line-color': VULPES.magenta,
          'line-width': ['interpolate', ['linear'], ['zoom'], 8, 1.4, 13, 3],
          'line-opacity': 0.85,
        },
      })

      m.addSource('places', { type: 'geojson', data: data.places })
      for (const l of LAYERS) {
        if (
          ![
            'water',
            'shelter',
            'hospital',
            'fire',
            'trailhead',
            'viewpoint',
          ].includes(l.key)
        )
          continue
        l.count = data.places.features.filter(
          (f: any) => f.properties.cat === l.key
        ).length
        m.addLayer({
          id: `place-${l.key}`,
          type: 'circle',
          source: 'places',
          filter: ['==', ['get', 'cat'], l.key],
          paint: {
            'circle-color': l.color,
            'circle-radius': [
              'interpolate',
              ['linear'],
              ['zoom'],
              8,
              l.key === 'hospital' ? 4 : 2.2,
              14,
              6,
            ],
            'circle-stroke-color': VULPES.ground,
            'circle-stroke-width': 1,
          },
        })
      }

      m.addSource('repeaters', { type: 'geojson', data: data.repeaters })
      m.addLayer({
        id: 'repeaters',
        type: 'circle',
        source: 'repeaters',
        paint: {
          'circle-color': VULPES.ground,
          'circle-stroke-color': VULPES.magenta,
          'circle-stroke-width': 2,
          'circle-radius': 7,
        },
      })
      m.addLayer({
        id: 'repeater-labels',
        type: 'symbol',
        source: 'repeaters',
        layout: {
          'text-field': ['concat', ['get', 'name'], '\n', ['get', 'freq']],
          'text-size': 11,
          'text-offset': [0, 1.6],
          'text-font': ['Noto Sans Medium'],
        },
        paint: {
          'text-color': VULPES.magenta,
          'text-halo-color': VULPES.ground,
          'text-halo-width': 1.2,
        },
      })

      LAYERS.find((l) => l.key === 'rides')!.count = data.rides.features.length
      LAYERS.find((l) => l.key === 'repeaters')!.count =
        data.repeaters.features.length

      const clickable = [
        'rides',
        'repeaters',
        ...LAYERS.filter((l) => l.ids[0].startsWith('place-')).map(
          (l) => l.ids[0]
        ),
      ]
      for (const id of clickable) {
        m.on('mouseenter', id, () => (m.getCanvas().style.cursor = 'pointer'))
        m.on('mouseleave', id, () => (m.getCanvas().style.cursor = ''))
        m.on('click', id, (e) => {
          const f = e.features?.[0]
          if (!f) return
          const p = f.properties as Record<string, string>
          const title = p.title || p.name || p.cat
          const sub =
            id === 'rides'
              ? `<a href="/rides/${escapeHtml(p.slug)}">ride →</a>`
              : id === 'repeaters'
                ? `${escapeHtml(p.freq)} MHz${p.notes ? `<br>${escapeHtml(p.notes)}` : ''}`
                : escapeHtml(p.cat)
          new maplibregl.Popup({ closeButton: false, className: 'atlas-popup' })
            .setLngLat(e.lngLat)
            .setHTML(`<strong>${escapeHtml(title)}</strong><br>${sub}`)
            .addTo(m)
        })
      }
    } else {
      error.value = 'Overlay data failed to load'
    }
    applyVisibility()
  })
})

onBeforeUnmount(() => map?.remove())
</script>

<template>
  <div class="atlas">
    <div ref="mapEl" class="map" />
    <aside class="panel">
      <p class="eyebrow">Hudson Valley · v0</p>
      <h1>Valley Atlas</h1>
      <p class="dek">
        Terrain, rides, water, shelter, help and radio on one map
      </p>
      <ul class="layers">
        <li v-for="l in LAYERS" :key="l.key">
          <label>
            <input :id="`layer-${l.key}`" v-model="l.on" type="checkbox" />
            <span class="swatch" :style="{ background: l.color }" />
            <span class="name">{{ l.label }}</span>
            <span class="count">{{ l.count ?? '' }}</span>
          </label>
        </li>
      </ul>
      <p v-if="error" class="error">{{ error }}</p>
      <p class="fine">
        Points: OpenStreetMap (snapshot). Rides: published only,
        privacy-trimmed. Repeaters: hand-kept list, verify before relying on it
      </p>
    </aside>
  </div>
</template>

<style scoped>
.atlas {
  position: fixed;
  inset: 0;
  background: #0c0a0d;
  color: #e9e4e7;
}
.map {
  position: absolute;
  inset: 0;
}
.panel {
  position: absolute;
  top: calc(env(safe-area-inset-top, 0px) + 16px);
  left: 16px;
  width: min(260px, calc(100vw - 32px));
  max-height: calc(100% - 32px);
  overflow-y: auto;
  padding: 16px;
  background: rgb(12 10 13 / 0.88);
  border: 1px solid #2a2228;
  backdrop-filter: blur(6px);
  font-family: ui-monospace, 'SF Mono', Menlo, monospace;
}
.eyebrow {
  font-size: 10px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: #6eedf7;
}
h1 {
  font-family: 'Vault Alarm', 'Helvetica Neue', Arial, sans-serif;
  font-size: 28px;
  line-height: 1;
  margin: 8px 0 6px;
}
.dek {
  font-family: Georgia, serif;
  font-style: italic;
  font-size: 13px;
  color: #b9b0b6;
  margin-bottom: 12px;
}
.layers {
  display: grid;
  gap: 4px;
  font-size: 12px;
}
.layers label {
  display: grid;
  grid-template-columns: auto 10px 1fr auto;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 2px 0;
}
.layers input {
  accent-color: #e60067;
}
.swatch {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}
.count {
  color: #80767d;
  font-variant-numeric: tabular-nums;
}
.error {
  margin-top: 10px;
  font-size: 12px;
  color: #ff3d8b;
}
.fine {
  margin-top: 12px;
  font-size: 10px;
  line-height: 1.5;
  color: #80767d;
}
:deep(.atlas-popup .maplibregl-popup-content) {
  background: #0c0a0d;
  color: #e9e4e7;
  border: 1px solid #2a2228;
  font:
    12px/1.5 ui-monospace,
    'SF Mono',
    Menlo,
    monospace;
  max-width: 260px;
}
:deep(.atlas-popup .maplibregl-popup-tip) {
  border-top-color: #2a2228;
}
:deep(.atlas-popup a) {
  color: #6eedf7;
}
@media print {
  .panel {
    background: #fff;
    color: #000;
    border-color: #000;
  }
  .layers input {
    display: none;
  }
}
</style>
