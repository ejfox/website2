<script setup lang="ts">
import { useElementSize, useElementBounding, useWindowSize } from '@vueuse/core'
import { geoMercator } from 'd3-geo'
import { interpolateInferno } from 'd3-scale-chromatic'

interface Moment {
  id: number
  type: string
  text: string
  photo: string | null
  audio: string | null
  lon: number | null
  lat: number | null
  distMeters: number | null
  tSeconds: number | null
}
interface Ride {
  slug: string
  title: string
  date: string | null
  region: string | null
  hue: number
  intro: string
  startTime: string | null
  stats: {
    distanceMeters: number
    movingSeconds: number
    elevationGainMeters: number
    avgMovingSpeedMps: number
    maxSpeedMps: number
  } | null
  bounds: {
    minLon: number
    maxLon: number
    minLat: number
    maxLat: number
  } | null
  // [lon, lat, ele, tSeconds, distMeters, speedMps]
  points: [number, number, number | null, number | null, number, number][]
  basemap: {
    waterPolys: [number, number][][]
    rivers: [number, number][][]
    roadsMajor: [number, number][][]
    roadsMinor: [number, number][][]
    rail: [number, number][][]
    places: { name: string; kind: string; lon: number; lat: number }[]
  } | null
  states: [number, number][][] | null
  refuels: { dist: number; lon: number; lat: number }[]
  moments: Moment[]
}

const route = useRoute()
const slug = Array.isArray(route.params.slug)
  ? route.params.slug[0]
  : route.params.slug
const { data: ride } = await useFetch<Ride>(`/api/rides/${slug}`)
if (!ride.value) {
  throw createError({ statusCode: 404, message: 'Ride not found' })
}
// the rest of the atlas, for ghost overlays
const { data: rideIndex } =
  await useFetch<{ slug: string; ghost: [number, number][] | null }[]>(
    '/api/rides'
  )

const accent = computed(() => `hsl(${ride.value?.hue ?? 25} 75% 55%)`)

// ---- formatting ----------------------------------------------------------
const km = (m: number) => (m / 1000).toFixed(1)
const mi = (m: number) => (m / 1609.34).toFixed(1)
const ft = (m: number) => Math.round(m * 3.28084)
const mph = (mps: number) => Math.round(mps * 2.237)
const duration = (s: number) =>
  `${Math.floor(s / 3600)}h${String(Math.floor((s % 3600) / 60)).padStart(2, '0')}m`
const formatDate = (d: string | null) =>
  d
    ? new Date(d).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        timeZone: 'UTC',
      })
    : ''

// ---- map projection ------------------------------------------------------
const ELEV_H = 80
const mapContainer = ref<HTMLElement | null>(null)
const { width, height } = useElementSize(mapContainer)

const projection = computed(() => {
  const b = ride.value?.bounds
  if (!b || width.value === 0 || height.value === 0) return null
  const pad = Math.min(width.value, height.value) * 0.12
  return geoMercator().fitExtent(
    [
      [pad, pad],
      [width.value - pad, height.value - pad - ELEV_H],
    ],
    {
      type: 'LineString',
      coordinates: [
        [b.minLon, b.minLat],
        [b.minLon, b.maxLat],
        [b.maxLon, b.maxLat],
        [b.maxLon, b.minLat],
      ],
    }
  )
})

const projected = computed(() => {
  const proj = projection.value
  if (!proj || !ride.value) return []
  return ride.value.points.map((p) => proj([p[0], p[1]]) as [number, number])
})

/**
 * Catmull-Rom → cubic Bézier: GPS pages arrive as sparse chunks and plain
 * polylines read choppy; splining through neighbors smooths the chain while
 * passing exactly through every recorded point.
 */
type Pt = [number, number]
function crControl(p0: Pt, p1: Pt, p2: Pt, p3: Pt): [Pt, Pt] {
  return [
    [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6],
    [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6],
  ]
}
const f = (n: number) => n.toFixed(1)
function crSegmentD(pts: Pt[], i: number): string {
  // curve from pts[i-1] to pts[i], neighbors as tangent guides
  const p0 = pts[Math.max(0, i - 2)]
  const p1 = pts[i - 1]
  const p2 = pts[i]
  const p3 = pts[Math.min(pts.length - 1, i + 1)]
  const [c1, c2] = crControl(p0, p1, p2, p3)
  return `M${f(p1[0])},${f(p1[1])}C${f(c1[0])},${f(c1[1])} ${f(c2[0])},${f(c2[1])} ${f(p2[0])},${f(p2[1])}`
}

