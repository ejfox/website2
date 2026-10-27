<!--
  @file NextAvailableSlot.vue
  @description Inline "next free slot" link for the homepage.
    Appends a " (9am Monday?)"-style booking link to the homepage's "grab
    some time on my calendar" sentence (pages/index.vue teleports it in).
    Fetches /api/cal/available-slots; re-fetches every 5 min and when the
    tab regains focus.
  @props mock?: { slots } - kitchen-sink only; skips the live data
-->
<script setup>
import { computed } from 'vue'
import { useEventListener, useIntervalFn } from '@vueuse/core'

// Optional: inject a slots payload to preview/test (kitchen-sink) without the
// live cal.com fetch. Production never passes this.
const props = defineProps({ mock: { type: Object, default: null } })

const { data, refresh } = await useLazyFetch('/api/cal/available-slots', {
  default: () => ({ slots: [] }),
})

const nextSlot = computed(() => {
  const slots = props.mock?.slots ?? data.value?.slots
  if (!slots?.length) return null
  return slots[0] // First slot is the earliest
})

// ── Refresh: every 5 min, and on tab focus ──────────────────
// Started in onMounted, not at setup, so SSR never holds an interval open.
const { resume } = useIntervalFn(() => refresh(), 5 * 60 * 1000, {
  immediate: false,
})
onMounted(() => {
  if (!props.mock) resume()
})

// The 1s delay keeps a quick alt-tab from firing a fetch.
useEventListener('focus', () => {
  if (props.mock) return
  setTimeout(() => {
    if (document.hasFocus()) refresh()
  }, 1000)
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
