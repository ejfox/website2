<!--
  @file StatsSectionSkeleton.vue
  @description Skeleton placeholder for stats sections while data loads.
    When the lite-stats endpoint has already answered (it's ~345B and lands in
    tens of ms), the section's top-line number renders REAL while the detail
    rows keep shimmering — partial data over gray boxes.
  @props title: string - Section title
  @props rows: number - Number of placeholder rows
  @props value: number|string - Optional real top-line value from stats-lite
  @props label: string - Label for the top-line value
-->
<script setup lang="ts">
const props = defineProps<{
  title: string
  rows?: number
  value?: number | string | null
  label?: string
}>()

const rowWidths = [90, 70, 80, 60, 85, 65]

const rows = computed(() => props.rows ?? 4)

const displayValue = computed(() => {
  if (props.value === null || props.value === undefined || props.value === '')
    return null
  return typeof props.value === 'number'
    ? props.value.toLocaleString()
    : props.value
})
</script>

<template>
  <div class="stats-section space-y-4" aria-busy="true">
    <div class="stats-section-title-hover">
      {{ title }}
    </div>
    <div class="space-y-2">
      <!-- Real lite number when available, shimmer block when not -->
      <template v-if="displayValue != null">
        <div
          class="font-mono text-2xl font-bold tabular-nums text-zinc-700 dark:text-zinc-300"
        >
          {{ displayValue }}
        </div>
        <div class="font-mono text-3xs uppercase tracking-wider text-zinc-500">
          {{ label }}
        </div>
      </template>
      <template v-else>
        <div class="skeleton skeleton-shimmer h-8 w-24 rounded"></div>
        <div class="skeleton skeleton-shimmer h-3 w-32 rounded"></div>
      </template>
      <div class="space-y-1.5 pt-2">
        <div
          v-for="index in rows"
          :key="index"
          class="skeleton skeleton-shimmer h-3 rounded"
          :style="{
            width: `${rowWidths[(index - 1) % rowWidths.length]}%`,
            animationDelay: `${(index - 1) * 80}ms`,
          }"
        ></div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.stats-section {
  position: relative;
  padding-left: 2.5rem;
}

.stats-section-title-hover {
  @apply tracking-wider font-mono text-zinc-500;
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%) rotate(-90deg);
  transform-origin: left top;
  font-size: 0.75rem;
  line-height: 1rem;
}

@media (max-width: 640px) {
  .stats-section {
    padding-left: 0;
    padding-right: 0.5rem;
    padding-left: 0.5rem;
  }

  .stats-section-title-hover {
    position: static;
    transform: none;
    margin-bottom: 0.5rem;
    display: block;
  }
}
</style>
