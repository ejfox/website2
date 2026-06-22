<script setup>
// One cell of the kitchen-sink contact sheet. Mounts its live preview only when
// scrolled into view, so a page full of D3/canvas/3D components doesn't try to
// boot all of them at once. Used only by /kitchen-sink?gallery=1 for QA sweeps.
import { ref } from 'vue'
import { useIntersectionObserver } from '@vueuse/core'

defineProps({ entry: { type: Object, required: true } })

const el = ref(null)
const show = ref(false)
const { stop } = useIntersectionObserver(el, ([e]) => {
  if (e?.isIntersecting) {
    show.value = true
    stop()
  }
})
</script>

<template>
  <div
    ref="el"
    class="rounded border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden flex flex-col"
  >
    <div class="flex items-center gap-1.5 px-2 py-1 border-b border-zinc-100 dark:border-zinc-800/60">
      <span class="font-mono text-[10px] truncate">{{ entry.name }}</span>
      <span v-if="entry.isClient" class="ml-auto font-mono text-[9px] text-sky-500">client</span>
      <span v-else-if="entry.isServer" class="ml-auto font-mono text-[9px] text-violet-500">server</span>
    </div>
    <div class="h-[150px] overflow-hidden p-2 flex items-center justify-center relative">
      <DevStoryRenderer
        v-if="show && entry.stories"
        :loader="entry.loader"
        :component-props="entry.stories[0].props"
        :wrapper="entry.stories[0].wrapper"
        :slot-text="entry.stories[0].slot || null"
      />
      <span v-else-if="show" class="font-mono text-[10px] text-amber-500">no story</span>
      <span v-else class="font-mono text-[10px] text-zinc-300 dark:text-zinc-700">…</span>
    </div>
  </div>
</template>
