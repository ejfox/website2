<!--
  @file DuolingoStats.vue
  @description Duolingo language learning statistics
  @props stats: Object - Stats data from API
-->
<template>
  <div v-if="duolingo" class="space-y-4 font-mono">
    <!-- Primary Stats -->
    <div class="py-2">
      <div class="text-2xl font-bold">
        <AnimatedNumber
          :value="duolingo.streak"
          format="commas"
          :duration="1200"
          priority="primary"
        />
      </div>
      <div class="section-header-xs mt-2">DUOLINGO DAY STREAK</div>

      <div class="font-mono text-sm text-zinc-600 dark:text-zinc-400 mt-4">
        <AnimatedNumber
          :value="duolingo.totalXp"
          format="commas"
          :duration="1000"
          priority="secondary"
        />
        DUOLINGO TOTAL XP
      </div>
    </div>

    <!-- Current Course -->
    <div v-if="duolingo.currentCourse" class="mt-4">
      <StatsSectionHeader title="DUOLINGO COURSE" />
      <div class="flex items-center gap-2 mt-2">
        <span class="text-lg">
          {{ getLanguageFlag(duolingo.currentCourse.title) }}
        </span>
        <div>
          <div class="text-sm font-medium">
            {{ duolingo.currentCourse.title }}
          </div>
          <div class="text-xs text-zinc-500">
            Level {{ duolingo.currentCourse.level }} &middot;
            {{ duolingo.currentCourse.xp.toLocaleString() }} XP
          </div>
        </div>
      </div>
    </div>

    <!-- All Courses -->
    <div v-if="duolingo.courses?.length > 1">
      <StatsSectionHeader title="DUOLINGO LANGUAGES" />
      <div class="space-y-2 mt-2">
        <div
          v-for="course in duolingo.courses.slice(0, 5)"
          :key="course.title"
          class="flex items-center justify-between text-sm"
        >
          <div class="flex items-center gap-2">
            <span>{{ getLanguageFlag(course.title) }}</span>
            <span class="text-zinc-700 dark:text-zinc-300">
              {{ course.title }}
            </span>
          </div>
          <div class="text-zinc-500 tabular-nums">
            {{ course.xp.toLocaleString() }} XP
          </div>
        </div>
      </div>
    </div>
  </div>
  <StatsDataState
    v-else
    state="unavailable"
    message="DUOLINGO_DATA_UNAVAILABLE"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { StatsResponse } from '~/composables/useStats'
import AnimatedNumber from '../ui/AnimatedNumber.vue'
import StatsSectionHeader from './StatsSectionHeader.vue'
import StatsDataState from './StatsDataState.vue'

const props = defineProps<{
  stats: StatsResponse
}>()

const duolingo = computed(() => props.stats.duolingo)

// Map language names to flag emojis
const languageFlags: Record<string, string> = {
  Spanish: '🇪🇸',
  French: '🇫🇷',
  German: '🇩🇪',
  Italian: '🇮🇹',
  Portuguese: '🇧🇷',
  Japanese: '🇯🇵',
  Korean: '🇰🇷',
  Chinese: '🇨🇳',
  Russian: '🇷🇺',
  Arabic: '🇸🇦',
  Hindi: '🇮🇳',
  Dutch: '🇳🇱',
  Swedish: '🇸🇪',
  Norwegian: '🇳🇴',
  Danish: '🇩🇰',
  Polish: '🇵🇱',
  Turkish: '🇹🇷',
  Greek: '🇬🇷',
  Hebrew: '🇮🇱',
  Vietnamese: '🇻🇳',
  Indonesian: '🇮🇩',
  Ukrainian: '🇺🇦',
  Czech: '🇨🇿',
  Romanian: '🇷🇴',
  Hungarian: '🇭🇺',
  Welsh: '🏴󠁧󠁢󠁷󠁬󠁳󠁿',
  Irish: '🇮🇪',
  Finnish: '🇫🇮',
  Esperanto: '🌍',
  Swahili: '🇰🇪',
  Latin: '🏛️',
  'High Valyrian': '🐉',
  Klingon: '🖖',
}

const getLanguageFlag = (language: string): string => {
  return languageFlags[language] || '🌐'
}
</script>
