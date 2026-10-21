<!--
  @file ActivityCalendar.vue
  @description Activity calendar heatmap showing daily activity over a period
  @props title: string - Calendar title (optional)
  @props activityData: Array - Array of daily activity data with active boolean
  @props days: number - Number of days to display
  @props activeColor: string - Color for active days
-->
<script setup lang="ts">
import { computed, ref } from 'vue'
import { format } from '~/utils/date'
import StatsSectionHeader from './StatsSectionHeader.vue'

interface ActivityDay {
  date: string
  active: boolean
}

const props = defineProps({
  days: {
    type: Number,
    default: 30,
  },
  title: {
    type: String,
    default: 'ACTIVITY',
  },
  // Color for active days
  activeColor: {
    type: String,
    default: '#71717a',
  },
  // Array of active dates in YYYY-MM-DD format
  activeDates: {
    type: Array as () => string[],
    default: () => [],
  },
  // Alternative: manually provide activity data
  customActivityData: {
    type: Array as () => ActivityDay[],
    default: null,
  },
})

const activeTooltipIndex = ref<number | null>(null)

const showTooltip = (index: number) => {
  activeTooltipIndex.value = index
}

const hideTooltip = () => {
  activeTooltipIndex.value = null
}

const formatTooltip = (day: ActivityDay) => {
  const date = new Date(day.date)
  const formattedDate = format(date, 'MMMM d, yyyy')
  return day.active ? `${formattedDate}: Active` : formattedDate
}

const activityData = computed<ActivityDay[]>(() => {
  if (props.customActivityData) {
    return props.customActivityData
  }

  const days = Array(props.days)
    .fill(null)
    .map((_, i) => {
      const date = new Date()
      date.setDate(date.getDate() - (props.days - 1 - i))
      return {
        date: format(date, 'yyyy-MM-dd'),
        active: false,
      }
    })

  const activeDatesSet = new Set(props.activeDates)
  days.forEach((day) => {
    day.active = activeDatesSet.has(day.date)
  })

  return days
})

const activeCount = computed(() => {
  return activityData.value.filter((day) => day.active).length
})
</script>

<template>
  <div class="activity-calendar font-mono">
    <StatsSectionHeader v-if="title" :title="title" />

    <div class="activity-grid">
      <div
        v-for="(day, index) in activityData"
        :key="index"
        class="activity-cell relative"
        :class="day.active ? 'active' : 'inactive'"
        :style="day.active ? { backgroundColor: activeColor } : {}"
        @mouseenter="showTooltip(index)"
        @mouseleave="hideTooltip()"
      >
        <div v-if="activeTooltipIndex === index" class="tooltip-custom">
          {{ formatTooltip(day) }}
        </div>
      </div>
    </div>

    <div
      class="flex justify-between text-zinc-500 mt-2 text-xs"
      style="line-height: 10px"
    >
      <span>PAST {{ days }} DAYS</span>
      <span>{{ activeCount }} ACTIVE DAYS</span>
    </div>
  </div>
</template>

<style scoped>
.activity-calendar {
  position: relative;
  overflow: visible;
}

.activity-grid {
  @apply grid gap-0.5 h-4;
  grid-template-columns: repeat(30, minmax(0, 1fr));
  overflow: visible;
}

.activity-cell {
  @apply w-full h-full rounded-[1px] transition-colors duration-300;
  @apply cursor-pointer;
}

.active {
  @apply bg-zinc-600 dark:bg-zinc-500;
}

.inactive {
  @apply bg-zinc-200/30 dark:bg-zinc-800/30;
}

.tooltip-custom {
  position: absolute;
  bottom: calc(100% + 8px);
  left: 50%;
  transform: translateX(-50%);
  width: max-content;
  max-width: 150px;
  white-space: nowrap;
  z-index: 50;
  background: #18181b;
  color: #fafafa;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 10px;
  pointer-events: none;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

@media (max-width: 639px) {
  .activity-grid {
    grid-template-columns: repeat(15, minmax(0, 1fr));
    grid-template-rows: repeat(2, 1fr);
  }
}
</style>
