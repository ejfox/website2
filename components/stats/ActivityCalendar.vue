<template>
  <div class="activity-calendar font-mono">
    <h4 v-if="title" class="section-subheader">{{ title }}</h4>

    <!-- Activity Grid -->
    <div class="activity-grid">
      <div v-for="(day, index) in activityData" :key="index" 
          class="activity-cell"
          :class="day.active ? 'active' : 'inactive'"
          :style="day.active ? { backgroundColor: activeColor } : {}"
          :title="day.date + (day.active ? ': Active' : '')">
      </div>
    </div>

    <!-- Caption -->
    <div class="flex justify-between text-2xs text-zinc-500 mt-2">
      <span>PAST {{ days }} DAYS</span>
      <span>{{ activeCount }} ACTIVE DAYS</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { format } from 'date-fns'

interface ActivityDay {
  date: string
  active: boolean
}

const props = defineProps({
  // Days to show (default 30)
  days: {
    type: Number,
    default: 30
  },
  // Title above the calendar
  title: {
    type: String,
    default: 'ACTIVITY'
  },
  // Color for active days
  activeColor: {
    type: String,
    default: '#71717a'
  },
  // Array of active dates in YYYY-MM-DD format
  activeDates: {
    type: Array as () => string[],
    default: () => []
  },
  // Alternative: manually provide activity data
  customActivityData: {
    type: Array as () => ActivityDay[],
    default: null
  }
})

// Generate activity data based on props
const activityData = computed<ActivityDay[]>(() => {
  // If custom data is provided, use it
  if (props.customActivityData) {
    return props.customActivityData
  }

  // Create a days-long array of dates
  const days = Array(props.days).fill(null).map((_, i) => {
    const date = new Date()
    date.setDate(date.getDate() - (props.days - 1 - i))
    return {
      date: format(date, 'yyyy-MM-dd'),
      active: false
    }
  })

  // Set active days based on activeDates prop
  const activeDatesSet = new Set(props.activeDates)
  days.forEach(day => {
    day.active = activeDatesSet.has(day.date)
  })

  return days
})

// Count active days
const activeCount = computed(() => {
  return activityData.value.filter(day => day.active).length
})
</script>

<style scoped>
.section-subheader {
  @apply text-2xs tracking-[0.2em] text-zinc-500 border-b border-zinc-800/30 pb-1 mb-3;
}

.activity-grid {
  @apply grid gap-1 h-4;
  grid-template-columns: repeat(30, minmax(0, 1fr));
}

.activity-cell {
  @apply w-full h-full rounded-[1px] transition-colors duration-300;
}

.active {
  @apply bg-zinc-600 dark:bg-zinc-500;
}

.inactive {
  @apply bg-zinc-200/30 dark:bg-zinc-900/30;
}

/* Custom text size smaller than xs */
.text-2xs {
  font-size: 0.65rem;
  line-height: 1rem;
}

@media (max-width: 639px) {
  .activity-grid {
    grid-template-columns: repeat(15, minmax(0, 1fr));
    grid-template-rows: repeat(2, 1fr);
  }
}
</style> 