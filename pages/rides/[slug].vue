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

const trackPath = computed(() => {
  if (!projected.value.length) return ''
  return (
    'M' +
    projected.value
      .map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`)
      .join('L')
  )
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

  const eles = pts.map((p) => p[2]).filter((e): e is number => e !== null)
  const minE = eles.length ? Math.min(...eles) : 0
  const maxE = eles.length ? Math.max(...eles) : 1
  const eSpan = maxE - minE || 1

  const segs: Seg[] = []
  for (let i = 1; i < pts.length; i++) {
    const t = Math.min(1, speeds[i - 1] / vMax)
    const ele = pts[i][2] ?? minE
    const [a, b] = [proj[i - 1], proj[i]]
    segs.push({
      d: `M${a[0].toFixed(1)},${a[1].toFixed(1)}L${b[0].toFixed(1)},${b[1].toFixed(1)}`,
      color: speedColor(t),
      w: +(1.25 + ((ele - minE) / eSpan) * 2.75).toFixed(2),
      mph: Math.round(speeds[i - 1] * 2.237),
    })
  }
  return { segs, maxMph: Math.round(vMax * 2.237) }
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
const riderMph = computed(
  () => segmentData.value.segs[Math.max(0, riderIndex.value - 1)]?.mph ?? null
)

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

// Inferred fuel state: full tank at ride start, burned by distance.
// Versys-X 300: 4.5 gal tank, ~56 mpg real-world. Estimate, and says so.
const TANK_GAL = 4.5
const MPG = 56
const fuel = computed(() => {
  const used = progressDist.value / 1609.34 / MPG
  const frac = Math.max(0, 1 - used / TANK_GAL)
  const blocks = 10
  const filled = Math.round(frac * blocks)
  return {
    bar: '▮'.repeat(filled) + '▯'.repeat(blocks - filled),
    gal: (TANK_GAL - used).toFixed(1),
  }
})

const riderPoint = computed(() => projected.value[riderIndex.value] ?? null)
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

const placeLabels = computed(() => {
  const proj = projection.value
  const places = ride.value?.basemap?.places
  if (!proj || !places) return []
  return places
    .filter((p) => p.kind !== 'hamlet')
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
})

/** Graticule ticks along the frame edges, labeled in degrees + minutes. */
const GRAT_STEP = 0.05
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
  const lonTicks = []
  for (
    let lon = Math.ceil(lonL / GRAT_STEP) * GRAT_STEP;
    lon < lonR;
    lon += GRAT_STEP
  ) {
    lonTicks.push({
      x: (proj([lon, latB]) as [number, number])[0],
      label: dms(lon, 'lon'),
    })
  }
  const latTicks = []
  for (
    let lat = Math.ceil(latB / GRAT_STEP) * GRAT_STEP;
    lat < latT;
    lat += GRAT_STEP
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
  const metersPer100px = haversineMeters(a, b)
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
    <header class="px-4 md:px-8 pt-16 pb-12 max-w-screen-xl">
      <p class="post-metadata">
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
              class="text-sky-200 dark:text-sky-900/70"
            />
            <path
              v-if="railPath"
              :d="railPath"
              fill="none"
              stroke="currentColor"
              stroke-width="0.75"
              stroke-dasharray="1 4"
              class="text-zinc-400/70 dark:text-zinc-600/70"
            />
            <path
              v-if="roadsMinorPath"
              :d="roadsMinorPath"
              fill="none"
              stroke="currentColor"
              stroke-width="0.5"
              class="text-zinc-300/80 dark:text-zinc-800"
            />
            <path
              v-if="roadsMajorPath"
              :d="roadsMajorPath"
              fill="none"
              stroke="currentColor"
              stroke-width="1"
              class="text-zinc-300 dark:text-zinc-700/80"
            />
            <!-- place labels -->
            <g
              v-for="p in placeLabels"
              :key="p.name"
              class="text-zinc-400 dark:text-zinc-600"
            >
              <circle :cx="p.x" :cy="p.y" r="1.5" fill="currentColor" />
              <text
                :x="p.x + 5"
                :y="p.y + 3"
                fill="currentColor"
                class="font-mono uppercase"
                :style="{
                  fontSize: p.major ? '10px' : '8px',
                  letterSpacing: p.major ? '0.14em' : '0.1em',
                  opacity: p.major ? 1 : 0.75,
                }"
              >
                {{ p.name }}
              </text>
            </g>
            <!-- graticule ticks -->
            <g class="text-zinc-400/80 dark:text-zinc-600/80 font-mono">
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
            <!-- full route, faint -->
            <path
              :d="trackPath"
              fill="none"
              stroke="currentColor"
              class="text-zinc-300 dark:text-zinc-700"
              stroke-width="1.5"
              stroke-linejoin="round"
              stroke-linecap="round"
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
            />
            <!-- moment markers -->
            <circle
              v-for="m in placedMoments"
              :key="m.id"
              :cx="m.x"
              :cy="m.y"
              :r="m.active ? 5 : 3"
              :fill="m.active ? 'var(--ride-accent)' : 'currentColor'"
              class="text-zinc-400 dark:text-zinc-600 transition-all duration-300"
            />
            <!-- rider -->
            <circle
              v-if="riderPoint"
              :cx="riderPoint[0]"
              :cy="riderPoint[1]"
              r="6"
              fill="var(--ride-accent)"
              stroke="currentColor"
              class="text-zinc-50 dark:text-zinc-950"
              stroke-width="2"
            />
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