const trackPath = computed(() => {
  const pts = projected.value
  if (pts.length < 2) return ''
  let d = `M${f(pts[0][0])},${f(pts[0][1])}`
  for (let i = 1; i < pts.length; i++) {
    const p0 = pts[Math.max(0, i - 2)]
    const p3 = pts[Math.min(pts.length - 1, i + 1)]
    const [c1, c2] = crControl(p0, pts[i - 1], pts[i], p3)
    d += `C${f(c1[0])},${f(c1[1])} ${f(c2[0])},${f(c2[1])} ${f(pts[i][0])},${f(pts[i][1])}`
  }
  return d
})

/** Ghosts of every other ride — where else I've been, dotted and faint. */
const ghostPath = computed(() => {
  const proj = projection.value
  if (!proj || !rideIndex.value) return ''
  let d = ''
  for (const r of rideIndex.value) {
    if (r.slug === slug || !r.ghost?.length) continue
    d += r.ghost
      .map((c, i) => {
        const p = proj(c) as [number, number]
        return `${i === 0 ? 'M' : 'L'}${p[0].toFixed(1)},${p[1].toFixed(1)}`
      })
      .join('')
  }
  return d
})

// ---- scroll → ride progress ---------------------------------------------
const scrollSection = ref<HTMLElement | null>(null)
const { top, height: sectionPx } = useElementBounding(scrollSection)
const { height: winH } = useWindowSize()

const sectionHeight = computed(() => {
  const momentCount = ride.value?.moments.length ?? 0
  return `${250 + momentCount * 50}vh`
})

const progress = computed(() => {
  const scrollable = sectionPx.value - winH.value
  if (scrollable <= 0) return 0
  return Math.min(1, Math.max(0, -top.value / scrollable))
})

const totalDist = computed(() => ride.value?.stats?.distanceMeters ?? 0)
const progressDist = computed(() => progress.value * totalDist.value)

/** Index of the track point at the current traveled distance. */
const riderIndex = computed(() => {
  const pts = ride.value?.points
  if (!pts?.length) return 0
  const target = progressDist.value
  let lo = 0
  let hi = pts.length - 1
  while (lo < hi) {
    const mid = (lo + hi) >> 1
    if (pts[mid][4] < target) lo = mid + 1
    else hi = mid
  }
  return lo
})

/**
 * The ridden path as per-segment strokes: color encodes smoothed speed
 * (muted → full accent within the ride's hue), width encodes elevation.
 */
interface Seg {
  d: string
  color: string
  w: number
  mph: number
}

const segmentData = computed<{ segs: Seg[]; maxMph: number }>(() => {
  const pts = ride.value?.points
  const proj = projected.value
  if (!pts || pts.length < 2 || proj.length !== pts.length) {
    return { segs: [], maxMph: 0 }
  }

  // speeds are precomputed in the pipeline on the full-res track (8s window)
  // and shipped per point — never re-derived from simplified geometry
  const speeds: number[] = []
  for (let i = 1; i < pts.length; i++) speeds.push(pts[i][5] ?? 0)
  // color ramp saturates at the 95th percentile so one hot straight doesn't
  // flatten everything; the readout still reports true point speed
  const sorted = [...speeds].sort((a, b) => a - b)
  const vMax = sorted[Math.floor(sorted.length * 0.95)] || 1
  // recovered tracks may carry no timestamps at all — flat accent, no ramp
  const hasSpeeds = sorted[sorted.length - 1] > 0.5

  const eles = pts.map((p) => p[2]).filter((e): e is number => e !== null)
  const minE = eles.length ? Math.min(...eles) : 0
  const maxE = eles.length ? Math.max(...eles) : 1
  const eSpan = maxE - minE || 1

  const segs: Seg[] = []
  for (let i = 1; i < pts.length; i++) {
    const t = Math.min(1, speeds[i - 1] / vMax)
    const ele = pts[i][2] ?? minE
    segs.push({
      d: crSegmentD(proj, i),
      color: hasSpeeds ? speedColor(t) : 'var(--ride-accent)',
      w: +(1.25 + ((ele - minE) / eSpan) * 2.75).toFixed(2),
      mph: Math.round(speeds[i - 1] * 2.237),
    })
  }
  return { segs, maxMph: hasSpeeds ? Math.round(vMax * 2.237) : 0 }
})

/** Perceptual speed ramp: inferno, clamped off the near-black tail. */
function speedColor(t: number) {
  return interpolateInferno(0.2 + Math.min(1, Math.max(0, t)) * 0.72)
}

const speedLegendGradient = computed(() => {
  const stops = Array.from(
    { length: 7 },
    (_, i) => `${speedColor(i / 6)} ${Math.round((i / 6) * 100)}%`
  )
  return `linear-gradient(to right, ${stops.join(', ')})`
})

