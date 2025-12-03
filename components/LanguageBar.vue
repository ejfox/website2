<script setup>
import { computed } from 'vue'

const props = defineProps({
  languages: {
    type: Object,
    required: true,
  },
  height: {
    type: Number,
    default: 3,
  },
  showLabels: {
    type: Boolean,
    default: false,
  },
})

const languageColors = {
  JavaScript: '#f1e05a',
  TypeScript: '#3178c6',
  Vue: '#41b883',
  Python: '#3572A5',
  Go: '#00ADD8',
  Rust: '#dea584',
  Ruby: '#701516',
  Java: '#b07219',
  HTML: '#e34c26',
  CSS: '#563d7c',
  Shell: '#89e051',
  Swift: '#F05138',
  Kotlin: '#A97BFF',
  Dart: '#00B4AB',
  C: '#555555',
  'C++': '#f34b7d',
  'C#': '#178600',
  Unknown: '#666666',
}

const segments = computed(() => {
  const total = Object.values(props.languages).reduce(
    (sum, val) => sum + val,
    0
  )
  if (total === 0) return []

  let offset = 0
  return Object.entries(props.languages)
    .sort(([, a], [, b]) => b - a)
    .map(([lang, bytes]) => {
      const percentage = (bytes / total) * 100
      const segment = {
        lang,
        bytes,
        percentage,
        color: languageColors[lang] || '#666666',
        offset,
      }
      offset += percentage
      return segment
    })
    .filter((s) => s.percentage > 0.5) // Only show segments > 0.5%
})
</script>

<template>
  <div class="language-bar">
    <!-- Horizontal stacked bar -->
    <div
      class="bar-container"
      :style="{ height: `${height}px` }"
      role="img"
      aria-label="Programming language distribution"
    >
      <div
        v-for="segment in segments"
        :key="segment.lang"
        class="bar-segment"
        :style="{
          backgroundColor: segment.color,
          width: `${segment.percentage}%`,
        }"
        :title="`${segment.lang}: ${segment.percentage.toFixed(1)}%`"
      ></div>
    </div>

    <!-- Optional labels -->
    <div v-if="showLabels" class="labels">
      <div v-for="segment in segments" :key="segment.lang" class="label-item">
        <span
          class="label-dot"
          :style="{ backgroundColor: segment.color }"
        ></span>
        <span class="label-text">
          {{ segment.lang }}
          <span class="label-pct">{{ segment.percentage.toFixed(1) }}%</span>
        </span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.language-bar {
  @apply w-full;
}

.bar-container {
  @apply flex w-full rounded-sm overflow-hidden;
  @apply bg-zinc-200 dark:bg-zinc-800;
}

.bar-segment {
  @apply h-full transition-all duration-300;
}

.labels {
  @apply flex flex-wrap gap-x-3 gap-y-1 mt-2 text-xs font-mono;
}

.label-item {
  @apply flex items-center gap-1;
}

.label-dot {
  @apply w-2 h-2 rounded-full flex-shrink-0;
}

.label-text {
  @apply text-zinc-700 dark:text-zinc-300;
}

.label-pct {
  @apply text-zinc-500 dark:text-zinc-500 ml-1;
}
</style>
