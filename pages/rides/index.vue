<script setup lang="ts">
import { geoMercator } from 'd3-geo'
import { useElementSize } from '@vueuse/core'

interface Atlas {
  bounds: { minLon: number; maxLon: number; minLat: number; maxLat: number }
  totalMeters: number
  rideCount: number
  states: [number, number][][] | null
  rides: { slug: string; title: string; ghost: [number, number][] | null }[]
}

interface RideIndexEntry {
  slug: string
  title: string
  date: string | null
  region: string | null
  momentCount: number
  startTime: string | null
  stats: {
    distanceMeters: number
    movingSeconds: number
    elevationGainMeters: number
    avgMovingSpeedMps: number
    maxSpeedMps: number
  } | null
  thumb: [number, number][] | null
  extentMeters: number | null
  elev: number[] | null
  spdHist: number[] | null
  outlines: [number, number][][] | null
}

const { data } = await useFetch<RideIndexEntry[]>('/api/rides')
const rides = computed(() => data.value ?? [])
const { data: atlas } = await useFetch<Atlas | null>('/api/rides-atlas')

// ---- the atlas: every ride on one quiet plate ----------------------------
const atlasEl = ref<HTMLElement | null>(null)
const { width: atlasW } = useElementSize(atlasEl)
const atlasH = computed(() => {
  const b = atlas.value?.bounds
  if (!b || !atlasW.value) return 0
  const cosLat = Math.cos((((b.minLat + b.maxLat) / 2) * Math.PI) / 180)
  const aspect = (b.maxLat - b.minLat) / ((b.maxLon - b.minLon) * cosLat || 1)
  return Math.round(Math.min(atlasW.value * aspect, atlasW.value * 1.1))
})
const atlasProj = computed(() => {
  const b = atlas.value?.bounds
  if (!b || !atlasW.value || !atlasH.value) return null
  return geoMercator().fitExtent(
    [
      [16, 16],
      [atlasW.value - 16, atlasH.value - 16],
    ],
    {
      type: 'LineString',
      coordinates: [
        [b.minLon, b.minLat],
        [b.maxLon, b.maxLat],
      ],
    }
  )
})
const atlasLine = (coords: [number, number][] | null) => {
  const proj = atlasProj.value
  if (!proj || !coords?.length) return ''
  return coords
    .map((c, i) => {
      const p = proj(c) as [number, number]
      return `${i === 0 ? 'M' : 'L'}${p[0].toFixed(1)},${p[1].toFixed(1)}`
    })
    .join('')
}
const atlasStates = computed(() =>
  (atlas.value?.states ?? []).map(atlasLine).join('')
)

const trackPoints = (r: RideIndexEntry) =>
  (r.thumb ?? []).map((p) => `${p[0]},${p[1]}`).join(' ')

const elevPoints = (r: RideIndexEntry) => {
  const e = r.elev
  if (!e?.length) return ''
  return e
    .map((v, i) => `${(i / (e.length - 1)).toFixed(3)},${(1 - v).toFixed(2)}`)
    .join(' ')
}

const mi = (m: number) => (m / 1609.34).toFixed(1)
const ft = (m: number) => Math.round(m * 3.28084)
const mph = (mps: number) => Math.round(mps * 2.237)
const duration = (s: number) =>
  `${Math.floor(s / 3600)}h${String(Math.floor((s % 3600) / 60)).padStart(2, '0')}m`
const startClock = (iso: string | null) =>
  iso
    ? new Date(iso).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        timeZone: 'America/New_York',
      })
    : null
const formatDate = (d: string | null) =>
  d
    ? new Date(d).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        timeZone: 'UTC',
      })
    : ''

useHead({ title: 'Rides — EJ Fox' })
</script>