const riddenSegments = computed(() =>
  segmentData.value.segs.slice(0, riderIndex.value)
)
const riderMph = computed(() => {
  if (!segmentData.value.maxMph) return null
  return segmentData.value.segs[Math.max(0, riderIndex.value - 1)]?.mph ?? null
})

const headerStats = computed(() => {
  const s = ride.value?.stats
  if (!s) return []
  const out = [
    {
      label: `distance · ${km(s.distanceMeters)} km`,
      value: mi(s.distanceMeters),
      unit: ' mi',
    },
  ]
  if (s.movingSeconds) {
    out.push({ label: 'moving', value: duration(s.movingSeconds), unit: '' })
  }
  if (s.elevationGainMeters) {
    out.push({
      label: 'climb',
      value: String(ft(s.elevationGainMeters)),
      unit: ' ft',
    })
  }
  if (s.avgMovingSpeedMps) {
    out.push({
      label: 'avg speed',
      value: String(mph(s.avgMovingSpeedMps)),
      unit: ' mph',
    })
  }
  if (s.maxSpeedMps) {
    out.push({
      label: 'max speed',
      value: String(mph(s.maxSpeedMps)),
      unit: ' mph',
    })
  }
  return out
})

// Inferred fuel: full tank at start, burned by distance, reset at detected
// gas-station stops (OSM amenity=fuel + dwell). If the tank would run dry
// with no recorded stop, wrap — an unrecorded fill happened somewhere.
// Versys-X 300: 4.5 gal tank, ~56 mpg real-world. Estimate, and says so.
const TANK_GAL = 4.5
const MPG = 56
const RANGE_M = TANK_GAL * MPG * 1609.34
const fuel = computed(() => {
  const d = progressDist.value
  let lastFill = 0
  let recordedFills = 0
  for (const r of ride.value?.refuels ?? []) {
    if (r.dist <= d && r.dist > lastFill) {
      lastFill = r.dist
      recordedFills++
    }
  }
  const sinceRaw = d - lastFill
  const impliedFills = Math.floor(sinceRaw / RANGE_M)
  const since = sinceRaw - impliedFills * RANGE_M
  const gal = TANK_GAL - since / 1609.34 / MPG
  const frac = Math.max(0, gal / TANK_GAL)
  const blocks = 10
  const filled = Math.round(frac * blocks)
  return {
    bar: '▮'.repeat(filled) + '▯'.repeat(blocks - filled),
    gal: gal.toFixed(1),
    fills: recordedFills + impliedFills,
  }
})

const refuelMarkers = computed(() => {
  const proj = projection.value
  if (!proj || !ride.value) return []
  return ride.value.refuels.map((r) => {
    const [x, y] = proj([r.lon, r.lat]) as [number, number]
    return { ...r, x, y, passed: r.dist <= progressDist.value }
  })
})

const riderPoint = computed(() => projected.value[riderIndex.value] ?? null)

// ---- camera: zoom in and follow the rider through the middle of the ride
const followZoom = computed(() => {
  const b = ride.value?.bounds
  if (!b) return 1
  const ext = Math.max(
    haversineMeters([b.minLon, b.minLat], [b.maxLon, b.minLat]),
    haversineMeters([b.minLon, b.minLat], [b.minLon, b.maxLat])
  )
  return Math.min(6, Math.max(1.5, ext / 15000))
})
const smoothstep = (t: number) => t * t * (3 - 2 * t)
const zoom = computed(() => {
  const p = progress.value
  const Z = followZoom.value
  if (p < 0.12) return 1 + (Z - 1) * smoothstep(p / 0.12)
  if (p > 0.88) return 1 + (Z - 1) * smoothstep((1 - p) / 0.12)
  return Z
})
const cameraTransform = computed(() => {
  const z = zoom.value
  const w = width.value
  const h = height.value
  const r = riderPoint.value ?? [w / 2, h / 2]
  // clamp the camera inside the plate so margins never show
  const cx = Math.min(Math.max(r[0], w / (2 * z)), w - w / (2 * z))
  const cy = Math.min(Math.max(r[1], h / (2 * z)), h - h / (2 * z))
  return `translate(${(w / 2 - z * cx).toFixed(1)}px, ${(h / 2 - z * cy).toFixed(1)}px) scale(${z.toFixed(3)})`
})
const riderEle = computed(
  () => ride.value?.points[riderIndex.value]?.[2] ?? null
)
const riderClock = computed(() => {
  const t = ride.value?.points[riderIndex.value]?.[3]
  const start = ride.value?.startTime
  if (t === null || t === undefined || !start) return null
  return new Date(Date.parse(start) + t * 1000).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  })
})

