// Repeater coverage: terrain line-of-sight rasters baked by
// scripts/build/atlas-coverage.mjs. Each PNG carries two tiers in one hue:
// solid = reachable from a 2 m handheld, faint = only from a 10 m base/mast
// antenna. Not an RF model; see coverage.json `caveat` and `excluded`.
import { VULPES, type AtlasLayerModule } from '../types'

const BASE = '/atlas/coverage'

type Corners = [
  [number, number],
  [number, number],
  [number, number],
  [number, number],
]

interface CoverageMeta {
  coordinates: Corners
  combined: { image: string }
  repeaters: { freq: string; location: string; image: string }[]
}

const addOverlay = (
  map: Parameters<AtlasLayerModule['add']>[0],
  id: string,
  url: string,
  coordinates: Corners,
  beforeId?: string
) => {
  map.addSource(id, { type: 'image', url, coordinates })
  map.addLayer(
    {
      id,
      type: 'raster',
      source: id,
      layout: { visibility: 'none' },
      paint: { 'raster-opacity': 0.55, 'raster-fade-duration': 0 },
    },
    beforeId
  )
}

export const coverageLayer: AtlasLayerModule = {
  toggles: [
    {
      key: 'coverage',
      label: 'Repeater coverage (handheld / base)',
      color: VULPES.teal,
      on: false,
      ids: ['coverage'],
    },
    {
      key: 'coverage-beacon',
      label: 'Mt. Beacon 146.970 coverage',
      color: VULPES.magenta,
      on: false,
      ids: ['coverage-beacon'],
    },
  ],
  add: async (map, ctx) => {
    const meta = await $fetch<CoverageMeta>(`${BASE}/coverage.json`)
    addOverlay(
      map,
      'coverage',
      `${BASE}/${meta.combined.image}`,
      meta.coordinates,
      ctx.beforeLabels
    )
    const beacon = meta.repeaters.find(
      (r) => r.freq === '146.970' && r.location === 'Mt. Beacon'
    )
    if (beacon)
      addOverlay(
        map,
        'coverage-beacon',
        `${BASE}/${beacon.image}`,
        meta.coordinates,
        ctx.beforeLabels
      )
    return {
      coverage: meta.repeaters.length,
      'coverage-beacon': beacon ? 1 : 0,
    }
  },
}
