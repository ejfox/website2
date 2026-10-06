<script setup>
// Engagements per year (roles, clients, fellowships, own projects). Every
// engagement counts toward the bar; only public ones are ever named.
import { ENGAGEMENTS } from '~/utils/careerRecord'

const props = defineProps({
  engagements: { type: Object, default: () => ENGAGEMENTS },
})

const rows = computed(() => {
  const years = Object.keys(props.engagements).map(Number)
  const first = Math.min(...years)
  const last = Math.max(...years)
  const out = []
  for (let y = last; y >= first; y--) {
    const list = props.engagements[y] || []
    out.push({
      year: y,
      count: list.length,
      named: [...new Set(list.filter((e) => e.public).map((e) => e.name))],
    })
  }
  return out
})

const max = computed(() => Math.max(1, ...rows.value.map((r) => r.count)))
const total = computed(() => rows.value.reduce((s, r) => s + r.count, 0))
const span = computed(() => {
  const ys = rows.value.map((r) => r.year)
  return `${Math.min(...ys)}–${Math.max(...ys)}`
})
</script>

<template>
  <section class="mt-16" aria-labelledby="timeline-label">
    <h2 id="timeline-label" class="mono-xs text-secondary mb-4 tracking-wider">
      ENGAGEMENTS PER YEAR
    </h2>
    <ol class="list-none pl-0 m-0">
      <li
        v-for="r in rows"
        :key="r.year"
        class="grid items-center gap-3 py-[3px] mono-xs tabular"
        style="grid-template-columns: 2.75rem 8rem 1fr"
      >
        <span class="text-secondary">{{ r.year }}</span>
        <span class="block h-[5px] bg-zinc-100 dark:bg-zinc-900" aria-hidden>
          <span
            class="block h-full bg-zinc-700 dark:bg-zinc-300"
            :style="{ width: `${(r.count / max) * 100}%` }"
          />
        </span>
        <span class="truncate text-zinc-700 dark:text-zinc-300">
          <span class="sr-only">{{ r.count }} engagements:</span>
          {{ r.named.join(' · ') }}
        </span>
      </li>
    </ol>
    <p class="mt-4 mono-xs text-secondary tabular">
      {{ total }} engagements · {{ span }} · named where public ·
      <NuxtLink to="/projects" class="underline underline-offset-2">
        projects
      </NuxtLink>
    </p>
  </section>
</template>
