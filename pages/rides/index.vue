<script setup lang="ts">
interface RideIndexEntry {
  slug: string
  title: string
  date: string | null
  region: string | null
  stats: { distanceMeters: number; elevationGainMeters: number } | null
  thumb: [number, number][] | null
}

const { data } = await useFetch<RideIndexEntry[]>('/api/rides')
const rides = computed(() => data.value ?? [])

const mi = (m: number) => (m / 1609.34).toFixed(1)
const ft = (m: number) => Math.round(m * 3.28084)
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
    <header class="mb-16 max-w-prose">
      <h1 class="mb-4">Rides</h1>
      <p class="font-serif text-zinc-400">
        Motorcycle rides as recorded — GPS traces, photographs, field
        recordings, and the short notes I managed to write down.
      </p>
    </header>

    <div
      v-if="rides.length"
      class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
    >
      <NuxtLink
        v-for="ride in rides"
        :key="ride.slug"
        :to="`/rides/${ride.slug}`"
        class="group block border border-zinc-800 hover:border-zinc-600 transition-colors p-4"
      >
        <svg
          v-if="ride.thumb"
          viewBox="-0.1 -0.1 1.2 1.2"
          class="w-full aspect-square mb-4"
        >
          <polyline
            :points="ride.thumb.map((p) => p.join(',')).join(' ')"
            fill="none"
            stroke="currentColor"
            class="text-zinc-500 group-hover:text-zinc-200 transition-colors"
            stroke-width="0.012"
            stroke-linejoin="round"
            stroke-linecap="round"
          />
        </svg>
        <h2 class="text-lg mb-1">{{ ride.title }}</h2>
        <div class="font-mono text-xs text-zinc-500 space-x-3">
          <span>{{ formatDate(ride.date) }}</span>
          <span v-if="ride.stats">{{ mi(ride.stats.distanceMeters) }} mi</span>
          <span v-if="ride.stats?.elevationGainMeters">
            ↗ {{ ft(ride.stats.elevationGainMeters) }}ft
          </span>
        </div>
      </NuxtLink>
    </div>
    <p v-else class="font-mono text-sm text-zinc-500">
      No rides processed yet.
    </p>
  </div>
</template>
