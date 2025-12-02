<template>
  <div class="calendar-toc">
    <div class="py-4">
      <h3 class="label-tracked-sm">Next Available</h3>

      <!-- Loading state -->
      <div v-if="pending" class="space-y-2">
        <div v-for="i in 3" :key="i" class="animate-pulse">
          <div class="h-3 bg-zinc-200 dark:bg-zinc-700 rounded mb-1"></div>
          <div class="h-2 bg-zinc-150 dark:bg-zinc-750 rounded w-3/4"></div>
        </div>
      </div>

      <!-- Available slots -->
      <div v-else-if="data?.slots?.length" class="space-y-4">
        <a
          v-for="(slot, index) in data.slots"
          :key="slot.datetime"
          :href="slot.bookingUrl"
          target="_blank"
          class="card-bordered-hover"
        >
          <div class="flex items-center justify-between">
            <div class="flex-1 min-w-0">
              <div :class="slotTimeClasses">
                {{ slot.time }}
              </div>
              <div class="text-xs text-zinc-500 dark:text-zinc-400 truncate">
                {{ slot.date }}
              </div>
            </div>
            <div :class="slotArrowClasses">
              <svg
                class="w-3 h-3 ml-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  :d="externalLinkSvgPath"
                ></path>
              </svg>
            </div>
          </div>

          <!-- Subtle slot number indicator -->
          <div :class="slotIndicatorClasses(index)"></div>
        </a>
      </div>

      <!-- No slots available -->
      <div v-else-if="!pending" class="text-center py-4">
        <div class="text-sm text-zinc-500 dark:text-zinc-400 mb-2">
          No slots this week
        </div>
        <a
          href="https://cal.com/ejfox/30min"
          target="_blank"
          class="text-xs text-blue-600 dark:text-blue-400 hover:underline"
        >
          View full calendar →
        </a>
      </div>

      <!-- Refresh indicator -->
      <div
        v-if="data?.lastUpdated"
        class="mt-4 pt-4 border-t border-zinc-200/30 dark:border-zinc-700/30"
      >
        <div class="text-xs text-zinc-400 dark:text-zinc-500 text-center">
          Updated {{ formatRelativeTime(data.lastUpdated) }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

// SVG constants
const externalLinkSvgPath =
  'M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14'

// Computed class strings
const slotTimeClasses = computed(() => [
  'text-sm font-medium',
  'text-zinc-900 dark:text-zinc-100',
  'group-hover:text-blue-600 dark:group-hover:text-blue-400',
  'transition-colors',
])

const slotArrowClasses = computed(() => [
  'flex items-center',
  'text-zinc-400 dark:text-zinc-500',
  'group-hover:text-blue-500',
  'transition-colors',
])

// Slot indicator classes based on position
const slotIndicatorClasses = (index) =>
  computed(() => [
    'absolute -left-2 top-1/2 transform -translate-y-1/2',
    'w-1 h-6 rounded-full transition-all duration-200',
    index === 0
      ? 'bg-green-500'
      : index === 1
        ? 'bg-yellow-500'
        : 'bg-blue-500',
    'opacity-0 group-hover:opacity-100',
  ])

// Fetch available slots with auto-refresh every 5 minutes
const { data, pending, refresh } = await useLazyFetch(
  '/api/cal/available-slots',
  {
    refresh: 5 * 60 * 1000, // 5 minutes
    default: () => ({ slots: [] }),
  }
)

// Format relative time
function formatRelativeTime(datetime) {
  const now = new Date()
  const time = new Date(datetime)
  const diffMs = now.getTime() - time.getTime()
  const diffMins = Math.floor(diffMs / 60000)

  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins}m ago`

  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `${diffHours}h ago`

  const diffDays = Math.floor(diffHours / 24)
  return `${diffDays}d ago`
}

// Auto-refresh on focus (when user returns to tab)
onMounted(() => {
  const handleFocus = () => refresh()
  window.addEventListener('focus', handleFocus)

  onUnmounted(() => {
    window.removeEventListener('focus', handleFocus)
  })
})
</script>

<style scoped>
.calendar-toc {
  position: relative;
}

.calendar-toc a {
  position: relative;
  overflow: hidden;
}

/* Subtle shimmer effect on hover */
.calendar-toc a::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.1),
    transparent
  );
  transition: left 0.3s ease;
}

.calendar-toc a:hover::before {
  left: 100%;
}
</style>
