<template>
  <div class="sidenotes-wrapper">
    <!-- Main content -->
    <article ref="contentRef" class="prose">
      <slot />
    </article>

    <!-- Sidenotes margin -->
    <aside v-if="sidenotes.length > 0" class="sidenotes-margin">
      <!-- SVG curves overlay -->
      <svg class="sidenote-curves" :width="320" :height="containerHeight">
        <path
          v-for="curve in curves"
          :key="curve.id"
          :d="curve.path"
          :class="['sidenote-curve', { active: curve.active }]"
          stroke="currentColor"
          fill="none"
          stroke-width="1"
        />
      </svg>

      <!-- Sidenotes -->
      <div
        v-for="note in sidenotes"
        :key="note.id"
        :style="{
          position: 'absolute',
          top: `${note.notePosition.y}px`,
          left: '40px',
          width: 'calc(100% - 50px)'
        }"
        class="sidenote"
        @mouseenter="setActiveNote(note.id)"
        @mouseleave="setActiveNote(null)"
      >
        <sup class="sidenote-number">{{ note.number }}</sup>
        <span v-html="note.content" />
      </div>
    </aside>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useSidenotes } from '~/composables/useSidenotes'

const contentRef = ref<HTMLElement>()
const containerHeight = ref(1000)

const { sidenotes, curves, setActiveNote } = useSidenotes(contentRef)

// Update container height based on content
onMounted(() => {
  const updateHeight = () => {
    if (contentRef.value) {
      containerHeight.value = contentRef.value.scrollHeight
    }
  }

  updateHeight()
  window.addEventListener('resize', updateHeight)

  onUnmounted(() => {
    window.removeEventListener('resize', updateHeight)
  })
})

// Also handle hover on footnote refs in content
onMounted(() => {
  if (!contentRef.value) return

  const refs = contentRef.value.querySelectorAll('sup.footnote-ref a')
  refs.forEach((ref, index) => {
    const note = sidenotes.value[index]
    if (!note) return

    ref.addEventListener('mouseenter', () => setActiveNote(note.id))
    ref.addEventListener('mouseleave', () => setActiveNote(null))
  })
})
</script>

<style scoped>
.sidenotes-wrapper {
  display: grid;
  grid-template-columns: 1fr;
  position: relative;
}

@media (min-width: 1280px) {
  .sidenotes-wrapper {
    grid-template-columns: minmax(0, 65ch) 320px;
    gap: 2rem;
  }
}

.sidenotes-margin {
  display: none;
  position: relative;
}

@media (min-width: 1280px) {
  .sidenotes-margin {
    display: block;
  }
}

.sidenote-curves {
  position: absolute;
  top: 0;
  left: 0;
  pointer-events: none;
  z-index: 1;
}

.sidenote-curve {
  @apply text-zinc-400 dark:text-zinc-600;
  opacity: 0;
  transition: all 0.3s ease;
}

.sidenote-curve.active {
  @apply text-blue-500 dark:text-blue-400;
  opacity: 0.4;
}

.sidenote {
  @apply text-sm text-zinc-600 dark:text-zinc-400;
  transition: all 0.2s;
  z-index: 2;
  position: relative;
}

.sidenote:hover {
  @apply text-zinc-900 dark:text-zinc-100;
  transform: translateX(2px);
}

.sidenote-number {
  @apply text-blue-500 dark:text-blue-400 font-semibold mr-1;
}

/* Hide original footnotes section */
:deep(.footnotes) {
  @apply hidden;
}

/* Style the footnote references */
:deep(sup.footnote-ref) {
  @apply text-blue-500 dark:text-blue-400;
}

:deep(sup.footnote-ref:hover) {
  @apply text-blue-600 dark:text-blue-300;
}
</style>
