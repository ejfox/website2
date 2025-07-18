<template>
  <aside class="fixed top-0 right-0 w-80 h-screen overflow-y-auto p-4 font-mono text-xs bg-zinc-50/95 dark:bg-zinc-900/95 backdrop-blur border-l border-zinc-200 dark:border-zinc-800 z-40">
    <!-- Sidebar Header -->
    <div class="pb-3 mb-6 border-b border-zinc-300 dark:border-zinc-700">
      <h3 class="mb-2 text-xs tracking-[0.2em] text-zinc-500">
        REAL-TIME METRICS
      </h3>
      <div class="text-[10px] text-zinc-400">
        {{ currentTime }}
      </div>
    </div>

    <!-- Mini Health Dashboard -->
    <section v-if="stats.health" class="mb-6">
      <h4 class="text-[10px] tracking-wider text-zinc-600 dark:text-zinc-400 mb-2">
        TODAY
      </h4>
      <div class="grid grid-cols-2 gap-2 mb-3">
        <div class="p-2 bg-zinc-100 dark:bg-zinc-800 rounded">
          <div class="text-lg font-bold tabular-nums">
            {{ formatCompact(healthToday.steps) }}
          </div>
          <div class="text-[9px] text-zinc-500">
            STEPS
          </div>
        </div>
        <div class="p-2 bg-zinc-100 dark:bg-zinc-800 rounded">
          <div class="text-lg font-bold tabular-nums">
            {{ healthToday.exerciseMinutes }}
          </div>
          <div class="text-[9px] text-zinc-500">
            EXERCISE MIN
          </div>
        </div>
      </div>
      
      <!-- 7-day step sparkline -->
      <div class="mb-3">
        <div class="mb-1 text-[9px] text-zinc-500">
          7-DAY STEPS
        </div>
        <div class="flex items-end h-8 gap-0.5">
          <div 
            v-for="(steps, i) in last7DaysSteps" 
            :key="i"
            class="flex-1 min-h-[2px] bg-zinc-400 dark:bg-zinc-600 rounded-t"
            :style="{ height: `${(steps / maxSteps) * 100}%` }"
            :title="`${steps} steps`"
          ></div>
        </div>
      </div>
    </section>

    <!-- GitHub Activity Pulse -->
    <section v-if="stats.github" class="mb-6">
      <h4 class="text-[10px] tracking-wider text-zinc-600 dark:text-zinc-400 mb-2">
        CODE ACTIVITY
      </h4>
      <div class="flex items-baseline justify-between mb-2">
        <div>
          <div class="text-lg font-bold tabular-nums">
            {{ stats.github.stats.totalContributions }}
          </div>
          <div class="text-[9px] text-zinc-500">
            TOTAL COMMITS
          </div>
        </div>
        <div class="text-right">
          <div class="text-sm font-bold tabular-nums">
            {{ todayContributions }}
          </div>
          <div class="text-[9px] text-zinc-500">
            TODAY
          </div>
        </div>
      </div>
      
      <!-- Commit type breakdown pie chart -->
      <div class="mb-2">
        <div class="mb-1 text-[9px] text-zinc-500">
          COMMIT TYPES
        </div>
        <div class="flex h-2 overflow-hidden rounded">
          <div 
            v-for="commitType in topCommitTypes" 
            :key="commitType.type"
            :class="getCommitTypeColor(commitType.type)"
            :style="{ width: `${commitType.percentage}%` }"
            :title="`${commitType.type}: ${commitType.count} (${commitType.percentage.toFixed(1)}%)`"
          ></div>
        </div>
      </div>
    </section>

    <!-- Typing Performance -->
    <section v-if="stats.monkeyType" class="mb-6">
      <h4 class="text-[10px] tracking-wider text-zinc-600 dark:text-zinc-400 mb-2">
        TYPING
      </h4>
      <div class="grid grid-cols-2 gap-2">
        <div>
          <div class="text-lg font-bold tabular-nums">
            {{ Math.round(stats.monkeyType.typingStats.averageWpm) }}
          </div>
          <div class="text-[9px] text-zinc-500">
            AVG WPM
          </div>
        </div>
        <div>
          <div class="text-lg font-bold tabular-nums">
            {{ Math.round(stats.monkeyType.typingStats.averageAccuracy) }}%
          </div>
          <div class="text-[9px] text-zinc-500">
            ACCURACY
          </div>
        </div>
      </div>
    </section>

    <!-- Chess Performance -->
    <section v-if="stats.chess" class="mb-6">
      <h4 class="text-[10px] tracking-wider text-zinc-600 dark:text-zinc-400 mb-2">
        CHESS
      </h4>
      <div class="space-y-2">
        <div class="flex justify-between">
          <span class="text-[9px] text-zinc-500">BLITZ</span>
          <span class="font-bold tabular-nums">{{ stats.chess.currentRating.blitz }}</span>
        </div>
        <div class="flex justify-between">
          <span class="text-[9px] text-zinc-500">RAPID</span>
          <span class="font-bold tabular-nums">{{ stats.chess.currentRating.rapid }}</span>
        </div>
        <div class="flex justify-between">
          <span class="text-[9px] text-zinc-500">WIN RATE</span>
          <span class="font-bold tabular-nums">{{ Math.round(stats.chess.winRate.overall) }}%</span>
        </div>
      </div>
    </section>

    <!-- Music Listening -->
    <section v-if="stats.lastfm" class="mb-6">
      <h4 class="text-[10px] tracking-wider text-zinc-600 dark:text-zinc-400 mb-2">
        MUSIC
      </h4>
      <div>
        <div class="text-lg font-bold tabular-nums">
          {{ formatCompact(stats.lastfm.totalScrobbles || 0) }}
        </div>
        <div class="text-[9px] text-zinc-500">
          TOTAL SCROBBLES
        </div>
      </div>
      
      <!-- Recent tracks mini list -->
      <div v-if="stats.lastfm.recentTracks" class="mt-2 space-y-1">
        <div class="text-[9px] text-zinc-500 mb-1">
          RECENT
        </div>
        <div 
          v-for="track in (stats.lastfm.recentTracks || []).slice(0, 3)" 
          :key="track.name"
          class="text-[8px] text-zinc-600 dark:text-zinc-400 truncate"
        >
          {{ track.artist }} - {{ track.name }}
        </div>
      </div>
    </section>

    <!-- System Stats -->
    <section class="mb-6">
      <h4 class="text-[10px] tracking-wider text-zinc-600 dark:text-zinc-400 mb-2">
        SYSTEM
      </h4>
      <div class="space-y-1 text-[9px]">
        <div class="flex justify-between">
          <span class="text-zinc-500">VIEWPORT</span>
          <span class="tabular-nums">{{ windowWidth }}×{{ windowHeight }}</span>
        </div>
        <div class="flex justify-between">
          <span class="text-zinc-500">CONNECTION</span>
          <span>{{ connectionType }}</span>
        </div>
        <div class="flex justify-between">
          <span class="text-zinc-500">BATTERY</span>
          <span class="tabular-nums">{{ batteryLevel }}%</span>
        </div>
      </div>
    </section>

    <!-- Data Freshness -->
    <section class="border-t border-zinc-300 dark:border-zinc-700 pt-3">
      <h4 class="text-[10px] tracking-wider text-zinc-600 dark:text-zinc-400 mb-2">
        DATA STATUS
      </h4>
      <div class="space-y-1 text-[9px]">
        <div class="flex justify-between items-center">
          <span class="text-zinc-500">GITHUB</span>
          <div class="flex items-center gap-1">
            <div class="w-1.5 h-1.5 rounded-full bg-green-500"></div>
            <span class="text-zinc-400">{{ timeSince(stats.github?.lastUpdated) }}</span>
          </div>
        </div>
        <div class="flex justify-between items-center">
          <span class="text-zinc-500">HEALTH</span>
          <div class="flex items-center gap-1">
            <div class="w-1.5 h-1.5 rounded-full bg-green-500"></div>
            <span class="text-zinc-400">{{ timeSince(stats.health?.lastUpdated) }}</span>
          </div>
        </div>
      </div>
    </section>
  </aside>
