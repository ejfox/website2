<!--
  @file DuolingoStats.vue
  @description LANGUAGES section of /stats: day streak, total XP, the course
    being studied, and up to 5 courses by XP, each with a flag emoji.
    Data: server/api/duolingo.get.ts (courses arrive sorted by XP;
    currentCourse falls back to the top-XP course). Wired in pages/stats.vue.
  @props stats: StatsResponse - the WHOLE /api/stats response, not
    stats.duolingo (unlike most siblings); this file reads .duolingo itself.
-->
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

// Keyed by Duolingo's course title (the language name in English). Unknown
// titles get 🌐 via getLanguageFlag.
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

<template>
  <div v-if="duolingo" class="space-y-4 font-mono">
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
            <template v-if="duolingo.currentCourse.level">
              Level {{ duolingo.currentCourse.level }} &middot;
            </template>
            {{ duolingo.currentCourse.xp.toLocaleString() }} XP
          </div>
        </div>
      </div>
    </div>

    <!-- Only worth a list when there's more than the one course shown above -->
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
    type="unavailable"
    message="DUOLINGO_DATA_UNAVAILABLE"
  />
</template>
