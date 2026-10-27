<!--
  @file NextAvailableSlot.vue
  @description Inline "next free slot" link for the homepage.
    Appends a " (9am Monday?)"-style booking link to the homepage's "grab
    some time on my calendar" sentence (pages/index.vue teleports it in).
    Fetches /api/cal/available-slots; re-fetches when the tab regains focus.
  @props mock?: { slots } - kitchen-sink only; skips the live data
-->
<script setup>
import { computed } from 'vue'

// Optional: inject a slots payload to preview/test (kitchen-sink) without the
// live cal.com fetch. Production never passes this.
const props = defineProps({ mock: { type: Object, default: null } })

const { data, refresh } = await useLazyFetch('/api/cal/available-slots', {
  // NOTE: `refresh` is not a documented useFetch option, so this interval
  // probably does nothing; the focus listener below is what re-fetches.
  refresh: 5 * 60 * 1000, // Refresh every 5 minutes
  default: () => ({ slots: [] }),
})

const nextSlot = computed(() => {
  const slots = props.mock?.slots ?? data.value?.slots
  if (!slots?.length) return null
  return slots[0] // First slot is the earliest
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

<template>
  <span class="next-available-slot group relative inline">
    <ClientOnly>
      <!-- Available slot - inline magic link. Renders nothing otherwise
           so the surrounding "grab some time on my calendar" link stands
           alone. -->
      <!-- The leading space lives here, so the sentence closes up cleanly
           when there's no slot. v-text keeps template whitespace out of the
           underline. -->
      <template v-if="nextSlot">
        {{ ' '
        }}<a
          :href="nextSlot.bookingUrl"
          data-umami-event="consulting-book"
          data-umami-event-location="next-available-slot"
          target="_blank"
          class="link-blue-underline"
          :title="`Book ${nextSlot.naturalTime} - 30min chat`"
          v-text="`(${nextSlot.naturalTime})`"
        />
      </template>
    </ClientOnly>
  </span>
</template>

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
