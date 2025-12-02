<template>
  <div
    v-show="showGrid"
    class="pointer-events-none fixed inset-0 z-[999]"
    :style="gridStyle"
  >
    <!-- Sidebar column indicator -->
    <div class="debug-grid-sidebar"></div>
    <!-- Main content area indicator -->
    <div class="max-w-screen-xl mx-auto h-full relative">
      <div class="grid grid-cols-12 h-full">
        <div
          v-for="i in 12"
          :key="i"
          style="border-right: 1px solid rgba(34, 197, 94, 0.1)"
        ></div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useMagicKeys } from '@vueuse/core'

const showGrid = ref(false)

// Toggle with Cmd+G (Mac) or Ctrl+G (Windows/Linux)
const { ctrl_g, meta_g } = useMagicKeys()
watch([ctrl_g, meta_g], ([ctrlG, metaG]) => {
  if (ctrlG || metaG) {
    showGrid.value = !showGrid.value
  }
})

// 8px baseline grid with 32px (4x8) major lines
const gridStyle = {
  backgroundImage: `
    repeating-linear-gradient(
      to bottom,
      transparent,
      transparent 7px,
      rgba(59, 130, 246, 0.1) 7px,
      rgba(59, 130, 246, 0.1) 8px
    ),
    repeating-linear-gradient(
      to bottom,
      transparent,
      transparent 31px,
      rgba(59, 130, 246, 0.2) 31px,
      rgba(59, 130, 246, 0.2) 32px
    )
  `,
  backgroundSize: '100% 8px, 100% 32px',
}
</script>

<style scoped>
.debug-grid-sidebar {
  position: absolute;
  right: 0;
  top: 0;
  bottom: 0;
  width: 300px;
  background: rgba(34, 197, 94, 0.05);
  border-left: 1px dashed rgba(34, 197, 94, 0.2);
}

@media (max-width: 1280px) {
  .debug-grid-sidebar {
    display: none;
  }
}
</style>
