<template>
  <span class="next-available-slot group relative inline">
    <!-- Prevent hydration mismatch by showing fallback initially -->
    <ClientOnly>
      <!-- Loading state -->
      <span v-if="pending" class="animate-pulse text-blue-600 dark:text-blue-400">
        what about...
      </span>
      
      <!-- Available slot - inline magic link -->
      <a 
        v-else-if="nextSlot"
        :href="nextSlot.bookingUrl"
        target="_blank"
        class="inline text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors duration-200 underline underline-offset-2"
        :title="`Book ${nextSlot.naturalTime} - 30min chat`"
      >
        ({{ nextSlot.naturalTime }})
      </a>
      
      <!-- Fallback to static calendar link -->
      <a 
        v-else
        href="https://cal.com/ejfox/30min"
        target="_blank"
        class="inline text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors duration-200 underline underline-offset-2"
        title="Book a 30min chat"
      >
        find some time on my calendar
      </a>
      
      <!-- Fallback for SSR -->
      <template #fallback>
        <a 
          href="https://cal.com/ejfox/30min"
          target="_blank"
          class="inline text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors duration-200 underline underline-offset-2"
          title="Book a 30min chat"
        >
          find some time on my calendar
        </a>
      </template>
    </ClientOnly>
  </span>
</template>

<script setup>
import { computed } from 'vue'

// Fetch the first available slot with auto-refresh
const { data, pending, error, refresh } = await useLazyFetch('/api/cal/available-slots', {
  refresh: 5 * 60 * 1000, // Refresh every 5 minutes
  default: () => ({ slots: [] })
})


// Get the very next available slot
const nextSlot = computed(() => {
  if (!data.value?.slots?.length) return null
  return data.value.slots[0] // First slot is the earliest
})

// Refresh on window focus (when user returns to tab)
onMounted(() => {
  const handleFocus = () => {
    // Don't refresh immediately, add a small delay to prevent spam
    setTimeout(() => {
      if (document.hasFocus()) {
        refresh()
      }
    }, 1000)
  }
  
  window.addEventListener('focus', handleFocus)
  
  onUnmounted(() => {
    window.removeEventListener('focus', handleFocus)
  })
})
</script>

<style scoped>
.next-available-slot {
  position: relative;
}

/* Override any parent styling and ensure consistent link appearance */
.next-available-slot a {
  font-size: inherit !important;
  font-weight: inherit !important;
  line-height: inherit !important;
  vertical-align: baseline !important;
}
</style>