</template>

<script setup>
import { computed, ref, onMounted } from 'vue'
import { useWindowSize } from '@vueuse/core'
import { format } from 'd3-format'

const props = defineProps({
  stats: {
    type: Object,
    required: true
  },
  healthToday: {
    type: Object,
    default: () => ({ steps: 0, exerciseMinutes: 0 })
  }
})

const { width: windowWidth, height: windowHeight } = useWindowSize()

// Real-time clock
const currentTime = ref('')
const updateTime = () => {
  const now = new Date()
  currentTime.value = now.toLocaleTimeString('en-US', { 
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

onMounted(() => {
  updateTime()
  setInterval(updateTime, 1000)
})

// Formatters
const formatCompact = format('.1~s')

// Health data processing
const last7DaysSteps = computed(() => {
  if (!props.stats.health?.trends?.daily?.steps) return []
  return props.stats.health.trends.daily.steps.slice(-7)
})

const maxSteps = computed(() => {
  return Math.max(...last7DaysSteps.value, 1)
})

// GitHub data processing
const todayContributions = computed(() => {
  if (!props.stats.github?.contributions) return 0
  return props.stats.github.contributions[props.stats.github.contributions.length - 1] || 0
})

const topCommitTypes = computed(() => {
  if (!props.stats.github?.detail?.commitTypes) return []
  return props.stats.github.detail.commitTypes.slice(0, 5)
})

const getCommitTypeColor = (type) => {
  const colors = {
    feat: 'bg-green-500',
    fix: 'bg-red-500', 
    chore: 'bg-gray-500',
    docs: 'bg-blue-500',
    style: 'bg-purple-500',
    refactor: 'bg-yellow-500',
    test: 'bg-orange-500',
    other: 'bg-zinc-500'
  }
  return colors[type] || colors.other
}

// System info
const connectionType = computed(() => {
  if (typeof navigator !== 'undefined' && navigator.connection) {
    return navigator.connection.effectiveType || 'unknown'
  }
  return 'unknown'
})

const batteryLevel = ref(100)

onMounted(async () => {
  if (typeof navigator !== 'undefined' && 'getBattery' in navigator) {
    try {
      const battery = await navigator.getBattery()
      batteryLevel.value = Math.round(battery.level * 100)
      
      battery.addEventListener('levelchange', () => {
        batteryLevel.value = Math.round(battery.level * 100)
      })
    } catch (_e) {
      // Battery API not supported
    }
  }
})

// Utility functions
const timeSince = (timestamp) => {
  if (!timestamp) return 'unknown'
  const now = new Date()
  const then = new Date(timestamp)
  const diffMinutes = Math.floor((now - then) / (1000 * 60))
  
  if (diffMinutes < 1) return 'now'
  if (diffMinutes < 60) return `${diffMinutes}m`
  if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}h`
  return `${Math.floor(diffMinutes / 1440)}d`
}
</script>