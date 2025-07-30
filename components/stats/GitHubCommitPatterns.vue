<template>
  <div v-if="commitTypes.length" ref="patternsRef">
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
import { computed, ref, onMounted, nextTick } from 'vue'
import { animate, stagger as _stagger, onScroll } from '~/anime.esm.js'
import { useAnimations } from '~/composables/useAnimations'

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

const { timing, easing, staggers } = useAnimations()

const commitTypes = computed(() => {
  return props.stats?.detail?.commitTypes || []
})

// Animation refs
const patternsRef = ref<HTMLElement | null>(null)

// Epic commit patterns scroll-triggered animations using anime.js onScroll
const setupScrollAnimations = () => {
  if (process.server) return
  
  nextTick(() => {
    if (!patternsRef.value || !commitTypes.value.length) return

    // Header reveal on scroll
    const header = patternsRef.value.querySelector('.section-subheader')
    if (header) {
      animate(header, {
        opacity: [0, 1],
        translateX: [-10, 0],
        scale: [0.9, 1],
        duration: timing.slow,
        ease: easing.standard,
        autoplay: onScroll({
          target: header,
          onEnter: () => true
        })
      })
    }
    
    // Pattern rows cascade on scroll
    const patternRows = patternsRef.value.querySelectorAll('.pattern-row')
    if (patternRows.length) {
      animate(Array.from(patternRows), {
        opacity: [0, 1],
        translateY: [15, 0],
        scale: [0.95, 1.02, 1],
        duration: timing.slow,
        delay: _stagger(staggers.tight),
        ease: easing.productive,
        autoplay: onScroll({
          target: patternRows[0],
          onEnter: () => true
        })
      })
    }
    
    // Epic bar growth animation with stagger on scroll
    const bars = patternsRef.value.querySelectorAll('.category-bar-fill')
    if (bars.length) {
      animate(Array.from(bars), {
        scaleX: [0, 1.1, 1],
        scaleY: [0.3, 1.2, 1],
        duration: timing.expressive,
        delay: _stagger(staggers.normal, { from: 'first' }),
        ease: easing.bounce,
        autoplay: onScroll({
          target: bars[0],
          onEnter: () => true
        })
      })
    }
  })
}

onMounted(() => {
  setupScrollAnimations()
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