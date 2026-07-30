<script setup lang="ts">
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
}

const { data } = await useFetch<RideIndexEntry[]>('/api/rides')
const rides = computed(() => data.value ?? [])

// Every ride renders at the same geographic scale: a cell's unit box equals
// the largest ride's footprint; smaller rides shrink toward their center.
const maxExtent = computed(() =>
  Math.max(1, ...rides.value.map((r) => r.extentMeters ?? 1))
)

const trackPoints = (r: RideIndexEntry) => {
  const s = (r.extentMeters ?? maxExtent.value) / maxExtent.value
  const off = (1 - s) / 2
  return (r.thumb ?? [])
    .map((p) => `${(off + p[0] * s).toFixed(3)},${(off + p[1] * s).toFixed(3)}`)
    .join(' ')
}

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
  <div class="px-4 md:px-8 py-16 max-w-screen-xl">
    <header class="mb-12 max-w-prose">
      <h1 class="text-3xl md:text-4xl font-light tracking-tight mb-3">Rides</h1>
      <p class="font-serif text-zinc-600 dark:text-zinc-400">
        Motorcycle rides as recorded — GPS traces, photographs, field
        recordings, and the short notes I managed to write down.
      </p>
      <p
        v-if="rides.length > 1"
        class="mt-2 font-mono text-3xs uppercase tracking-widest text-zinc-400 dark:text-zinc-600"
      >
        all rides drawn at the same scale
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
          class="flex justify-between font-mono text-4xs uppercase tracking-wider text-zinc-300 dark:text-zinc-700"
        >
          <span>elev</span>
          <span>speed</span>
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
          {{ mi(ride.stats.distanceMeters) }} mi · ↗{{
            ft(ride.stats.elevationGainMeters)
          }}
          ft ·
          {{ duration(ride.stats.movingSeconds) }}
        </p>
        <p
          v-if="ride.stats"
          class="mt-0.5 font-mono text-3xs tabular-nums text-zinc-400 dark:text-zinc-600"
        >
          {{ mph(ride.stats.avgMovingSpeedMps) }} avg /
          {{ mph(ride.stats.maxSpeedMps) }} max mph
          <template v-if="ride.momentCount">
            · {{ ride.momentCount }} moments
          </template>
        </p>
      </NuxtLink>
    </div>
    <p v-else class="font-mono text-sm text-zinc-500">
      No rides processed yet.
    </p>
  </div>
</template>