// ---- basemap -------------------------------------------------------------
/** One `d` string per layer: all segments concatenated into a single path. */
function layerPath(segments: [number, number][][] | undefined, close = false) {
  const proj = projection.value
  if (!proj || !segments?.length) return ''
  let d = ''
  for (const seg of segments) {
    d += seg
      .map((c, i) => {
        const p = proj(c) as [number, number]
        return `${i === 0 ? 'M' : 'L'}${p[0].toFixed(1)},${p[1].toFixed(1)}`
      })
      .join('')
    if (close) d += 'Z'
  }
  return d
}

const waterPath = computed(() =>
  layerPath(ride.value?.basemap?.waterPolys, true)
)
const riverPath = computed(() => layerPath(ride.value?.basemap?.rivers))
const roadsMajorPath = computed(() =>
  layerPath(ride.value?.basemap?.roadsMajor)
)
const roadsMinorPath = computed(() =>
  layerPath(ride.value?.basemap?.roadsMinor)
)
const railPath = computed(() => layerPath(ride.value?.basemap?.rail))
const statesPath = computed(() => layerPath(ride.value?.states ?? undefined))

/** Fog of war: only places the route actually came near get named. */
const nearTrack = computed(() => {
  const pts = ride.value?.points
  const b = ride.value?.bounds
  if (!pts?.length || !b) return () => true
  const cosLat = Math.cos((((b.minLat + b.maxLat) / 2) * Math.PI) / 180)
  const extent = Math.max((b.maxLon - b.minLon) * cosLat, b.maxLat - b.minLat)
  // ~3km floor, widening on big plates so labels don't vanish entirely
  const thresh = Math.max(0.03, extent * 0.035)
  const t2 = thresh * thresh
  const sample: [number, number][] = []
  const step = Math.max(1, Math.floor(pts.length / 300))
  for (let i = 0; i < pts.length; i += step) {
    sample.push([pts[i][0], pts[i][1]])
  }
  return (lon: number, lat: number) => {
    for (const s of sample) {
      const dx = (s[0] - lon) * cosLat
      const dy = s[1] - lat
      if (dx * dx + dy * dy < t2) return true
    }
    return false
  }
})

const placeLabels = computed(() => {
  const proj = projection.value
  const places = ride.value?.basemap?.places
  if (!proj || !places) return []
  const rank: Record<string, number> = { city: 0, town: 1, village: 2 }
  const near = nearTrack.value
  const candidates = places
    .filter((p) => p.kind !== 'hamlet' && near(p.lon, p.lat))
    .map((p) => {
      const [x, y] = proj([p.lon, p.lat]) as [number, number]
      return { ...p, x, y, major: p.kind === 'city' || p.kind === 'town' }
    })
    .filter(
      (p) =>
        p.x > 16 &&
        p.x < width.value - 72 &&
        p.y > 16 &&
        p.y < height.value - 96
    )
    .sort((a, b) => (rank[a.kind] ?? 3) - (rank[b.kind] ?? 3))
  // greedy declutter: bigger places claim space first, overlaps get hidden
  const PAD = 6
  const placed: { x1: number; y1: number; x2: number; y2: number }[] = []
  const out: typeof candidates = []
  for (const p of candidates) {
    const w = 10 + p.name.length * (p.major ? 6.8 : 5.6)
    const h = 14
    const box = {
      x1: p.x - PAD,
      y1: p.y - h / 2 - PAD,
      x2: p.x + w + PAD,
      y2: p.y + h / 2 + PAD,
    }
    const collides = placed.some(
      (b) => box.x1 < b.x2 && box.x2 > b.x1 && box.y1 < b.y2 && box.y2 > b.y1
    )
    if (!collides) {
      placed.push(box)
      out.push(p)
    }
  }
  return out
})

/** Graticule ticks: adaptive step so a frame gets ~5 per axis, not 60. */
const GRAT_STEPS = [0.05, 0.1, 0.25, 0.5, 1, 2]
const pickStep = (span: number, target: number) =>
  GRAT_STEPS.find((s) => span / s <= target) ?? 2
