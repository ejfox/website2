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
  <div ref="el" class="bg-sunken overflow-hidden flex flex-col font-mono">
    <div class="flex items-center gap-1.5 px-2 py-0.5 border-b border-zinc-200 dark:border-zinc-800 text-3xs">
      <span class="truncate">
        <span v-if="!entry.stories" class="text-zinc-400 dark:text-zinc-600">*</span>{{ entry.name }}
      </span>
      <span v-if="entry.isClient" class="ml-auto text-zinc-400 dark:text-zinc-600">client</span>
      <span v-else-if="entry.isServer" class="ml-auto text-zinc-400 dark:text-zinc-600">server</span>
    </div>
    <div class="h-[280px] overflow-hidden p-4 flex items-center justify-center relative">
      <DevStoryRenderer
        v-if="show && entry.stories"
        :loader="entry.loader"
        :component-props="entry.stories[0].props"
        :wrapper="entry.stories[0].wrapper"
        :slot-text="entry.stories[0].slot || null"
      />
      <span v-else-if="show" class="text-3xs text-zinc-400 dark:text-zinc-600">no story</span>
      <span v-else class="text-3xs text-zinc-300 dark:text-zinc-700">…</span>
    </div>
  </div>
</template>
