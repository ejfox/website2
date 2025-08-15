<template>
  <div v-if="commitTypes.length">
    <h4 class="section-subheader">
      COMMIT PATTERNS
    </h4>
    <div class="space-y-3">
      <div
        v-for="type in commitTypes.slice(0, 5)"
        :key="type.type"
        class="pattern-row flex items-start gap-2"
      >
        <div
          class="w-3 h-3 mt-1 flex-shrink-0 rounded-sm"
          :class="getTypeClass(type.type)"
        ></div>
        <div class="flex-1">
          <div class="flex justify-between items-center gap-2 min-w-0">
            <span class="text-xs text-zinc-700 dark:text-zinc-300 truncate">{{
              type.type
            }}</span>
            <span class="text-2xs text-zinc-500 tabular-nums flex-shrink-0">{{ type.count }} ({{ Math.round(type.percentage) }}%)</span>
          </div>
          <div class="category-bar-bg mt-1">
            <div
              class="category-bar-fill"
              :class="getTypeClass(type.type)"
              :style="{
                width: `${type.percentage}%`
              }"
            ></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface CommitType {
  type: string
  count: number
  percentage: number
}

interface GitHubStats {
  detail?: {
    commitTypes?: CommitType[]
  }
}

const props = defineProps<{
  stats: GitHubStats
}>()


const commitTypes = computed(() => {
  return props.stats?.detail?.commitTypes || []
})


function getTypeClass(type: string) {
  // Use different zinc shades and patterns for distinction
  const classes = {
    feat: 'bg-zinc-200 dark:bg-zinc-700 text-zinc-800 dark:text-zinc-200',
    fix: 'bg-zinc-300 dark:bg-zinc-600 text-zinc-800 dark:text-zinc-200',
    docs: 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300',
    style: 'bg-zinc-150 dark:bg-zinc-750 text-zinc-700 dark:text-zinc-300',
    refactor: 'bg-zinc-250 dark:bg-zinc-650 text-zinc-800 dark:text-zinc-200',
    test: 'bg-zinc-100 dark:bg-zinc-800/50 text-zinc-600 dark:text-zinc-400',
    chore: 'bg-zinc-100 dark:bg-zinc-900/30 text-zinc-700 dark:text-zinc-300',
    other: 'bg-zinc-100 dark:bg-zinc-800/30 text-zinc-600 dark:text-zinc-400'
  }

  // @ts-expect-error - Type might not be in our predefined map
  return classes[type] || classes.other
}
</script>

<style scoped>
.section-subheader {
  @apply tracking-[0.2em] text-zinc-500 border-b border-zinc-200 dark:border-zinc-800/30 pb-1 mb-3;
  font-size: 0.65rem;
  line-height: 1rem;
}

.category-bar-bg {
  @apply h-1.5 rounded-sm overflow-hidden bg-transparent dark:bg-zinc-800/10 border-b border-zinc-200/10 dark:border-zinc-800/30;
}

.category-bar-fill {
  @apply h-full rounded-sm;
}
</style>