const graticule = computed(() => {
  const proj = projection.value
  if (!proj || width.value === 0) return { lonTicks: [], latTicks: [] }
  const inv = (x: number, y: number) =>
    proj.invert?.([x, y]) as [number, number]
  const [w, h] = [width.value, height.value]
  const [lonL] = inv(0, h / 2)
  const [lonR] = inv(w, h / 2)
  const [, latT] = inv(w / 2, 0)
  const [, latB] = inv(w / 2, h)
  const lonStep = pickStep(lonR - lonL, 8)
  const latStep = pickStep(latT - latB, 6)
  const lonTicks = []
  for (
    let lon = Math.ceil(lonL / lonStep) * lonStep;
    lon < lonR;
    lon += lonStep
  ) {
    lonTicks.push({
      x: (proj([lon, latB]) as [number, number])[0],
      label: dms(lon, 'lon'),
    })
  }
  const latTicks = []
  for (
    let lat = Math.ceil(latB / latStep) * latStep;
    lat < latT;
    lat += latStep
  ) {
    latTicks.push({
      y: (proj([lonL, lat]) as [number, number])[1],
      label: dms(lat, 'lat'),
    })
  }
  return { lonTicks, latTicks }
})

function dms(deg: number, axis: 'lon' | 'lat') {
  const hemi = axis === 'lon' ? (deg < 0 ? 'W' : 'E') : deg < 0 ? 'S' : 'N'
  const a = Math.abs(deg)
  const d = Math.floor(a)
  const m = Math.round((a - d) * 60)
  return `${d}°${String(m).padStart(2, '0')}′${hemi}`
}

/** A clean scale bar: nice round km sized off the projection's real scale. */
const scaleBar = computed(() => {
  const proj = projection.value
  if (!proj?.invert || width.value === 0) return null
  const y = height.value / 2
  const a = proj.invert([width.value / 2, y]) as [number, number]
  const b = proj.invert([width.value / 2 + 100, y]) as [number, number]
  const metersPer100px = haversineMeters(a, b) / zoom.value
  if (!metersPer100px) return null
  const MILE = 1609.34
  const targetM = metersPer100px * 1.4 // aim for a ~140px bar
  const nice = [1, 2, 5, 10].reduce((best, n) =>
    Math.abs(n * MILE - targetM) < Math.abs(best * MILE - targetM) ? n : best
  )
  return { px: ((nice * MILE) / metersPer100px) * 100, label: `${nice} mi` }
})

function haversineMeters(a: [number, number], b: [number, number]) {
  const toRad = (d: number) => (d * Math.PI) / 180
  const dLat = toRad(b[1] - a[1])
  const dLon = toRad(b[0] - a[0])
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a[1])) * Math.cos(toRad(b[1])) * Math.sin(dLon / 2) ** 2
  return 2 * 6371000 * Math.asin(Math.sqrt(h))
}

// ---- moments -------------------------------------------------------------
const placedMoments = computed(() => {
  const proj = projection.value
  if (!proj || !ride.value) return []
  return ride.value.moments
    .filter((m) => m.lon !== null && m.lat !== null)
    .map((m) => {
      const [x, y] = proj([m.lon as number, m.lat as number]) as [
        number,
        number,
      ]
      return {
        ...m,
        x,
        y,
        active: (m.distMeters ?? 0) <= progressDist.value,
      }
    })
})

/** The most recently passed moment — the card shown on screen. */
const currentMoment = computed(() => {
  const passed = (ride.value?.moments ?? []).filter(
    (m) => m.distMeters !== null && m.distMeters <= progressDist.value
  )
  return passed.length ? passed[passed.length - 1] : null
})

// ---- elevation profile ---------------------------------------------------
const elevationPath = computed(() => {
  const pts = ride.value?.points
  if (!pts?.length || width.value === 0) return ''
  const eles = pts.map((p) => p[2]).filter((e): e is number => e !== null)
  if (!eles.length) return ''
  const minE = Math.min(...eles)
  const maxE = Math.max(...eles)
  const span = maxE - minE || 1
  const total = totalDist.value || 1
  let d = `M0,${ELEV_H}`
  for (const p of pts) {
    if (p[2] === null) continue
    const x = (p[4] / total) * width.value
    const y = ELEV_H - ((p[2] - minE) / span) * (ELEV_H - 8)
    d += `L${x.toFixed(1)},${y.toFixed(1)}`
  }
  d += `L${width.value},${ELEV_H}Z`
  return d
})

const photoUrl = (id: string) =>
  id.startsWith('http')
    ? id
    : `https://res.cloudinary.com/ejf/image/upload/w_800,f_auto,q_auto/${id}`

useHead({ title: `${ride.value.title} — Rides — EJ Fox` })
</script>