<template>
  <div class="px-4 md:px-8 pt-8 pb-16 max-w-screen-xl">
    <header class="mb-12 max-w-prose">
      <h1 class="text-3xl md:text-4xl font-light tracking-tight mb-3">Rides</h1>
      <p class="font-serif text-zinc-600 dark:text-zinc-400">
        Motorcycle rides as recorded — GPS traces, photographs, field
        recordings, and the short notes I managed to write down.
      </p>
    </header>

    <div
      v-if="rides.length"
      class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 pt-px pl-px"
    >
      <NuxtLink
        v-for="ride in rides"
        :key="ride.slug"
        :to="`/rides/${ride.slug}`"
        class="group block bg-white dark:bg-zinc-950 p-4 border border-zinc-200 dark:border-zinc-800 -mt-px -ml-px"
      >
        <!-- track shape, common scale -->
        <svg
          v-if="ride.thumb"
          viewBox="-0.05 -0.05 1.1 1.1"
          class="w-full aspect-square"
        >
          <polyline
            v-for="(seg, i) in ride.outlines ?? []"
            :key="'st' + i"
            :points="seg.map((p) => p.join(',')).join(' ')"
            fill="none"
            stroke="currentColor"
            class="text-zinc-300 dark:text-zinc-700"
            stroke-width="0.006"
            stroke-dasharray="0.02 0.01"
          />
          <polyline
            :points="trackPoints(ride)"
            fill="none"
            stroke="currentColor"
            class="text-zinc-400 group-hover:text-zinc-900 dark:text-zinc-600 dark:group-hover:text-zinc-100 transition-colors"
            stroke-width="0.014"
            stroke-linejoin="round"
            stroke-linecap="round"
          />
        </svg>

        <!-- micrographics: elevation strip + speed histogram -->
        <div class="mt-2 flex items-end gap-2">
          <svg
            v-if="ride.elev?.length"
            viewBox="0 -0.1 1 1.2"
            preserveAspectRatio="none"
            class="h-4 flex-1 text-zinc-300 dark:text-zinc-700"
          >
            <polyline
              :points="elevPoints(ride)"
              fill="none"
              stroke="currentColor"
              stroke-width="1"
              vector-effect="non-scaling-stroke"
            />
          </svg>
          <svg
            v-if="ride.spdHist?.length"
            viewBox="0 0 16 8"
            preserveAspectRatio="none"
            class="h-4 w-12 text-zinc-300 dark:text-zinc-700"
          >
            <rect
              v-for="(b, i) in ride.spdHist"
              :key="i"
              :x="i"
              :y="8 - b * 8"
              width="0.8"
              :height="b * 8"
              fill="currentColor"
            />
          </svg>
        </div>
        <div
          v-if="ride.elev?.length || ride.spdHist?.length"
          class="flex justify-between font-mono text-4xs uppercase tracking-wider text-zinc-300 dark:text-zinc-700"
        >
          <span>{{ ride.elev?.length ? 'elev' : '' }}</span>
          <span>{{ ride.spdHist?.length ? 'speed' : '' }}</span>
        </div>

        <!-- metadata -->
        <h2
          class="mt-3 font-mono text-2xs uppercase tracking-wider text-zinc-700 dark:text-zinc-300 truncate"
        >
          {{ ride.title }}
        </h2>
        <p
          class="mt-1 font-mono text-3xs tabular-nums text-zinc-400 dark:text-zinc-600"
        >
          {{ formatDate(ride.date) }}
          <template v-if="startClock(ride.startTime)">
            · {{ startClock(ride.startTime) }}
          </template>
        </p>
        <p
          v-if="ride.stats"
          class="mt-0.5 font-mono text-3xs tabular-nums text-zinc-400 dark:text-zinc-600"
        >
          {{ mi(ride.stats.distanceMeters) }} mi
          <template v-if="ride.stats.elevationGainMeters">
            · ↗{{ ft(ride.stats.elevationGainMeters) }} ft
          </template>
          <template v-if="ride.stats.movingSeconds">
            · {{ duration(ride.stats.movingSeconds) }}
          </template>
        </p>
        <p
          v-if="ride.stats?.avgMovingSpeedMps || ride.momentCount"
          class="mt-0.5 font-mono text-3xs tabular-nums text-zinc-400 dark:text-zinc-600"
        >
          <template v-if="ride.stats?.avgMovingSpeedMps">
            {{ mph(ride.stats.avgMovingSpeedMps) }} avg /
            {{ mph(ride.stats.maxSpeedMps) }} max mph
          </template>
          <template v-if="ride.momentCount">
            · {{ ride.momentCount }} moments
          </template>
        </p>
      </NuxtLink>
    </div>
    <p v-else class="font-mono text-sm text-zinc-500">
      No rides processed yet.
    </p>

    <!-- the atlas: everywhere so far, one quiet plate -->
    <section v-if="atlas" ref="atlasEl" class="mt-24">
      <svg v-if="atlasProj" :width="atlasW" :height="atlasH" class="block">
        <path
          v-if="atlasStates"
          :d="atlasStates"
          fill="none"
          stroke="currentColor"
          stroke-width="0.75"
          stroke-dasharray="5 3"
          class="text-zinc-200 dark:text-zinc-800"
        />
        <path
          v-for="r in atlas.rides"
          :key="r.slug"
          :d="atlasLine(r.ghost)"
          fill="none"
          stroke="currentColor"
          stroke-width="1"
          stroke-linecap="round"
          class="text-zinc-400 dark:text-zinc-600 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors cursor-pointer"
          @click="navigateTo(`/rides/${r.slug}`)"
        >
          <title>{{ r.title }}</title>
        </path>
      </svg>
      <p
        class="mt-2 font-mono text-3xs uppercase tracking-widest text-zinc-400 dark:text-zinc-600"
      >
        everywhere so far · {{ atlas.rideCount }} rides ·
        {{ Math.round(atlas.totalMeters / 1609.34).toLocaleString() }} miles
      </p>
    </section>
  </div>
</template>
