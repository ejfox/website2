<!--
  @file StatsSectionSkeleton.vue
  @description Skeleton placeholder for stats sections while data loads
  @props title: string - Section title
  @props rows: number - Number of placeholder rows
-->
<template>
  <div class="stats-section space-y-4">
    <div class="stats-section-title-hover">
      {{ title }}
    </div>
    <div class="space-y-2">
      <div class="skeleton h-8 w-24 rounded"></div>
      <div class="skeleton h-3 w-32 rounded"></div>
      <div class="space-y-1.5 pt-2">
        <div
          v-for="index in rows"
          :key="index"
          class="skeleton h-3 rounded"
          :style="{ width: `${rowWidths[(index - 1) % rowWidths.length]}%` }"
        ></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  title: string
  rows?: number
}>()

const rowWidths = [90, 70, 80, 60, 85, 65]

const rows = computed(() => props.rows ?? 4)
</script>

<style scoped>
.stats-section {
  position: relative;
  padding-left: 2.5rem;
}

.stats-section-title-hover {
  @apply tracking-[0.24em] font-mono text-zinc-500;
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