<template>
  <div v-if="ride" class="ride-page" :style="{ '--ride-accent': accent }">
    <!-- ridehead -->
    <header class="px-4 md:px-8 pt-8 pb-12 max-w-screen-xl">
      <NuxtLink
        to="/rides"
        class="font-mono text-3xs uppercase tracking-widest text-zinc-400 dark:text-zinc-600 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors"
      >
        ← rides
      </NuxtLink>
      <p class="post-metadata mt-4">
        <span>{{ formatDate(ride.date) }}</span>
        <span v-if="ride.region">·</span>
        <span v-if="ride.region">{{ ride.region }}</span>
      </p>
      <h1
        class="mt-2 text-3xl md:text-4xl font-light tracking-tight text-zinc-900 dark:text-zinc-100"
      >
        {{ ride.title }}
      </h1>
      <p v-if="ride.intro" class="post-dek">
        {{ ride.intro }}
      </p>
      <dl
        v-if="ride.stats"
        class="mt-8 flex flex-wrap gap-x-10 gap-y-6 font-mono"
      >
        <div
          v-for="stat in headerStats"
          :key="stat.label"
          class="flex flex-col"
        >
          <dt
            class="order-2 mt-1 text-3xs uppercase tracking-widest text-zinc-400 dark:text-zinc-600"
          >
            {{ stat.label }}
          </dt>
          <dd
            class="order-1 text-base tabular-nums text-zinc-700 dark:text-zinc-300"
          >
            {{ stat.value }}
            <span class="text-xs text-zinc-400 dark:text-zinc-600">
              {{ stat.unit }}
            </span>
          </dd>
        </div>
      </dl>
    </header>

    <!-- scrollytelling track section -->
    <section
      v-if="ride.points.length"
      ref="scrollSection"
      class="relative"
      :style="{ height: sectionHeight, overflowAnchor: 'none' }"
    >
      <div class="sticky top-0 h-screen overflow-hidden">
        <div ref="mapContainer" class="absolute inset-0">
          <svg v-if="width > 0" :width="width" :height="height" class="block">
            <!-- camera group: zooms in and follows the rider mid-ride -->
            <g
              :style="{
                transform: cameraTransform,
                transformOrigin: '0 0',
                transition: 'transform 200ms cubic-bezier(0.25, 0.1, 0.25, 1)',
              }"
            >
              <!-- basemap: water, rail, roads — quiet layers under the ride -->
              <path
                v-if="waterPath"
                :d="waterPath"
                fill="currentColor"
                fill-rule="evenodd"
                class="text-sky-100 dark:text-sky-950/60"
              />
              <path
                v-if="riverPath"
                :d="riverPath"
                fill="none"
                stroke="currentColor"
                stroke-width="1"
                stroke-linecap="round"
                vector-effect="non-scaling-stroke"
                class="text-sky-200 dark:text-sky-900/70"
              />
              <path
                v-if="railPath"
                :d="railPath"
                fill="none"
                stroke="currentColor"
                stroke-width="0.75"
                stroke-dasharray="1 4"
                vector-effect="non-scaling-stroke"
                class="text-zinc-400/70 dark:text-zinc-600/70"
              />
              <path
                v-if="roadsMinorPath"
                :d="roadsMinorPath"
                fill="none"
                stroke="currentColor"
                stroke-width="0.5"
                vector-effect="non-scaling-stroke"
                class="text-zinc-300/80 dark:text-zinc-800"
              />
              <path
                v-if="roadsMajorPath"
                :d="roadsMajorPath"
                fill="none"
                stroke="currentColor"
                stroke-width="1"
                vector-effect="non-scaling-stroke"
                class="text-zinc-300 dark:text-zinc-700/80"
              />
              <!-- state boundaries -->
              <path
                v-if="statesPath"
                :d="statesPath"
                fill="none"
                stroke="currentColor"
                stroke-width="1"
                stroke-dasharray="7 3 2 3"
                class="text-zinc-400 dark:text-zinc-500"
                vector-effect="non-scaling-stroke"
              />
              <!-- ghosts of other rides: where else I've been -->
              <path
                v-if="ghostPath"
                :d="ghostPath"
                fill="none"
                stroke="currentColor"
                stroke-width="1"
                stroke-dasharray="1 5"
                stroke-linecap="round"
                class="text-zinc-400/50 dark:text-zinc-600/40"
                vector-effect="non-scaling-stroke"
              />
              <!-- place labels: sizes divided by zoom stay constant -->
              <g
                v-for="p in placeLabels"
                :key="p.name"
                class="text-zinc-400 dark:text-zinc-600"
              >
                <circle
                  :cx="p.x"
                  :cy="p.y"
                  :r="1.5 / zoom"
                  fill="currentColor"
                />
                <text
                  :x="p.x + 5 / zoom"
                  :y="p.y + 3 / zoom"
                  fill="currentColor"
                  class="font-mono uppercase"
                  :style="{
                    fontSize: `${(p.major ? 10 : 8) / zoom}px`,
                    letterSpacing: p.major ? '0.14em' : '0.1em',
                    opacity: p.major ? 1 : 0.75,
                  }"
                >
                  {{ p.name }}
                </text>
              </g>
            </g>
            <!-- graticule: frame furniture, fades while zoomed -->
            <g
              class="text-zinc-400/80 dark:text-zinc-600/80 font-mono"
              :style="{
                opacity: zoom > 1.05 ? 0 : 1,
                transition: 'opacity 300ms',
              }"
            >
              <g v-for="t in graticule.lonTicks" :key="'lon' + t.label">
                <line :x1="t.x" :x2="t.x" y1="0" y2="6" stroke="currentColor" />
                <text
                  :x="t.x + 4"
                  y="14"
                  fill="currentColor"
                  style="font-size: 8px; letter-spacing: 0.08em"
                >
                  {{ t.label }}
                </text>
              </g>
              <g v-for="t in graticule.latTicks" :key="'lat' + t.label">
                <line x1="0" x2="6" :y1="t.y" :y2="t.y" stroke="currentColor" />
                <text
                  x="9"
                  :y="t.y + 3"
                  fill="currentColor"
                  style="font-size: 8px; letter-spacing: 0.08em"
                >
                  {{ t.label }}
                </text>
              </g>
            </g>
            <g
              :style="{
                transform: cameraTransform,
                transformOrigin: '0 0',
                transition: 'transform 200ms cubic-bezier(0.25, 0.1, 0.25, 1)',
              }"
            >
              <!-- full route, faint -->
              <path
                :d="trackPath"
                fill="none"
                stroke="currentColor"
                class="text-zinc-300 dark:text-zinc-700"
                stroke-width="1.5"
                stroke-linejoin="round"
                stroke-linecap="round"
                vector-effect="non-scaling-stroke"
              />
              <!-- traversed route, accent -->
              <path
                v-for="(s, i) in riddenSegments"
                :key="i"
                :d="s.d"
                fill="none"
                :stroke="s.color"
                :stroke-width="s.w"
                stroke-linecap="round"
                vector-effect="non-scaling-stroke"
              />
              <!-- refuel stops -->
              <g
                v-for="(r, i) in refuelMarkers"
                :key="'fuel' + i"
                class="text-zinc-400 dark:text-zinc-600"
                :opacity="r.passed ? 1 : 0.4"
              >
                <rect
                  :x="r.x - 3 / zoom"
                  :y="r.y - 3 / zoom"
                  :width="6 / zoom"
                  :height="6 / zoom"
                  fill="none"
                  stroke="currentColor"
                  :stroke-width="1 / zoom"
                />
                <text
                  :x="r.x + 6 / zoom"
                  :y="r.y + 2.5 / zoom"
                  fill="currentColor"
                  class="font-mono uppercase"
                  :style="{ fontSize: `${7 / zoom}px`, letterSpacing: '0.1em' }"
                >
                  fuel
                </text>
              </g>
              <!-- moment markers -->
              <circle
                v-for="m in placedMoments"
                :key="m.id"
                :cx="m.x"
                :cy="m.y"
                :r="(m.active ? 5 : 3) / zoom"
                :fill="m.active ? 'var(--ride-accent)' : 'currentColor'"
                class="text-zinc-400 dark:text-zinc-600 transition-all duration-300"
              />
              <!-- rider -->
              <circle
                v-if="riderPoint"
                :cx="riderPoint[0]"
                :cy="riderPoint[1]"
                :r="6 / zoom"
                fill="var(--ride-accent)"
                stroke="currentColor"
                class="text-zinc-50 dark:text-zinc-950"
                :stroke-width="2 / zoom"
              />
            </g>
          </svg>

          <!-- live readout: the instrument chip -->
          <div
            class="absolute top-4 left-4 md:top-8 md:left-8 font-mono tabular-nums bg-white/80 dark:bg-zinc-950/80 backdrop-blur border border-zinc-200 dark:border-zinc-800 px-3 py-2"
          >
            <div class="flex items-baseline gap-x-4 text-2xs">
              <span>
                <span class="text-zinc-900 dark:text-zinc-100">
                  {{ mi(progressDist) }}
                </span>
                <span class="text-zinc-400 dark:text-zinc-600">
                  / {{ mi(totalDist) }} mi
                </span>
              </span>
              <span
                v-if="riderMph !== null"
                class="text-zinc-700 dark:text-zinc-300"
              >
                {{ riderMph }} mph
              </span>
              <span
                v-if="riderEle !== null"
                class="text-zinc-500 dark:text-zinc-500"
              >
                {{ ft(riderEle) }} ft
              </span>
              <span v-if="riderClock" class="text-zinc-500 dark:text-zinc-500">
                {{ riderClock }}
              </span>
            </div>
            <div
              class="mt-1.5 flex items-baseline gap-x-2 text-3xs text-zinc-400 dark:text-zinc-600"
            >
              <span class="uppercase tracking-widest">fuel</span>
              <span class="tracking-tight text-zinc-600 dark:text-zinc-400">
                {{ fuel.bar }}
              </span>
              <span>~{{ fuel.gal }} gal est</span>
              <span v-if="fuel.fills">
                · {{ fuel.fills }} fill{{ fuel.fills > 1 ? 's' : '' }}
              </span>
            </div>
          </div>

          <!-- map furniture: scale bar, north arrow, attribution -->
          <div
            v-if="scaleBar"
            class="absolute left-4 md:left-8 font-mono text-zinc-500 dark:text-zinc-500"
            :style="{ bottom: ELEV_H + 16 + 'px' }"
          >
            <div
              class="h-px bg-current mb-1 relative"
              :style="{ width: scaleBar.px + 'px' }"
            >
              <span class="absolute left-0 -top-1 w-px h-2 bg-current" />
              <span class="absolute right-0 -top-1 w-px h-2 bg-current" />
            </div>
            <span style="font-size: 9px; letter-spacing: 0.1em">
              {{ scaleBar.label }}
            </span>
            <div v-if="segmentData.maxMph" class="mt-2">
              <div
                class="h-1 mb-1"
                :style="{ width: '72px', background: speedLegendGradient }"
              />
              <span style="font-size: 8px; letter-spacing: 0.1em">
                0–{{ segmentData.maxMph }}+ mph · thick = high ground
              </span>
            </div>
          </div>
          <div
            class="absolute top-4 right-4 md:top-8 md:right-8 font-mono text-zinc-400 dark:text-zinc-600 text-center select-none"
          >
            <div style="font-size: 12px">↑</div>
            <div style="font-size: 9px; letter-spacing: 0.2em">N</div>
          </div>
          <div
            class="absolute right-4 md:right-8 font-mono text-zinc-400/70 dark:text-zinc-700"
            :style="{
              bottom: ELEV_H + 16 + 'px',
              fontSize: '8px',
              letterSpacing: '0.06em',
            }"
          >
            map data © openstreetmap
          </div>

          <!-- elevation profile -->
          <svg
            v-if="width > 0 && elevationPath"
            :width="width"
            :height="ELEV_H"
            class="absolute bottom-0 left-0"
          >
            <path
              :d="elevationPath"
              fill="currentColor"
              class="text-zinc-300/70 dark:text-zinc-800/80"
            />
            <line
              :x1="progress * width"
              :x2="progress * width"
              y1="0"
              :y2="ELEV_H"
              stroke="var(--ride-accent)"
              stroke-width="1"
            />
          </svg>
        </div>

        <!-- moment card, shown for the currently-nearest active moment -->
        <transition name="moment">
          <article
            v-if="currentMoment"
            :key="currentMoment.id"
            class="absolute bottom-24 right-4 md:right-8 w-72 md:w-80 bg-white/90 dark:bg-zinc-900/90 backdrop-blur border border-zinc-200 dark:border-zinc-800 p-4"
          >
            <img
              v-if="currentMoment.photo"
              :src="photoUrl(currentMoment.photo)"
              :alt="currentMoment.text || 'ride photo'"
              class="w-full mb-3"
              loading="lazy"
            />
            <audio
              v-if="currentMoment.audio"
              :src="currentMoment.audio"
              controls
              class="w-full mb-3"
            />
            <p
              v-if="currentMoment.text"
              class="font-serif text-sm text-zinc-800 dark:text-zinc-200"
            >
              {{ currentMoment.text }}
            </p>
            <p class="font-mono text-3xs text-zinc-500 mt-2 tabular-nums">
              {{ mi(currentMoment.distMeters ?? 0) }} mi in
            </p>
          </article>
        </transition>
      </div>
    </section>

    <footer class="px-4 md:px-8 py-16 max-w-screen-xl">
      <NuxtLink
        to="/rides"
        class="font-mono text-sm text-zinc-400 hover:text-zinc-100"
      >
        ← all rides
      </NuxtLink>
    </footer>
  </div>
</template>

<style scoped>
.moment-enter-active,
.moment-leave-active {
  transition:
    opacity 0.3s,
    transform 0.3s;
}
.moment-enter-from,
.moment-leave-to {
  opacity: 0;
  transform: translateY(8px);
}
</style>
