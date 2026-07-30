<script setup lang="ts">
import { useElementSize, useElementBounding, useWindowSize } from '@vueuse/core'
import { geoMercator } from 'd3-geo'

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
  // [lon, lat, ele, tSeconds, distMeters]
  points: [number, number, number | null, number | null, number][]
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

const progressPathEl = ref<SVGPathElement | null>(null)
const pathLength = ref(0)
watchEffect(() => {
  if (trackPath.value && progressPathEl.value) {
    pathLength.value = progressPathEl.value.getTotalLength()
  }
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

// ---- formatting ----------------------------------------------------------
const km = (m: number) => (m / 1000).toFixed(1)
const mi = (m: number) => (m / 1609.34).toFixed(1)
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
const photoUrl = (id: string) =>
  id.startsWith('http')
    ? id
    : `https://res.cloudinary.com/ejf/image/upload/w_800,f_auto,q_auto/${id}`

useHead({ title: `${ride.value.title} — Rides — EJ Fox` })
</script>

<template>
  <div v-if="ride" class="ride-page" :style="{ '--ride-accent': accent }">
    <!-- ridehead -->
    <header class="px-4 md:px-8 pt-16 pb-8 max-w-screen-xl">
      <div class="max-w-prose">
        <p
          class="font-mono text-xs text-zinc-500 mb-2 uppercase tracking-wider"
        >
          {{ formatDate(ride.date) }}
          <span v-if="ride.region">· {{ ride.region }}</span>
        </p>
        <h1 class="mb-4">{{ ride.title }}</h1>
        <p v-if="ride.intro" class="font-serif text-zinc-300 mb-6">
          {{ ride.intro }}
        </p>
      </div>
      <dl
        v-if="ride.stats"
        class="flex flex-wrap gap-x-8 gap-y-2 font-mono text-sm text-zinc-400"
      >
        <div>
          <dt class="inline text-zinc-500 dark:text-zinc-600 mr-1">dist</dt>
          <dd class="inline tabular-nums">
            {{ km(ride.stats.distanceMeters) }}km /
            {{ mi(ride.stats.distanceMeters) }}mi
          </dd>
        </div>
        <div v-if="ride.stats.movingSeconds">
          <dt class="inline text-zinc-500 dark:text-zinc-600 mr-1">moving</dt>
          <dd class="inline tabular-nums">
            {{ duration(ride.stats.movingSeconds) }}
          </dd>
        </div>
        <div v-if="ride.stats.elevationGainMeters">
          <dt class="inline text-zinc-500 dark:text-zinc-600 mr-1">climb</dt>
          <dd class="inline tabular-nums">
            {{ ride.stats.elevationGainMeters }}m
          </dd>
        </div>
        <div v-if="ride.stats.avgMovingSpeedMps">
          <dt class="inline text-zinc-500 dark:text-zinc-600 mr-1">avg</dt>
          <dd class="inline tabular-nums">
            {{ mph(ride.stats.avgMovingSpeedMps) }}mph
          </dd>
        </div>
        <div v-if="ride.stats.maxSpeedMps">
          <dt class="inline text-zinc-500 dark:text-zinc-600 mr-1">max</dt>
          <dd class="inline tabular-nums">
            {{ mph(ride.stats.maxSpeedMps) }}mph
          </dd>
        </div>
      </dl>
    </header>

    <!-- scrollytelling track section -->
    <section
      v-if="ride.points.length"
      ref="scrollSection"
      class="relative"
      :style="{ height: sectionHeight }"
    >
      <div class="sticky top-0 h-screen overflow-hidden">
        <div ref="mapContainer" class="absolute inset-0">
          <svg v-if="width > 0" :width="width" :height="height" class="block">
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
              ref="progressPathEl"
              :d="trackPath"
              fill="none"
              stroke="var(--ride-accent)"
              stroke-width="2.5"
              stroke-linejoin="round"
              stroke-linecap="round"
              :stroke-dasharray="pathLength"
              :stroke-dashoffset="pathLength * (1 - progress)"
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

          <!-- live readout -->
          <div
            class="absolute top-4 left-4 md:top-8 md:left-8 font-mono text-xs text-zinc-500 tabular-nums"
          >
            <span class="text-zinc-800 dark:text-zinc-200">
              {{ km(progressDist) }}
            </span>
            / {{ km(totalDist) }}km
            <span v-if="riderEle != null" class="ml-3">
              {{ riderEle }}m ele
            </span>
            <span v-if="riderClock" class="ml-3">{{ riderClock }}</span>
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
              {{ km(currentMoment.distMeters ?? 0) }}km in
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
