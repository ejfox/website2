<script setup lang="ts">
// EJ's live Paperclip presence emoji, rendered as plain text in our own type
// (never Paperclip's badge image). Data + the shared SSE stream live in
// usePaperclipStatus. The slot is always rendered at a fixed width so the
// emoji arriving, changing or vanishing never shifts the layout.
import { useNow } from '@vueuse/core'
import { usePaperclipStatus } from '~/composables/usePaperclipStatus'

withDefaults(defineProps<{ showTime?: boolean }>(), { showTime: false })

const status = usePaperclipStatus()

// Relative time is client-only: server and client clocks disagree, and a
// "3h ago" baked into SSR/prerendered HTML would be a hydration mismatch.
const mounted = ref(false)
onMounted(() => (mounted.value = true))
const now = useNow({ interval: 60_000 })

const ageMs = computed(() => {
  const t = Date.parse(status.value?.updated_at || '')
  return Number.isNaN(t) ? null : Math.max(0, now.value.getTime() - t)
})

const relative = computed(() => {
  if (ageMs.value === null) return ''
  const m = Math.floor(ageMs.value / 60_000)
  if (m < 1) return 'now'
  if (m < 60) return `${m}m`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h`
  return `${Math.floor(h / 24)}d`
})

const title = computed(() => {
  if (!mounted.value || !relative.value) return 'Paperclip status'
  const when = relative.value === 'now' ? 'just now' : `${relative.value} ago`
  return `Paperclip status, updated ${when}`
})

const label = computed(
  () =>
    `EJ's current status: ${status.value?.emoji} — ` +
    'on Paperclip, a presence app for friends'
)

const stale = computed(
  () => ageMs.value !== null && ageMs.value > 24 * 60 * 60 * 1000
)
</script>

<template>
  <span class="paperclip-status inline-flex items-baseline gap-1.5">
    <span class="paperclip-slot inline-block text-center">
      <Transition name="paperclip-fade" mode="out-in">
        <a
          v-if="status"
          :key="status.emoji"
          href="https://getpaperclipped.com"
          target="_blank"
          rel="noopener"
          class="no-underline"
          :class="{ 'opacity-50': mounted && stale }"
          :title="title"
          :aria-label="label"
        >
          {{ status.emoji }}
        </a>
      </Transition>
    </span>
    <span
      v-if="showTime && status && mounted && relative"
      class="font-mono text-3xs text-zinc-500 whitespace-nowrap"
    >
      {{ relative }}
    </span>
  </span>
</template>

<style scoped>
/* Emoji sized to the surrounding type; the slot reserves its width so
   nothing reflows when it loads, changes or hides. */
.paperclip-slot {
  font-size: 1.2em;
  width: 1.25em;
  line-height: 1;
}

.paperclip-fade-enter-active,
.paperclip-fade-leave-active {
  transition: opacity 100ms ease;
}
.paperclip-fade-enter-from,
.paperclip-fade-leave-to {
  opacity: 0;
}

@media (prefers-reduced-motion: reduce) {
  .paperclip-fade-enter-active,
  .paperclip-fade-leave-active {
    transition: none;
  }
}
</style>
