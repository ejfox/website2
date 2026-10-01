// Contract for Valley Atlas layer modules (utils/atlas/layers/*.ts).
// pages/atlas.vue owns the map; each module adds its own sources, layers
// and click popups, and describes its legend rows.
import type { Map as MaplibreMap } from 'maplibre-gl'

export const VULPES = {
  ground: '#0c0a0d',
  magenta: '#e60067',
  teal: '#6eedf7',
  ink: '#e9e4e7',
  muted: '#80767d',
} as const

/** One row in the legend; `ids` are the map layer ids it shows/hides */
export interface AtlasToggle {
  key: string
  label: string
  color: string
  on: boolean
  ids: string[]
}

export interface AtlasContext {
  /** First symbol layer id: pass as `beforeId` to keep fills under labels */
  beforeLabels?: string
  escapeHtml: (s: string) => string
  /** Opens the shared popup at a point with trusted HTML */
  popup: (
    lngLat: [number, number] | { lng: number; lat: number },
    html: string
  ) => void
}

export interface AtlasLayerModule {
  toggles: AtlasToggle[]
  /** Add sources/layers/handlers. Resolve with counts keyed by toggle key. */
  add: (map: MaplibreMap, ctx: AtlasContext) => Promise<Record<string, number>>
  /** Optional cleanup (timers, listeners) when the page unmounts */
  dispose?: () => void
}
